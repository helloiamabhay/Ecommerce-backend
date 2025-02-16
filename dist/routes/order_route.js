import express from "express";
import { adminOnly } from "../middlewares/auth.js";
import { allOrder, deleteOrder, getSingleOrder, myOrder, newOrder, processOrder } from "../controllers/order_controler.js";
const app = express.Router();
// /api/v1/order/new
app.post("/new", newOrder);
// /api/v1/order/my
app.get("/my", myOrder);
// /api/v1/order/all
app.get("/all", adminOnly, allOrder);
app.route("/:id").get(getSingleOrder).put(adminOnly, processOrder).delete(adminOnly, deleteOrder);
export default app;
