import { myCache } from "../app.js";
import { TryCatch } from "../middlewares/error.js";
import { Order } from "../models/order_model.js";
import { Product } from "../models/product_model.js";
import { User } from "../models/users.js";
import { calculatePercentage, getChartData, getInventories } from "../utils/dbconnect.js";

export const getDashboardStats = TryCatch(async (req, res, next) => {
    let stats = {};

    const key = "admin-stats"

    if (myCache.has(key)) stats = JSON.parse(myCache.get(key) as string)
    else {
        const today = new Date();
        const sixMonthAgo = new Date();
        sixMonthAgo.setMonth(sixMonthAgo.getMonth() - 6)
        const thisMonth = {
            start: new Date(today.getFullYear(), today.getMonth(), 1),
            end: today,
        }
        const lastMonth = {
            start: new Date(today.getFullYear(), today.getMonth() - 1, 1),
            end: new Date(today.getFullYear(), today.getMonth(), 0),
        }


        const thisMonthProductPromise = await Product.find({
            createdAt: {
                $gte: thisMonth.start, $lte: thisMonth.end
            }
        })
        const lastMonthProductPromise = await Product.find({
            createdAt: {
                $gte: lastMonth.start, $lte: lastMonth.end
            }
        })

        const thisMonthUserPromise = await User.find({
            createdAt: {
                $gte: thisMonth.start, $lte: thisMonth.end
            }
        })
        const lastMonthUserPromise = await User.find({
            createdAt: {
                $gte: lastMonth.start, $lte: lastMonth.end
            }
        })

        const thisMonthOrdersPromise = await Order.find({
            createdAt: {
                $gte: thisMonth.start, $lte: thisMonth.end
            }
        })
        const lastMonthOrdersPromise = await Order.find({
            createdAt: {
                $gte: lastMonth.start, $lte: lastMonth.end
            }
        })

        const lastSixMonthOrdersPromise = await Order.find({
            createdAt: {
                $gte: sixMonthAgo, $lte: today
            }
        })


        const latestTransactionsProducts = Order.find({}).select(["orderItems", "discount", "total", "status"]).limit(4);

        const [thisMonthProducts, thisMonthUsers, thisMonthOrders, lastMonthProduct, lastMonthUser, lastMonthOrders, productsCount, usersCount, allOrders, lastSixMonthOrders, categories, femaleUsersCount, latestTransaction] = await Promise.all([thisMonthProductPromise, thisMonthUserPromise, thisMonthOrdersPromise, lastMonthProductPromise, lastMonthUserPromise, lastMonthOrdersPromise, Product.countDocuments(), User.countDocuments(), Order.find({}).select("total"), lastSixMonthOrdersPromise, Product.distinct("category"), User.countDocuments({ gender: "female" }), latestTransactionsProducts])

        const thisMonthRevenue = thisMonthOrders.reduce((total, order) =>
            total + (order.total || 0), 0
        )
        const lastMonthRevenue = lastMonthOrders.reduce((total, order) =>
            total + (order.total || 0), 0
        )

        const changePercent = {
            revenue: calculatePercentage(thisMonthRevenue, lastMonthRevenue),
            product: calculatePercentage(
                thisMonthProducts.length,
                lastMonthProduct.length,
            ),
            user: calculatePercentage(
                thisMonthUsers.length,
                lastMonthUser.length,
            ),
            order: calculatePercentage(

                thisMonthOrders.length,
                lastMonthOrders.length,
            )
        }

        const revenue = allOrders.reduce((total, order) =>
            total + (order.total || 0), 0
        )

        const count = {
            revenue,
            user: usersCount,
            product: productsCount,
            order: allOrders.length
        }
        const orderMonthsCount = new Array(6).fill(0)
        const orderMonthsRevenue = new Array(6).fill(0)

        lastSixMonthOrders.forEach(order => {
            const creationDate = order.createdAt
            const monthDiff = (today.getMonth() - creationDate.getMonth() + 12) % 12;
            if (monthDiff < 6) {
                orderMonthsCount[6 - monthDiff - 1] += 1;
                orderMonthsRevenue[6 - monthDiff - 1] += order.total;

            }
        });

        const categoryCount = await getInventories({ categories, productsCount });


        const userRatio = {
            male: usersCount - femaleUsersCount,
            female: femaleUsersCount,

        }

        const modifiedLatestTransaction = latestTransaction.map(i => ({
            _id: i._id,
            discount: i.discount,
            amount: i.total,
            quantity: i.orderItems.length,
            status: i.status
        }))

        stats = {
            categoryCount,
            changePercent,
            count,
            chart: {
                order: orderMonthsCount,
                revenue: orderMonthsRevenue
            },
            userRatio,
            latestTransaction: modifiedLatestTransaction
        }
        myCache.set(key, JSON.stringify(stats))
    }
    return res.status(200).json({
        success: true,
        stats
    })
})



