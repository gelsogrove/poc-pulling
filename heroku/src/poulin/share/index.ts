import historyRouter from "./history.js"
import promptRouter from "./prompts.js"
import unlikeRouter from "./unlike.js"
import usageRouter from "./usage.js"

// Export per generic
export const promptGenericRouter = promptRouter
export const unlikeGenericRouter = unlikeRouter
export const usageGenericRouter = usageRouter
export const historyGenericRouter = historyRouter

// Export per product
export const promptProductRouter = promptRouter
export const unlikeProductRouter = unlikeRouter
export const usageProductRouter = usageRouter
export const historyProductRouter = historyRouter

// Export per sales-reader
export const promptSalesReaderRouter = promptRouter
export const unlikeSalesReaderRouter = unlikeRouter
export const usageSalesReaderRouter = usageRouter
export const historySalesReaderRouter = historyRouter

// Export per orders
export const promptOrdersRouter = promptRouter
export const unlikeOrdersRouter = unlikeRouter
export const usageOrdersRouter = usageRouter
export const historyOrdersRouter = historyRouter

// Export per router
export const promptMainRouter = promptRouter
export const unlikeMainRouter = unlikeRouter
export const usageMainRouter = usageRouter
export const historyMainRouter = historyRouter
