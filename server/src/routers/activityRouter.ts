import { Router } from "express";
import { listActivity } from "../controllers/activityController";
import { authenticate } from "../middleware/auth";

const router = Router();
router.use(authenticate);
router.get("/", listActivity);
export default router;
