import { useState, useEffect } from "react"
import { Container, Heading, Table, Input, Button, Badge } from "@medusajs/ui"
import { useNavigate } from "react-router-dom"

interface Product {
  id: string
  title: string
  handle: string
  status: string
  collection?: {
    id: string
    title: string
  }
  metadata?: {
    attributes?: {
      size?: string
      shape?: string
      design_code?: string
      color?: string
      meter_square?: string
    }
  }
}

const ProductsInventoryPage = () => {
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [collections, setCollections] = useState<Array<{ id: string; title: string }>>([])
  const [loading, setLoading] = useState(false)
  const [collectionSearch, setCollectionSearch] = useState("")
  const [showCollectionDropdown, setShowCollectionDropdown] = useState(false)
  const [filters, setFilters] = useState({
    size: "",
    shape: "",
    design_code: "",
    color: "",
    meter_square: "",
    q: "",
    collection_id: "",
  })

  const fetchProducts = async () => {
    setLoading(true)
    try {
      // Build query string for filters
      const params = new URLSearchParams()
      if (filters.q) params.append("q", filters.q)
      if (filters.collection_id) params.append("collection_id", filters.collection_id)
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value && key !== "q" && key !== "collection_id") {
          params.append(`attr[${key}]`, value)
        }
      })

      const url = `/admin/products/by-attributes?${params.toString()}&limit=100`
      console.log("Fetching:", url)
      const response = await fetch(url, {
        credentials: "include",
      })
      
      console.log("Response status:", response.status)
      if (response.ok) {
        const data = await response.json()
        console.log("Received data:", data)
        setProducts(data.products || [])
      } else {
        const errorText = await response.text()
        console.error("Failed to fetch products:", response.status, errorText)
      }
    } catch (error) {
      console.error("Failed to fetch products:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCollections = async () => {
    try {
      // Try the correct Medusa v2 endpoint
      const response = await fetch("/admin/collections?limit=100", {
        credentials: "include",
      })
      console.log("Collections response status:", response.status)
      if (response.ok) {
        const data = await response.json()
        console.log("Collections response data:", data)
        // Try different possible response structures
        const collectionsList = data.collections || data.product_collections || []
        console.log("Fetched collections:", collectionsList)
        setCollections(collectionsList)
      } else {
        const errorText = await response.text()
        console.error("Collections fetch failed:", response.status, errorText)
      }
    } catch (error) {
      console.error("Failed to fetch collections:", error)
    }
  }

  useEffect(() => {
    fetchProducts()
    fetchCollections()
  }, [])

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleSearch = () => {
    fetchProducts()
  }

  const handleCollectionSelect = (collectionId: string, collectionTitle: string) => {
    setFilters((prev) => ({ ...prev, collection_id: collectionId }))
    setCollectionSearch(collectionTitle)
    setShowCollectionDropdown(false)
  }

  const filteredCollections = collections.filter((col) =>
    col.title.toLowerCase().includes(collectionSearch.toLowerCase())
  )

  console.log("Collections:", collections.length, "Filtered:", filteredCollections.length, "Search:", collectionSearch, "Show dropdown:", showCollectionDropdown)

  const selectedCollection = collections.find((col) => col.id === filters.collection_id)

  const handleClearFilters = () => {
    setFilters({
      size: "",
      shape: "",
      design_code: "",
      color: "",
      meter_square: "",
      q: "",
      collection_id: "",
    })
    setCollectionSearch("")
    setTimeout(() => fetchProducts(), 100)
  }

  return (
    <Container>
      <div className="flex items-center justify-between mb-6">
        <Heading level="h1">Products Inventory & Attributes</Heading>
      </div>

      {/* Filters */}
      <div className="border border-ui-border-base rounded-lg p-4 mb-6">
        <Heading level="h3" className="mb-4">Filters</Heading>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-ui-fg-subtle">Search</label>
            <Input
              placeholder="Search by title..."
              value={filters.q}
              onChange={(e) => handleFilterChange("q", e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-ui-fg-subtle">Size</label>
            <Input
              placeholder="e.g., 4.5x2.5"
              value={filters.size}
              onChange={(e) => handleFilterChange("size", e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-ui-fg-subtle">Shape</label>
            <Input
              placeholder="e.g., round, oval"
              value={filters.shape}
              onChange={(e) => handleFilterChange("shape", e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-ui-fg-subtle">Design Code</label>
            <Input
              placeholder="e.g., ABC123"
              value={filters.design_code}
              onChange={(e) => handleFilterChange("design_code", e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-ui-fg-subtle">Color</label>
            <Input
              placeholder="e.g., red"
              value={filters.color}
              onChange={(e) => handleFilterChange("color", e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-ui-fg-subtle">Meter Square</label>
            <Input
              type="number"
              placeholder="e.g., 11.25"
              value={filters.meter_square}
              onChange={(e) => handleFilterChange("meter_square", e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <div className="relative">
            <label className="block text-sm font-medium mb-1 text-ui-fg-subtle">Collection</label>
            <Input
              placeholder="Search collection..."
              value={collectionSearch}
              onChange={(e) => {
                console.log("Collection input changed:", e.target.value)
                setCollectionSearch(e.target.value)
                setShowCollectionDropdown(true)
                if (!e.target.value) {
                  setFilters((prev) => ({ ...prev, collection_id: "" }))
                }
              }}
              onFocus={() => {
                console.log("Collection input focused")
                setShowCollectionDropdown(true)
              }}
              onBlur={() => {
                // Delay hiding to allow click on dropdown
                setTimeout(() => setShowCollectionDropdown(false), 200)
              }}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
            {showCollectionDropdown && filteredCollections.length > 0 && (
              <div 
                className="absolute z-50 w-full mt-1 bg-ui-bg-base border border-ui-border-base rounded-lg shadow-elevation-flyout max-h-60 overflow-auto"
                onMouseDown={(e) => e.preventDefault()} // Prevent input blur when clicking dropdown
              >
                {filteredCollections.map((collection) => (
                  <div
                    key={collection.id}
                    className="px-3 py-2 cursor-pointer hover:bg-ui-bg-base-hover text-ui-fg-base transition-colors"
                    onClick={() => handleCollectionSelect(collection.id, collection.title)}
                  >
                    {collection.title}
                  </div>
                ))}
              </div>
            )}
            {selectedCollection && (
              <div className="mt-1 text-xs text-ui-fg-subtle">
                Selected: {selectedCollection.title}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSearch} disabled={loading}>
            {loading ? "Searching..." : "Search"}
          </Button>
          <Button variant="secondary" onClick={handleClearFilters}>
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Results Table */}
      <div className="rounded-lg border border-ui-border-base overflow-hidden">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Product</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Collection</Table.HeaderCell>
              <Table.HeaderCell>Size</Table.HeaderCell>
              <Table.HeaderCell>Shape</Table.HeaderCell>
              <Table.HeaderCell>Design Code</Table.HeaderCell>
              <Table.HeaderCell>Color</Table.HeaderCell>
              <Table.HeaderCell>m²</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {loading ? (
              <Table.Row>
                <Table.Cell className="text-center py-8 text-ui-fg-subtle">
                  Loading...
                </Table.Cell>
              </Table.Row>
            ) : products.length === 0 ? (
              <Table.Row>
                <Table.Cell className="text-center py-8 text-ui-fg-muted">
                  No products found
                </Table.Cell>
              </Table.Row>
            ) : (
              products.map((product) => {
                const attrs = product.metadata?.attributes || {}
                
                return (
                  <Table.Row
                    key={product.id}
                    className="cursor-pointer hover:bg-ui-bg-subtle-hover transition-colors"
                    onClick={() => navigate(`/products/${product.id}`)}
                  >
                    <Table.Cell>
                      <div>
                        <div className="font-medium text-ui-fg-base">{product.title}</div>
                        <div className="text-sm text-ui-fg-subtle">{product.handle}</div>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge
                        color={
                          product.status === "published"
                            ? "green"
                            : product.status === "draft"
                            ? "orange"
                            : "red"
                        }
                      >
                        {product.status}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell className="text-ui-fg-subtle">
                      {product.collection?.title || "-"}
                    </Table.Cell>
                    <Table.Cell className="text-ui-fg-subtle">{attrs.size || "-"}</Table.Cell>
                    <Table.Cell className="text-ui-fg-subtle">{attrs.shape || "-"}</Table.Cell>
                    <Table.Cell className="text-ui-fg-subtle">{attrs.design_code || "-"}</Table.Cell>
                    <Table.Cell className="text-ui-fg-subtle">{attrs.color || "-"}</Table.Cell>
                    <Table.Cell className="text-ui-fg-subtle">{attrs.meter_square || "-"}</Table.Cell>
                  </Table.Row>
                )
              })
            )}
          </Table.Body>
        </Table>
      </div>

      <div className="mt-4 text-sm text-ui-fg-subtle">
        Showing {products.length} product{products.length !== 1 ? "s" : ""}
      </div>
    </Container>
  )
}

export default ProductsInventoryPage
