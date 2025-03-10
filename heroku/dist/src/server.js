import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import generic from "./poulin/chatbots/generic/chatbots.js";
import logistics from "./poulin/chatbots/logistics/chatbots.js";
import mainChatbot from "./poulin/chatbots/main/chatbots.js";
import orders from "./poulin/chatbots/orders/chatbots.js";
import product from "./poulin/chatbots/product/chatbots.js";
import salesReader from "./poulin/chatbots/sales-reader/chatbots.js";
dotenv.config();
const app = express();
// Middleware
app.use(cors());
app.use(express.json());
// Chatbot routes
app.use("/chatbots/main", mainChatbot);
app.use("/chatbots/sales-reader", salesReader);
app.use("/chatbots/logistics", logistics);
app.use("/chatbots/orders", orders);
app.use("/chatbots/product", product);
app.use("/chatbots/generic", generic);
// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: "Something broke!" });
});
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
export default app;
