import { User } from "../models/users.js";
import ErrorHandler from "../utils/errorHander.js";
import { TryCatch } from "./error.js"

export const adminOnly = TryCatch(async (req, res, next) => {
    const { id } = req.query;
    if (!id) return next(new ErrorHandler("Please before login ", 401));
    const user = await User.findById(id);
    if (!user) return next(new ErrorHandler("wrong Id try again", 401));
    if (user.role !== "admin") return next(new ErrorHandler("Only admin can access", 401));
    next()

}
)

