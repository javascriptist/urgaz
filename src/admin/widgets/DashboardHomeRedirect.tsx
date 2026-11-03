import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useEffect } from "react"
import { useLocation, useNavigate, useNavigationType } from "react-router-dom"

/**
 * Makes the store Dashboard the admin's home page.
 *
 * Medusa has no setting for the start page: after login (and when opening
 * /app) it lands on /orders with a *replace* navigation. Clicking "Orders"
 * in the sidebar is a *push*, and reload / back / forward are *pop*. So we
 * forward to /dashboard only on that replace landing — Orders stays fully
 * reachable, and nothing is stored between sessions.
 */
const DashboardHomeRedirect = () => {
  const navigate = useNavigate()
  const navigationType = useNavigationType()
  const { pathname, search } = useLocation()

  useEffect(() => {
    const isOrdersRoot = /\/orders\/?$/.test(pathname)
    if (navigationType === "REPLACE" && isOrdersRoot && !search) {
      navigate("/dashboard", { replace: true })
    }
    // run once for the landing navigation only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}

export const config = defineWidgetConfig({
  zone: "order.list.before",
})

export default DashboardHomeRedirect
