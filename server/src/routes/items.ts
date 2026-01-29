import { Router } from "express";
import {
  getAvailablePaginated,
  getSelectedPaginated,
  getTotalAvailable,
  getTotalSelected,
  getSelectedOrder,
  enqueueAddElement,
  enqueueAddSelected,
  enqueueAddSelectedBatch,
  enqueueRemoveSelected,
  enqueueReorderSelected,
  enqueueMoveSelected,
} from "../queue";

const router = Router();
const LIMIT = 20;

router.get("/available", (req, res) => {
  const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit), 10) || LIMIT));
  const filter = typeof req.query.filter === "string" ? req.query.filter.trim() : undefined;
  const ids = getAvailablePaginated(page, limit, filter || undefined);
  const total = getTotalAvailable(filter || undefined);
  res.json({ ids, total, page, limit });
});

router.get("/selected", (req, res) => {
  const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit), 10) || LIMIT));
  const filter = typeof req.query.filter === "string" ? req.query.filter.trim() : undefined;
  const ids = getSelectedPaginated(page, limit, filter || undefined);
  const total = getTotalSelected(filter || undefined);
  res.json({ ids, total, page, limit });
});

router.get("/selected/order", (_req, res) => {
  const order = getSelectedOrder();
  res.json({ order });
});

router.post("/items", (req, res) => {
  const body = req.body;
  const id = typeof body?.id === "number" ? body.id : parseInt(String(body?.id), 10);
  if (Number.isNaN(id) || id < 1) {
    return res.status(400).json({ error: "Invalid id" });
  }
  enqueueAddElement(id);
  res.json({ ok: true });
});

router.post("/selected", (req, res) => {
  const body = req.body;
  if (Array.isArray(body?.ids)) {
    const ids = body.ids
      .map((x: unknown) => (typeof x === "number" ? x : parseInt(String(x), 10)))
      .filter((n: number) => !Number.isNaN(n) && n >= 1);
    enqueueAddSelectedBatch(ids);
  } else {
    const id = typeof body?.id === "number" ? body.id : parseInt(String(body?.id), 10);
    if (Number.isNaN(id) || id < 1) {
      return res.status(400).json({ error: "Invalid id" });
    }
    enqueueAddSelected(id);
  }
  res.json({ ok: true });
});

router.delete("/selected/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  enqueueRemoveSelected(id);
  res.json({ ok: true });
});

router.put("/selected/reorder", (req, res) => {
  const body = req.body;
  if (body?.moveId != null) {
    const moveId = parseInt(String(body.moveId), 10);
    const beforeId = body.beforeId == null ? null : parseInt(String(body.beforeId), 10);
    if (Number.isNaN(moveId) || moveId < 1) return res.status(400).json({ error: "Invalid moveId" });
    if (beforeId !== null && (Number.isNaN(beforeId) || beforeId < 1)) {
      return res.status(400).json({ error: "Invalid beforeId" });
    }
    enqueueMoveSelected(moveId, beforeId);
    return res.json({ ok: true });
  }
  const order = body?.order;
  if (!Array.isArray(order)) return res.status(400).json({ error: "order or moveId required" });
  const ids = order
    .map((x: unknown) => (typeof x === "number" ? x : parseInt(String(x), 10)))
    .filter((n: number) => !Number.isNaN(n) && n >= 1);
  enqueueReorderSelected(ids);
  res.json({ ok: true });
});

export default router;
