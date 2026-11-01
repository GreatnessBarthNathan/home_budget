import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import path from "node:path";
import authRouter from "./routers/authRouter";
import accountRouter from "./routers/accountRouter";
import transactionRouter from "./routers/transactionRouter";
import householdRouter from "./routers/householdRouter";
import activityRouter from "./routers/activityRouter";

const app = express();
const port = Number(process.env.PORT) || 4000;
const clientDist = path.resolve(__dirname, "../../client/dist");

app.disable("x-powered-by");
app.use(express.json({ limit: "20kb" }));
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRouter);
app.use("/api/accounts", accountRouter);
app.use("/api/transactions", transactionRouter);
app.use("/api/household", householdRouter);
app.use("/api/activity", activityRouter);
app.use("/api", (_req, res) => res.status(404).json({ message: "API route not found." }));

if (process.env.NODE_ENV === "production") {
  app.use(express.static(clientDist));
  app.get("*", (_req, res) => res.sendFile(path.join(clientDist, "index.html")));
}

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Request failed:", error);
  if (error instanceof SyntaxError && "body" in error) return res.status(400).json({ message: "Request body must be valid JSON." });
  return res.status(500).json({ message: "An unexpected server error occurred." });
});

async function start() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required.");
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error("JWT_SECRET must be set to a secret of at least 32 characters.");
  await mongoose.connect(process.env.MONGODB_URI);
  app.listen(port, () => console.log(`Home Budget is listening on port ${port}.`));
}

start().catch(error => {
  console.error("Could not start Home Budget:", error);
  process.exitCode = 1;
});
