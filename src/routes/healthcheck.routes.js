import { Router } from "express";
import { healthcheck } from "../controllers/healthcheck.controller.js";

const router = Router();

// add a healthcheck route

router.route("/").get(healthcheck);

export default router;
