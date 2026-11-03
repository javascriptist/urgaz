import { Module } from "@medusajs/framework/utils"
import PaymeModuleService from "./service"

export const PAYME_MODULE = "payme"

export default Module(PAYME_MODULE, {
  service: PaymeModuleService,
})
