import express from "express";
import { deleteUser, getAllUser, getUser, newUser } from "../controllers/user.js";
import { adminOnly } from "../middlewares/auth.js";
const app = express.Router();

// /api/v1/user/new
app.post("/new", newUser)
// /api/v1/user/all
app.get("/all", adminOnly, getAllUser)
// /api/v1/user/dynamicId
app.get("/:id", getUser)
// /api/v1/user/dynamicId
app.delete("/:id", adminOnly, deleteUser)
//or
//app.route("/:id").get(getUser).delete(deleteUser)




export default app;
