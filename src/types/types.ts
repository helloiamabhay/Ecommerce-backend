import { NextFunction, Request, Response } from "express";


export interface NewUserRequestBody {
    name: string;
    email: string;
    photo: string;
    gender: string;
    _id: string;
    dob: Date;
}
export interface newProductRequestBody {
    name: string;
    category: string;
    price: number;
    stock: number;
}

export type ControllerType = (
    req: Request<any>,
    res: Response,
    next: NextFunction
) => Promise<void | Response<any, Record<string, any>>>

export type SearchRequestQuery = {
    search?: string;
    price?: string;
    category?: string;
    sort?: string;
    pase?: string;
}

export interface BaseQueryType {
    name?: {
        $regex: string;
        $options: string;
    };
    price?: { $lte: number };
    category?: string;
}

export type invalidateCacheProps = {
    product?: boolean;
    order?: boolean;
    admin?: boolean;
    userId?: string;
    orderId?: string;
    productId?: string | string[];

}

export type OrderItemType = {
    name: string;
    photo: string;
    price: number;
    quantity: number;
    productId: string;

}
export type shippingInfoType = {
    address: string;
    city: string;
    state: string;
    country: number;
    pinCode: number;

}

export interface NewOrderRequestBody {
    shippingInfo: shippingInfoType;
    user: string;
    subTotal: number;
    tax: number;
    shippingCharges: number;
    discount: number;
    total: number;
    orderItems: OrderItemType[]


}
