export function isCodEnabled() {
  const v = (process.env.COD_ENABLED ?? "").toString().trim().toLowerCase()
  return v === "1" || v === "true" || v === "yes" || v === "on"
}