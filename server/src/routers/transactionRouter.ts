import { Router } from "express";
import { createTransaction, deleteTransaction, listTransactions } from "../controllers/transactionController";
import { authenticate } from "../middleware/auth";

const router = Router();
router.use(authenticate);
router.get("/", listTransactions);
router.post("/", createTransaction);
router.delete("/:id", deleteTransaction);
export default router;
