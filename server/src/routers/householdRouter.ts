import { Router } from "express";
import { getHousehold } from "../controllers/householdController";
import { authenticate } from "../middleware/auth";

const router = Router();
router.use(authenticate);
router.get("/", getHousehold);
export default router;
