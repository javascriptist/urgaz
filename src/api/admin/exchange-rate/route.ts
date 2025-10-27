import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import * as fs from "fs"
import * as path from "path"

export const AUTHENTICATE = true

// Storage path for exchange rate
const STORAGE_PATH = path.join(process.cwd(), "data", "exchange-rate.json")

// Ensure data directory exists
const ensureDataDir = () => {
  const dataDir = path.join(process.cwd(), "data")
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
}

// Read rate from file
const readRate = (): number => {
  try {
    ensureDataDir()
    if (fs.existsSync(STORAGE_PATH)) {
      const data = fs.readFileSync(STORAGE_PATH, "utf-8")
      const parsed = JSON.parse(data)
      return parsed.rate || 12750
    }
  } catch (e) {
    console.error("Error reading exchange rate file:", e)
  }
  return 12750 // Default fallback
}

// Write rate to file
const writeRate = (rate: number) => {
  try {
    ensureDataDir()
    const data = {
      rate,
      updated_at: new Date().toISOString()
    }
    fs.writeFileSync(STORAGE_PATH, JSON.stringify(data, null, 2))
    // Also store in global for quick access
    ;(global as any).exchangeRate = rate
  } catch (e) {
    console.error("Error writing exchange rate file:", e)
    throw e
  }
}

// GET /admin/exchange-rate - Get current USD to UZS exchange rate
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const rate = readRate()
    
    return res.json({ rate })
  } catch (e: any) {
    console.error("Error fetching exchange rate:", e)
    return res.status(500).json({ 
      message: e.message,
      error: e.toString() 
    })
  }
}

// POST /admin/exchange-rate - Update USD to UZS exchange rate
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { rate } = req.body as { rate: number }

  if (!rate || isNaN(rate) || rate <= 0) {
    return res.status(400).json({ message: "Valid rate is required" })
  }

  try {
    writeRate(rate)
    console.log("Exchange rate updated:", rate)

    return res.json({
      success: true,
      message: "Exchange rate updated successfully",
      rate
    })
  } catch (e: any) {
    console.error("Error updating exchange rate:", e)
    return res.status(500).json({ 
      message: e.message,
      error: e.toString() 
    })
  }
}
