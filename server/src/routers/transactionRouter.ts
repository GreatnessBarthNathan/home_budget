import { Router } from "express";
import { createTransaction, deleteTransaction, listTransactions, updateTransaction } from "../controllers/transactionController";
import { authenticate } from "../middleware/auth";

const router = Router();
router.use(authenticate);
router.get("/", listTransactions);
router.post("/", createTransaction);
router.patch("/:id", updateTransaction);
router.delete("/:id", deleteTransaction);
export default router;
