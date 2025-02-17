import promptRouter from "./prompts.js"
import unlikeRouter from "./unlike.js"
import usageRouter from "./usage.js"

// Export per generic
export const promptGenericRouter = promptRouter
export const unlikeGenericRouter = unlikeRouter
export const usageGenericRouter = usageRouter

// Export per product
export const promptProductRouter = promptRouter
export const unlikeProductRouter = unlikeRouter
export const usageProductRouter = usageRouter

// Export per sales-reader
export const promptSalesReaderRouter = promptRouter
export const unlikeSalesReaderRouter = unlikeRouter
export const usageSalesReaderRouter = usageRouter

// Export per orders
export const promptOrdersRouter = promptRouter
export const unlikeOrdersRouter = unlikeRouter
export const usageOrdersRouter = usageRouter

// Export per router
export const promptRouterRouter = promptRouter
export const unlikeRouterRouter = unlikeRouter
export const usageRouterRouter = usageRouter
