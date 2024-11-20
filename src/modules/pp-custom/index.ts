import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import CustomProviderService from "./service"

const services = [
  CustomProviderService,
]

export default ModuleProvider(Modules.PAYMENT, {
  services,
})