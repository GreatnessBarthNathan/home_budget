import { Router } from "express";
import { createAccount, listAccounts } from "../controllers/accountController";
import { authenticate } from "../middleware/auth";

const router = Router();
router.use(authenticate);
router.get("/", listAccounts);
router.post("/", createAccount);
export default router;
