import {
  CreatePaymentProviderSession,
  MedusaContainer
} from "@medusajs/framework/types"
import SystemBase from "@medusajs/payment/dist/providers/system"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

class CustomProviderService extends SystemBase {
  static identifier = "custom"

  constructor(container: MedusaContainer, options: Record<string, unknown>) {
    super(container, options)
  }

  get paymentIntentOptions(): Record<string, unknown> {
    return {}
  }

  async initiatePayment(
    input: CreatePaymentProviderSession
  ) {
    const logger = this.container.resolve(ContainerRegistrationKeys.LOGGER)
    logger.info("initiatePayment")

    return super.initiatePayment(input)
  }
}

export default CustomProviderService