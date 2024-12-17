import { TryCatch } from "../middlewares/error.js";
import { Order } from "../models/order_model.js";
import { invalidateCache, reduceStock } from "../utils/dbconnect.js";
import ErrorHandler from "../utils/errorHander.js";
import { myCache } from "../app.js";
export const newOrder = TryCatch(async (req, res, next) => {
    const { shippingInfo, orderItems, user, subTotal, tax, shippingCharges, discount, total } = req.body;
    if (!shippingInfo ||
        !orderItems ||
        !user ||
        !subTotal ||
        !tax ||
        !total)
        return next(new ErrorHandler("Please Fill All Field", 400));
    const order = await Order.create({
        shippingInfo,
        orderItems,
        user,
        subTotal,
        tax,
        shippingCharges,
        discount,
        total
    });
    await reduceStock(orderItems);
    invalidateCache({ product: true, order: true, admin: true, userId: user, productId: order.orderItems.map(i => String(i.productId)) });
    return res.status(200).json({
        success: true,
        message: "Order Placed Seccessfully"
    });
});
export const myOrder = TryCatch(async (req, res, next) => {
    const { id: user } = req.query;
    let orders = [];
    const key = `my-order-${user}`;
    if (myCache.has(key))
        orders = JSON.parse(myCache.get(key));
    else {
        orders = await Order.find({ user });
        myCache.set(key, JSON.stringify(orders));
    }
    return res.status(200).json({
        success: true,
        orders
    });
});
export const allOrder = TryCatch(async (req, res, next) => {
    const key = "all-orders";
    let allOrders = [];
    if (myCache.has(key))
        allOrders = JSON.parse(myCache.get(key));
    else {
        allOrders = await Order.find().populate("user", "name");
        myCache.set(key, JSON.stringify(allOrders));
    }
    return res.status(200).json({
        success: true,
        allOrders
    });
});
export const getSingleOrder = TryCatch(async (req, res, next) => {
    const { id } = req.params;
    const key = `order-${id}`;
    let order;
    if (myCache.has(key))
        order = JSON.parse(myCache.get(key));
    else {
        order = await Order.findById(id).populate("user", "name");
        if (!order)
            return next("Order not found");
        myCache.set(key, JSON.stringify(order));
    }
    return res.status(200).json({
        success: true,
        order
    });
});
export const processOrder = TryCatch(async (req, res, next) => {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order)
        return next(new ErrorHandler("Order not found", 404));
    switch (order.status) {
        case "Processing":
            order.status = "Shipped";
            break;
        case "Shipped":
            order.status = "Delivered";
            break;
        default:
            order.status = "Delivered";
            break;
    }
    await order.save();
    invalidateCache({ product: false, order: true, admin: true, userId: order.user, orderId: String(order._id) });
    return res.status(200).json({
        success: true,
        message: "Order Processed Seccessfully"
    });
});
export const deleteOrder = TryCatch(async (req, res, next) => {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order)
        return next(new ErrorHandler("Order not found", 404));
    await order.deleteOne();
    invalidateCache({ product: false, order: true, admin: true, userId: order.user, orderId: String(order._id) });
    return res.status(200).json({
        success: true,
        message: "Order Deleted Seccessfully"
    });
});
