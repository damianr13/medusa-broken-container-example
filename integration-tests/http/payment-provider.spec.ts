import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import seedBase from "../../src/scripts/seed"
import { createCartWorkflow, createPaymentCollectionForCartWorkflow, createPaymentSessionsWorkflow } from "@medusajs/medusa/core-flows"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { Modules } from "@medusajs/framework/utils"


async function seed(container: MedusaContainer) {
  await seedBase({ container, args: [] })
  const regionModuleService = container.resolve(Modules.REGION)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const pricingModuleService = container.resolve(Modules.PRICING)
  const [defaultRegion] = await regionModuleService.listRegions({}, {
    relations: ["countries"]
  })

  const pricingContext = {
    context: {
      region_id: defaultRegion.id,
      currency_code: "eur",
      country_code: defaultRegion.countries[0].iso_2,
    }
  }

  const products = await query.graph({
    entity: 'product',
    fields: ['id', 'title', 'variants.*', 'variants.id', 'variants.price_set.*'],
    filters: {
      title: 'Medusa T-Shirt'
    }
  })

  const product1 = products.data[0]
  const prices = await pricingModuleService.calculatePrices({
    id: [product1.variants[0].price_set!.id],
  }, pricingContext)
  const priceForProduct1 = prices.find((p) => p.id === product1.variants[0].price_set!.id)

  await createCartWorkflow(container).run({
    input: {
      // @ts-ignore - the type checking from medusa does not allow ids but if we set them it works
      id: "example-cart",
      currency_code: "eur",
      region_id: defaultRegion.id,
      country_code: defaultRegion.countries[0].iso_2,
      items: [{
        product_id: product1.id,
        variant_id: product1.variants[0].id,
        quantity: 1,
        title: product1.title,
        unit_price: priceForProduct1!.calculated_amount ?? 0,
      }] // total : 1000
    },
  })

  await createPaymentCollectionForCartWorkflow(container).run({
    input: {
      cart_id: "example-cart",
    },
  })

  const { data: [{ payment_collection: paymentCollection1 }] } = await query.graph({
    entity: "cart",
    fields: ["id", "payment_collection.*"],
    filters: {
      id: "example-cart",
    },
  })

  await createPaymentSessionsWorkflow(container).run({
    input: {
      payment_collection_id: paymentCollection1.id,
      provider_id: "pp_custom_test",
    },
  })
}

medusaIntegrationTestRunner({
  testSuite: async ({ getContainer }) => {
    beforeEach(async () => {
      await seed(getContainer())
    })
    describe("Test that the seed works", () => {
      test("should pass with checked out cart", async () => {
        // Check that the test passes after the seed.
        // At the moment this fails because of the payemnt provider error
        expect(true).toBe(true)
      })
    })
  }
})