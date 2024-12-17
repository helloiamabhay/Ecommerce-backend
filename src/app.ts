import express from "express";
import { connectDB } from "./utils/dbconnect.js";
import { errorMiddleware } from "./middlewares/error.js";
import NodeCache from "node-cache";
import { config } from "dotenv"
import morgan from "morgan";
import Stripe from "stripe";
import userRoutes from "./routes/user.js"
import productRoutes from "./routes/products.js"
import orderRoutes from "./routes/order_route.js"
import paymentRoutes from "./routes/payment.js"
import dashboardRoutes from "./routes/statistics.js"


config({ path: "./.env" })
const port = process.env.PORT || 8000;
const stripeKey = process.env.STRIPE_KEY || "";

connectDB(process.env.MONGO_URI || "")
export const stripe = new Stripe(stripeKey)
export const myCache = new NodeCache()
const app = express();
app.use(express.json())
app.use(morgan("dev"))

app.use("/api/v1/user", userRoutes)
app.use("/api/v1/product", productRoutes)
app.use("/api/v1/order", orderRoutes)
app.use("/api/v1/payment", paymentRoutes)
app.use("/api/v1/dashboard", dashboardRoutes)

app.use("/uploads", express.static("uploads"))
app.use(errorMiddleware)

app.listen(port, () => {
    console.log(`Server is working on port ${port}`);

})
