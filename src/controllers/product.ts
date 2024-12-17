import { NextFunction, Request, Response } from "express";
import { TryCatch } from "../middlewares/error.js";
import { BaseQueryType, newProductRequestBody, SearchRequestQuery } from "../types/types.js";
import { Product } from "../models/product_model.js";
import ErrorHandler from "../utils/errorHander.js";
import { rm } from "fs";
import { myCache } from "../app.js";
import { invalidateCache } from "../utils/dbconnect.js";
// import { faker } from "@faker-js/faker";

export const newProduct = TryCatch(async (req: Request<{}, {}, newProductRequestBody>, res: Response, next: NextFunction) => {

    const { name, price, stock, category } = req.body;
    const photo = req.file;
    if (!photo) return next(new ErrorHandler("Please add photo", 400))
    if (!name || !price || !stock || !category) {
        rm(photo.path, () => {
            console.log("deleted");

        })
        return next(new ErrorHandler("Please fill all field", 400))
    }

    await Product.create({
        name,
        price,
        stock,
        category: category.toLowerCase(),
        photo: photo.path,
    })
    invalidateCache({ product: true, admin: true })
    return res.status(200).json({
        success: true,
        message: "Product created seccessfully"
    })

})
// revalidate on new product,update,delete,new order
export const getLatestProducts = TryCatch(async (req, res, next) => {
    let products;
    if (myCache.has("latest-product")) products = JSON.parse(myCache.get("latest-product") as string);
    else {
        products = await Product.find({}).sort({ createdAt: -1 }).limit(5)
        myCache.set("latest-product", JSON.stringify(products))
    }

    return res.status(200).json({
        success: true,
        message: products
    })
})
// revalidate on new product,update,delete,new order
export const getAllCategories = TryCatch(async (req, res, next) => {
    let categories;
    if (myCache.has("categories")) categories = JSON.parse(myCache.get("categories") as string);
    else {
        categories = await Product.distinct("category")
        myCache.set("categories", JSON.stringify(categories))
    }
    return res.status(200).json({
        success: true,
        categories
    })
})
// revalidate on new product,update,delete,new order
export const getAdminProducts = TryCatch(async (req, res, next) => {

    let products;
    if (myCache.has("all-products")) products = JSON.parse(myCache.get("all-products") as string)
    else {
        products = await Product.find({});
        if (!products) return next(new ErrorHandler("Not Products", 400));
        myCache.set("all-products", JSON.stringify(products));
    }

    return res.status(200).json({
        success: true,
        products
    })
})
// revalidate on update,delete,new order
export const getSingleProduct = TryCatch(async (req, res, next) => {
    let product;
    const id = req.params.id;
    if (myCache.has(`product-${id}`)) product = JSON.parse(myCache.get(`product-${id}`) as string)
    else {
        product = await Product.findById(id);
        if (!product) return next(new ErrorHandler("Not found Products", 400));
        myCache.set(`product-${id}`, JSON.stringify(product));
    }
    return res.status(200).json({
        success: true,
        product
    })
})

export const updateProduct = TryCatch(async (req, res, next) => {
    const { id } = req.params
    const { name, price, stock, category } = req.body;
    const photo = req.file;
    const product = await Product.findById(id);
    if (!product) return next(new ErrorHandler("Invalid Product Id", 400));

    if (photo) {
        rm(product.photo!, () => {
            console.log("old photo deleted");
        })
        product.photo = photo.path
    }

    if (name) product.name = name;
    if (price) product.price = price;
    if (stock) product.stock = stock;
    if (category) product.category = category;
    await product.save()
    invalidateCache({ product: true, productId: String(product._id), admin: true })

    return res.status(200).json({
        success: true,
        message: "Product updated seccessfully"
    })

})

export const deleteProduct = TryCatch(async (req, res, next) => {


    const product = await Product.findById(req.params.id);
    if (!product) return next(new ErrorHandler("Not found Products", 400));
    rm(product.photo!, () => {
        console.log("product photo deleted");
    })
    await Product.deleteOne();
    invalidateCache({ product: true, productId: String(product._id), admin: true })
    return res.status(200).json({
        success: true,
        message: "Product deleted seccessfully"
    })
})

export const getAllProducts = TryCatch(async (req: Request<{}, {}, {}, SearchRequestQuery>, res, next) => {

    const { search, sort, category, price } = req.query
    const pase = Number(req.query.pase) || 1;

    const limit = Number(process.env.PRODUCT_PER_PASE) || 8;
    const skip = limit * (pase - 1);

    const baseQuery: BaseQueryType = {}

    if (search) baseQuery.name = {
        $regex: search,
        $options: "i",
    }
    if (price) baseQuery.price = {
        $lte: Number(price)
    }
    if (category) baseQuery.category = category;

    const productsPromise = Product.find(baseQuery).sort(sort ? { price: sort === "asc" ? 1 : -1 } : undefined)
        .limit(limit)
        .skip(skip);

    const [products, filterOnlyProduct] = await Promise.all([
        productsPromise,
        Product.find(baseQuery)
    ])


    const totalPase = Math.ceil(filterOnlyProduct.length / limit);


    return res.status(200).json({
        success: true,
        products,
        totalPase
    })
})






