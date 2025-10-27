import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import * as fs from "fs"
import * as path from "path"

// Disable authentication for this endpoint
export const AUTHENTICATE = false

// Storage path for exchange rate
const STORAGE_PATH = path.join(process.cwd(), "data", "exchange-rate.json")

// Read rate from file
const readRate = (): number => {
  try {
    if (fs.existsSync(STORAGE_PATH)) {
      const data = fs.readFileSync(STORAGE_PATH, "utf-8")
      const parsed = JSON.parse(data)
      return parsed.rate || 12750
    }
  } catch (e) {
    console.error("Error reading exchange rate file:", e)
  }
  // Check global as fallback
  return (global as any).exchangeRate || 12750
}

// GET /store/exchange-rate - Public endpoint for storefront to get USD to UZS rate
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const rate = readRate()
    
    console.log("Storefront requested exchange rate:", rate)

    return res.json({ 
      rate,
      currency_from: "USD",
      currency_to: "UZS",
      updated_at: new Date().toISOString()
    })
  } catch (e: any) {
    console.error("Error fetching exchange rate for storefront:", e)
    // Return default rate on error
    return res.json({ 
      rate: 12750,
      currency_from: "USD",
      currency_to: "UZS",
      updated_at: new Date().toISOString()
    })
  }
}
