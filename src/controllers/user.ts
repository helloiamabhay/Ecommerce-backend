import { NextFunction, Request, Response } from "express";
import { User } from "../models/users.js";
import { NewUserRequestBody } from "../types/types.js";
import ErrorHandler from "../utils/errorHander.js";
import { TryCatch } from "../middlewares/error.js";
import { error } from "console";

//----------------------------Create Users------------------------------------
export const newUser = TryCatch(async (req: Request<{}, {}, NewUserRequestBody>, res: Response, next: NextFunction) => {

    const { name, email, photo, gender, _id, dob } = req.body;
    let user = await User.findById(_id);
    if (user) return res.status(200).json({
        success: true,
        message: `Welcome ${user.name}`
    })
    if (!_id || !name || !email || !photo || !gender || !dob) return next(new ErrorHandler("Please fill all field !", 400));
    user = await User.create({ name, email, photo, gender, _id, dob: new Date(dob) })
    return res.status(201).json({
        success: true,
        message: `Welcome, ${user.name}`
    })
}
)
//----------------------------Get All Users------------------------------------
export const getAllUser = TryCatch(async (req: Request, res: Response, next: NextFunction) => {

    const allUser = await User.find({})
    return res.status(200).json({
        success: true,
        message: allUser
    })

})
//----------------------------Get User------------------------------------
export const getUser = TryCatch(async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const user = await User.findById(id)
    if (!user) return next(new ErrorHandler("Invalid Id try again", 400))
    return res.status(200).json({
        success: true,
        message: user
    })

})
//----------------------------Delete User------------------------------------
export const deleteUser = TryCatch(async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const user = await User.findById(id)
    if (!user) return next(new ErrorHandler("Invalid Id try again", 400))
    await User.deleteOne()
    return res.status(200).json({
        success: true,
        message: "User deleted seccessfully"
    })

})
