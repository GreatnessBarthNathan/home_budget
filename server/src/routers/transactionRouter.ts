import { Router } from "express";
import { createTransaction, listTransactions, updateTransaction } from "../controllers/transactionController";
import { authenticate } from "../middleware/auth";

const router = Router();
router.use(authenticate);
router.get("/", listTransactions);
router.post("/", createTransaction);
router.patch("/:id", updateTransaction);
export default router;
