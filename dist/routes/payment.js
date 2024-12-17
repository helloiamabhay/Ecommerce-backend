import express from "express";
import { adminOnly } from "../middlewares/auth.js";
import { allCoupons, createPaymentIntend, deleteCoupon, discountApply, newCoupon } from "../controllers/payment_contro.js";
const app = express.Router();
// /api/v1/order/create
app.post("/create", createPaymentIntend);
// /api/v1/order/discount
app.get("/discount", discountApply);
// /api/v1/order/coupon/new
app.post("/coupon/new", adminOnly, newCoupon);
// /api/v1/order/all-coupons
app.get("/all-coupons", adminOnly, allCoupons);
// /api/v1/order/delete-coupons
app.delete("/delete-coupon/:id", adminOnly, deleteCoupon);
export default app;
