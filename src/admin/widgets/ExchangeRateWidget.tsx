import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Input, Label, Button, toast } from "@medusajs/ui"
import { useState, useEffect } from "react"

const ExchangeRateWidget = () => {
  const [rate, setRate] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [cbuRate, setCbuRate] = useState<number | null>(null)
  const [cbuLoading, setCbuLoading] = useState(false)

  // Fetch CBU (Central Bank of Uzbekistan) rate
  const fetchCBURate = async () => {
    setCbuLoading(true)
    try {
      const response = await fetch("https://cbu.uz/uz/arkhiv-kursov-valyut/json/")
      if (response.ok) {
        const data = await response.json()
        // Find USD rate (Code: "840")
        const usdRate = data.find((item: any) => item.Ccy === "USD")
        if (usdRate && usdRate.Rate) {
          setCbuRate(parseFloat(usdRate.Rate))
        }
      }
    } catch (error) {
      console.error("Error fetching CBU rate:", error)
      toast.error("Could not fetch Markaziy Bank rate")
    } finally {
      setCbuLoading(false)
    }
  }

  // Fetch current exchange rate
  const fetchRate = async () => {
    setFetching(true)
    try {
      const response = await fetch("/admin/exchange-rate", {
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        if (data.rate) {
          setRate(data.rate.toString())
        }
      }
    } catch (error) {
      console.error("Error fetching exchange rate:", error)
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => {
    fetchRate()
    fetchCBURate()
  }, [])

  const handleSave = async () => {
    if (!rate || isNaN(Number(rate)) || Number(rate) <= 0) {
      toast.error("Please enter a valid exchange rate")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/admin/exchange-rate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ rate: Number(rate) }),
      })

      if (response.ok) {
        toast.success("Exchange rate updated successfully!")
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to update exchange rate")
      }
    } catch (error) {
      console.error("Error saving exchange rate:", error)
      toast.error("Failed to update exchange rate")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container className="mb-6">
      <div className="p-6">
        <Heading level="h2" className="mb-4">USD to UZS Exchange Rate</Heading>
        <p className="text-sm text-ui-fg-subtle mb-4">
          Set the exchange rate for converting USD prices to UZS on the storefront. 
          Customers will see prices in UZS, but all calculations are done in USD.
        </p>

        {/* CBU Rate Suggestion */}
        {cbuRate && (
          <div className="mb-4 p-3 bg-ui-bg-highlight rounded-md border border-ui-border-base">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ui-fg-base">
                  O'zbekiston Markaziy Bank kursi
                </p>
                <p className="text-xs text-ui-fg-subtle mt-1">
                  Current rate from Central Bank of Uzbekistan
                </p>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-lg font-bold text-ui-fg-base">
                  {cbuRate.toLocaleString()} UZS
                </p>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => setRate(cbuRate.toString())}
                >
                  Use This Rate
                </Button>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex gap-4 items-end max-w-md">
          <div className="flex-1">
            <Label htmlFor="exchange-rate">1 USD equals (UZS)</Label>
            <Input
              id="exchange-rate"
              type="number"
              placeholder="12750"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              disabled={fetching}
              step="0.01"
              min="0"
            />
            <p className="text-xs text-ui-fg-muted mt-1">
              Example: If 1 USD = 12,750 UZS, enter 12750
            </p>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={loading || fetching}
            size="base"
          >
            {loading ? "Saving..." : "Save Rate"}
          </Button>
        </div>

        {rate && Number(rate) > 0 && (
          <div className="mt-4 p-3 bg-ui-bg-subtle rounded-md">
            <p className="text-sm text-ui-fg-base">
              <strong>Preview:</strong> $1.00 USD = {Number(rate).toLocaleString()} UZS
              {" | "}
              $100.00 USD = {(Number(rate) * 100).toLocaleString()} UZS
            </p>
          </div>
        )}

        {cbuLoading && (
          <p className="text-xs text-ui-fg-muted mt-4">
            Loading Markaziy Bank rate...
          </p>
        )}
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "price_list.list.after",
})

export default ExchangeRateWidget
