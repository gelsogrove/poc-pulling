import { Request, Response, Router } from "express"
import { ParamsDictionary } from "express-serve-static-core"
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

interface ChatbotParams extends ParamsDictionary {
  chatbot: "generic" | "sales-reader"
}

type ChatbotType = "generic" | "sales-reader"

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
}

const createDynamicRouter = (type: keyof RouterMap[ChatbotType]) => {
  const router = Router()

  router.use("/", (req: Request<ChatbotParams>, res: Response, next) => {
    const chatbot = req.params.chatbot
    const selectedRouter = routerMap[chatbot]?.[type]

    console.log(`Loading ${chatbot} router for ${type} endpoint`)

    if (selectedRouter) {
      return selectedRouter(req as any, res, next)
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
