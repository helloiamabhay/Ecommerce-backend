import express from "express";
import { adminOnly } from "../middlewares/auth.js";
import { getBarChart, getDashboardStats, getLineChart, getPieChart } from "../controllers/statistics_contro.js";
const app = express.Router();
// /api/v1/dashboard/stats
app.get("/stats", adminOnly, getDashboardStats);
// /api/v1/dashboard/pie
app.get("/pie", adminOnly, getPieChart);
// /api/v1/dashboard/bar
app.get("/bar", adminOnly, getBarChart);
// /api/v1/dashboard/line
app.get("/line", adminOnly, getLineChart);
export default app;
