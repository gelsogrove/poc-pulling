import { Router } from "express"
import {
  chatbotGenericRouter,
  promptGenericRouter,
  unlikeGenericRouter,
  usageGenericRouter,
} from "./generic/index.js"
import {
  chatbotSalesReaderRouter,
  promptSalesReaderRouter,
  unlikeSalesReaderRouter,
  usageSalesReaderRouter,
} from "./sales-reader/index.js"

type ChatbotType = "generic" | "sales-reader"
type RouterType = "usage" | "prompt" | "chatbot" | "unlike"

const routerMap: Record<ChatbotType, Record<RouterType, Router>> = {
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
}

const createDynamicRouter = (type: RouterType) => {
  const router = Router()

  router.use((req, res, next) => {
    const chatbot = req.params.chatbot as ChatbotType
    const selectedRouter = routerMap[chatbot]?.[type]

    console.log(`Loading ${chatbot} router for ${type} endpoint`)

    if (selectedRouter) {
      return selectedRouter(req, res, next)
    }

    res.status(404).json({ error: "Invalid chatbot type" })
  })

  return router
}

export const usageRouter = createDynamicRouter("usage")
export const promptRouter = createDynamicRouter("prompt")
export const chatbotRouter = createDynamicRouter("chatbot")
export const unlikeRouter = createDynamicRouter("unlike")
// ... altri router
