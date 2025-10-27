import { Migration } from "@mikro-orm/migrations"

export class AddProductMetadataGinIndex20251001 extends Migration {
  async up(): Promise<void> {
    this.addSql(`CREATE INDEX IF NOT EXISTS idx_product_metadata_gin ON "product" USING GIN ("metadata" jsonb_path_ops)`)
  }

  async down(): Promise<void> {
    this.addSql(`DROP INDEX IF EXISTS idx_product_metadata_gin`)
  }
}