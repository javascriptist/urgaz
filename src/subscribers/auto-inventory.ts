import { SubscriberConfig, SubscriberArgs } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { createInventoryLevelsWorkflow } from "@medusajs/medusa/core-flows"

export default async function productCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const productId = data.id

  console.log(`🔧 Auto-inventory: Product created (${productId}), setting up inventory...`)

  try {
    const query = container.resolve("query")

    // Get product with variants and inventory items
    const { data: products } = await query.graph({
      entity: "product",
      fields: [
        "id",
        "title",
        "variants.*",
        "variants.inventory_items.*",
        "variants.inventory_items.inventory.*",
      ],
      filters: { id: productId },
    })

    const product = products[0]
    if (!product || !product.variants || product.variants.length === 0) {
      console.log(`⚠️ Auto-inventory: No variants found for product ${productId}`)
      return
    }

    // Get the default stock location
    const stockLocationModule = container.resolve(Modules.STOCK_LOCATION)
    const stockLocations = await stockLocationModule.listStockLocations({})
    
    if (!stockLocations || stockLocations.length === 0) {
      console.log(`⚠️ Auto-inventory: No stock location found, skipping inventory setup`)
      return
    }

    const stockLocation = stockLocations[0]

    // Create inventory levels for each variant
    const inventoryLevelsToCreate = []

    for (const variant of product.variants) {
      // Check if variant already has inventory items
      if (!variant.inventory_items || variant.inventory_items.length === 0) {
        console.log(`⚠️ Auto-inventory: Variant ${variant.id} has no inventory items, skipping`)
        continue
      }

      const inventoryItem = variant.inventory_items[0]?.inventory
      if (!inventoryItem) {
        console.log(`⚠️ Auto-inventory: No inventory item found for variant ${variant.id}`)
        continue
      }

      // Check if inventory level already exists
      const inventoryModule = container.resolve(Modules.INVENTORY)
      const existingLevels = await inventoryModule.listInventoryLevels({
        inventory_item_id: inventoryItem.id,
        location_id: stockLocation.id,
      })

      if (existingLevels && existingLevels.length > 0) {
        console.log(`✓ Auto-inventory: Variant ${variant.id} already has inventory level, skipping`)
        continue
      }

      // Add to batch creation
      inventoryLevelsToCreate.push({
        inventory_item_id: inventoryItem.id,
        location_id: stockLocation.id,
        stocked_quantity: 3,
      })
    }

    if (inventoryLevelsToCreate.length === 0) {
      console.log(`✓ Auto-inventory: All variants already have inventory levels`)
      return
    }

    // Create inventory levels using workflow
    await createInventoryLevelsWorkflow(container).run({
      input: {
        inventory_levels: inventoryLevelsToCreate,
      },
    })

    console.log(`✅ Auto-inventory: Set stock to 3 for ${inventoryLevelsToCreate.length} variant(s) in product "${product.title}"`)
  } catch (error) {
    console.error(`❌ Auto-inventory: Error setting up inventory for product ${productId}:`, error)
  }
}

export const config: SubscriberConfig = {
  event: "product.created",
}
