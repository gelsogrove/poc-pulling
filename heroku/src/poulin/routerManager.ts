import { Request, Response, Router } from "express"
import { ParamsDictionary } from "express-serve-static-core"
import chatbotGenericRouter from "./chatbots/generic/chatbots.js"
import chatbotOrdersRouter from "./chatbots/orders/chatbots.js"
import chatbotProductRouter from "./chatbots/product/chatbots.js"

import chatbotMainRouter from "./chatbots/main/chatbots.js"
import chatbotSalesReaderRouter from "./chatbots/sales-reader/chatbots.js"
import {
  promptGenericRouter,
  promptMainRouter,
  promptOrdersRouter,
  promptProductRouter,
  promptSalesReaderRouter,
  unlikeGenericRouter,
  unlikeOrdersRouter,
  unlikeProductRouter,
  unlikeSalesReaderRouter,
  usageGenericRouter,
  usageMainRouter,
  usageOrdersRouter,
  usageProductRouter,
  usageSalesReaderRouter,
} from "./share/index.js"

type ChatbotType =
  | "generic"
  | "sales-reader"
  | "product"
  | "orders"
  | "logistics"
  | "main"

interface ChatbotParams extends ParamsDictionary {
  chatbot: ChatbotType
}

type RouterMap = {
  [K in ChatbotType]: {
    usage: Router
    prompt: Router
    chatbot: Router
    unlike: Router
  }
}

const routerMap: RouterMap = {
  generic: {
    usage: usageGenericRouter,
    prompt: promptGenericRouter,
    chatbot: chatbotGenericRouter,
    unlike: unlikeGenericRouter,
  },
  "sales-reader": {
    usage: usageSalesReaderRouter,
    prompt: promptSalesReaderRouter,
    chatbot: chatbotSalesReaderRouter,
    unlike: unlikeSalesReaderRouter,
  },
  product: {
    usage: usageProductRouter,
    prompt: promptProductRouter,
    chatbot: chatbotProductRouter,
    unlike: unlikeProductRouter,
  },
  orders: {
    usage: usageOrdersRouter,
    prompt: promptOrdersRouter,
    chatbot: chatbotOrdersRouter,
    unlike: unlikeOrdersRouter,
  },
  logistics: {
    usage: usageOrdersRouter,
    prompt: promptOrdersRouter,
    chatbot: chatbotOrdersRouter,
    unlike: unlikeOrdersRouter,
  },
  main: {
    usage: usageMainRouter,
    prompt: promptMainRouter,
    chatbot: chatbotMainRouter,
    unlike: unlikeOrdersRouter,
  },
}

const createDynamicRouter = (type: keyof RouterMap[ChatbotType]) => {
  console.log("🔍**** createDynamicRouter *****", type)
  const router = Router({ mergeParams: true })

  router.use((req: Request<ChatbotParams>, res: Response, next) => {
    const chatbot = req.params.chatbot
    const selectedRouter = routerMap[chatbot]?.[type]

    if (selectedRouter) {
      return selectedRouter(req as any, res, next)
    }

    res.status(404).json({
      error: "Invalid chatbot type",
      requested: chatbot,
      available: Object.keys(routerMap),
    })
  })

  return router
}

export const usageRouter = createDynamicRouter("usage")
export const promptRouter = createDynamicRouter("prompt")
export const chatbotRouter = createDynamicRouter("chatbot")
export const unlikeRouter = createDynamicRouter("unlike")