export const getPieChart = TryCatch(async (req, res, next) => {

    let charts;
    const key = "admin-pie-charts"
    if (myCache.has(key)) charts = JSON.parse(myCache.get(key) as string);

    else {
        const allOrderPromise = Order.find({}).select(["total", "discount", "subTotal", "tax", "shippingCharges"]);
        const [processingOrder, shippedOrder, deliveredOrder, categories, productsCount, outOfStock, allOrders, allUsers, adminUsers, customerUsers] = await Promise.all([
            Order.countDocuments({ status: "Processing" }),
            Order.countDocuments({ status: "Shipped" }),
            Order.countDocuments({ status: "Delivered" }),
            Product.distinct("category"),
            Product.countDocuments(),
            Product.countDocuments({ stock: 0 }),
            allOrderPromise,
            User.find({}).select(["dob"]),
            User.countDocuments({ role: "admin" }),
            User.countDocuments({ role: "user" }),
        ])

        const orderFullFillMent = {
            processing: processingOrder,
            shipped: shippedOrder,
            delivered: deliveredOrder,
        }
        const productCategories = await getInventories({ categories, productsCount });
        const stockAvailability = {
            inStock: productsCount - outOfStock,
            outOfStock
        }

        const grossIncome = allOrders.reduce((prev, order) => prev + (order.total || 0), 0);
        const discount = allOrders.reduce((prev, order) => prev + (order.discount || 0), 0);
        const productionCost = allOrders.reduce((prev, order) => prev + (order.shippingCharges || 0), 0);
        const burnt = allOrders.reduce((prev, order) => prev + (order.tax || 0), 0);
        const marketingCost = Math.round(grossIncome * (30 / 100));
        const netMargin = grossIncome - discount - productionCost - burnt - marketingCost;



        const revenueDistribution = {
            netMargin,
            discount,
            productionCost,
            burnt,
            marketingCost
        }

        const adminCustomer = {
            admin: adminUsers,
            customers: customerUsers,

        }

        const usersAgeGroup = {
            teen: allUsers.filter(i => i.age < 20).length,
            adult: allUsers.filter(i => i.age >= 20 && i.age < 40).length,
            old: allUsers.filter(i => i.age >= 40).length
        }

        charts = {
            orderFullFillMent,
            productCategories,
            stockAvailability,
            revenueDistribution,
            adminCustomer,
            usersAgeGroup
        }
        myCache.set(key, JSON.stringify(charts));
    }


    return res.status(200).json({
        success: true,
        charts
    })

})
export const getBarChart = TryCatch(async (req, res, next) => {

    let charts;
    const key = "admin-bar-charts";
    if (myCache.has(key)) charts = JSON.parse(myCache.get(key) as string);
    else {
        const today = new Date();

        const sixMonthAgo = new Date();
        sixMonthAgo.setMonth(sixMonthAgo.getMonth() - 6)

        const twelveMonthAgo = new Date();
        twelveMonthAgo.setMonth(twelveMonthAgo.getMonth() - 12)

        const sixMonthProductPromise = await Product.find({
            createdAt: {
                $gte: sixMonthAgo, $lte: today
            }
        }).select("createdAt")
        const sixMonthUsersPromise = await User.find({
            createdAt: {
                $gte: sixMonthAgo, $lte: today
            }
        }).select("createdAt")
        const twelveMonthOrdersPromise = await Order.find({
            createdAt: {
                $gte: twelveMonthAgo, $lte: today
            }
        }).select("createdAt")

        const [products, users, orders] = await Promise.all([
            sixMonthProductPromise, sixMonthUsersPromise, twelveMonthOrdersPromise
        ]);

        const productCounts = getChartData({ length: 6, today, docArr: products });

        const userCounts = getChartData({ length: 6, today, docArr: users })
        const orderCounts = getChartData({ length: 12, today, docArr: orders })

        charts = {
            productCounts,
            userCounts,
            orderCounts
        }
        myCache.set(key, JSON.stringify(charts));
    }

    return res.status(200).json({
        success: true,
        charts
    })

})
export const getLineChart = TryCatch(async (req, res, next) => {
    let charts;
    const key = "admin-line-charts";
    if (myCache.has(key)) charts = JSON.parse(myCache.get(key) as string);
    else {
        const today = new Date();



        const twelveMonthAgo = new Date();
        twelveMonthAgo.setMonth(twelveMonthAgo.getMonth() - 12)

        const baseQuery = {
            createdAt: {
                $gte: twelveMonthAgo, $lte: today
            }
        }



        const [products, users, orders] = await Promise.all([
            Product.find(baseQuery).select("createdAt"),
            User.find(baseQuery).select("createdAt"),
            Order.find(baseQuery).select(["createdAt", "discount", "total"])
        ]);

        const productCounts = getChartData({ length: 12, today, docArr: products });
        const userCounts = getChartData({ length: 12, today, docArr: users })
        const discount = getChartData({ length: 12, today, docArr: orders, property: "discount" })
        const revenue = getChartData({ length: 12, today, docArr: orders, property: "total" })

        charts = {
            users: productCounts,
            products: userCounts,
            discount,
            revenue
        }
        myCache.set(key, JSON.stringify(charts));
    }

    return res.status(200).json({
        success: true,
        charts
    })


})