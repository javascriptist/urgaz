import { Migration } from '@mikro-orm/migrations';

export class Migration20261103181429 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "payme_setting" ("id" text not null, "value" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "payme_setting_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payme_setting_deleted_at" ON "payme_setting" (deleted_at) WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "payme_transaction" ("id" text not null, "order_key" text not null, "order_id" text null, "amount" numeric not null, "state" integer not null, "create_time" timestamptz not null, "perform_time" timestamptz null, "cancel_time" timestamptz null, "reason" integer null, "raw_amount" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "payme_transaction_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payme_transaction_order_key" ON "payme_transaction" (order_key) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payme_transaction_deleted_at" ON "payme_transaction" (deleted_at) WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "payme_setting" cascade;`);

    this.addSql(`drop table if exists "payme_transaction" cascade;`);
  }

}
