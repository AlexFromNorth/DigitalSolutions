import express from "express";
import cors from "cors";
import itemsRouter from "./routes/items";
import { swaggerMiddleware, swaggerSetup } from "./swagger";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true }));
app.use(express.json());
app.use("/api", itemsRouter);
app.use("/api-docs", swaggerMiddleware, swaggerSetup);

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`API running at http://localhost:${PORT}`);
  console.log(`Swagger UI at http://localhost:${PORT}/api-docs`);
});
