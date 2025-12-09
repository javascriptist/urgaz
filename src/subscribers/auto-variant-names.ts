import { SubscriberConfig, SubscriberArgs } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

export default async function productVariantCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const variantId = data.id

  console.log(`🏷️ Auto-naming: Variant created (${variantId}), generating unique name...`)

  try {
    const query = container.resolve("query")
    const productModule = container.resolve(Modules.PRODUCT)

    // Get variant with product info and options
    const { data: variants } = await query.graph({
      entity: "product_variant",
      fields: [
        "id",
        "title",
        "sku",
        "product_id",
        "product.title",
        "options.*",
        "options.option.*",
      ],
      filters: { id: variantId },
    })

    const variant = variants[0]
    if (!variant) {
      console.log(`⚠️ Auto-naming: Variant ${variantId} not found`)
      return
    }

    // Skip if variant already has a custom title/SKU
    if (variant.title && variant.title !== "Default" && !variant.title.includes("Default")) {
      console.log(`✓ Auto-naming: Variant ${variantId} already has custom title: "${variant.title}"`)
      return
    }

    const productTitle = variant.product?.title || "Product"
    
    // Generate title and SKU from product title and options
    let variantTitle = productTitle
    let variantSKU = productTitle.toUpperCase().replace(/\s+/g, "-").replace(/[^A-Z0-9-]/g, "")
    
    if (variant.options && variant.options.length > 0) {
      const optionValues = variant.options
        .map((opt: any) => opt.option?.value || opt.value)
        .filter(Boolean)
        .join(" / ")
      
      if (optionValues) {
        variantTitle = `${productTitle} - ${optionValues}`
        
        // Create SKU from option values
        const optionSKU = variant.options
          .map((opt: any) => {
            const value = opt.option?.value || opt.value
            return value ? value.toUpperCase().replace(/\s+/g, "-").replace(/[^A-Z0-9-]/g, "") : ""
          })
          .filter(Boolean)
          .join("-")
        
        variantSKU = `${variantSKU}-${optionSKU}`
      }
    }

    // Update variant with new title and SKU
    await productModule.updateProductVariants(variantId, {
      title: variantTitle,
      sku: variant.sku || variantSKU, // Only set SKU if it doesn't exist
    })

    console.log(`✅ Auto-naming: Updated variant ${variantId}:`)
    console.log(`   Title: "${variantTitle}"`)
    console.log(`   SKU: "${variant.sku || variantSKU}"`)
  } catch (error) {
    console.error(`❌ Auto-naming: Error updating variant ${variantId}:`, error)
  }
}

export const config: SubscriberConfig = {
  event: "product_variant.created",
}
