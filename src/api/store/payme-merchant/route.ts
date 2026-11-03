/**
 * Older copy of the Payme Merchant API endpoint. It kept transactions in
 * memory and never marked orders paid. It now runs the same handler as
 * /admin/payme-webhook (database-backed), so whichever URL is configured in
 * the Payme cabinet behaves identically.
 */
export { POST, AUTHENTICATE, config } from "../../admin/payme-webhook/route"
