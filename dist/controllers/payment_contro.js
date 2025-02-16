import { stripe } from "../app.js";
import { TryCatch } from "../middlewares/error.js";
import { Coupon } from "../models/coupon.js";
import ErrorHandler from "../utils/errorHander.js";
export const createPaymentIntend = TryCatch(async (req, res, next) => {
    const { amount } = req.body;
    if (!amount)
        return next(new ErrorHandler("Please enter amount", 400));
    const paymentIntent = await stripe.paymentIntents.create({ amount: Number(amount) * 100, currency: "inr" });
    return res.status(201).json({
        success: true,
        clientSecret: paymentIntent.client_secret
    });
});
export const newCoupon = TryCatch(async (req, res, next) => {
    const { coupon, amount } = req.body;
    if (!coupon || !amount)
        return next(new ErrorHandler("Please enter all fields", 400));
    await Coupon.create({
        code: coupon, amount
    });
    return res.status(201).json({
        success: true,
        message: `Coupon ${coupon} created seccessfully`
    });
});
export const discountApply = TryCatch(async (req, res, next) => {
    const { coupon } = req.query;
    const discount = await Coupon.findOne({ code: coupon });
    if (!discount)
        return next(new ErrorHandler("Invalid Coupon Code", 400));
    return res.status(200).json({
        success: true,
        discount: discount.amount
    });
});
export const allCoupons = TryCatch(async (req, res, next) => {
    const all = await Coupon.find({});
    return res.status(200).json({
        success: true,
        all
    });
});
export const deleteCoupon = TryCatch(async (req, res, next) => {
    const { id } = req.params;
    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon)
        return next(new ErrorHandler("Invalid coupon id", 400));
    return res.status(200).json({
        success: true,
        message: `Coupon ${coupon?.code} deleted seccessfully`
    });
});
