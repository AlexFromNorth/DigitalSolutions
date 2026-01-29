import {
  addToSelected,
  removeFromSelected,
  reorderSelected,
  moveSelected,
  addCustomIds,
  getSelectedIds,
  getAvailableSlice,
  getAvailableTotal,
  getAvailableIdsFiltered,
  getSelectedIdsFiltered,
} from "./store";

const ADD_ELEMENTS_BATCH_MS = 10_000;
const GET_UPDATE_BATCH_MS = 1_000;

type AddElementOp = { type: "addElement"; id: number };
type AddSelectedOp = { type: "addSelected"; id: number };
type RemoveSelectedOp = { type: "removeSelected"; id: number };
type ReorderSelectedOp = { type: "reorderSelected"; ids: number[] };
type MoveSelectedOp = { type: "moveSelected"; moveId: number; beforeId: number | null };

const addElementsQueue: AddElementOp[] = [];
const updateQueue: (AddSelectedOp | RemoveSelectedOp | ReorderSelectedOp | MoveSelectedOp)[] = [];
let addElementsTimer: NodeJS.Timeout | null = null;
let updateTimer: NodeJS.Timeout | null = null;

const pendingAddElementIds = new Set<number>();

function flushAddElements() {
  if (addElementsQueue.length === 0) {
    addElementsTimer = null;
    return;
  }
  const toAdd: number[] = [];
  for (const op of addElementsQueue) {
    if (!pendingAddElementIds.has(op.id)) {
      pendingAddElementIds.add(op.id);
      toAdd.push(op.id);
    }
  }
  addElementsQueue.length = 0;
  if (toAdd.length) {
    addCustomIds(toAdd);
    toAdd.forEach((id) => pendingAddElementIds.delete(id));
  }
  addElementsTimer = null;
}

function flushUpdate() {
  if (updateQueue.length === 0) {
    updateTimer = null;
    return;
  }
  const toAdd = new Set<number>();
  const toRemove = new Set<number>();
  let lastReorder: number[] | null = null;
  const moves: { moveId: number; beforeId: number | null }[] = [];
  for (const op of updateQueue) {
    if (op.type === "addSelected") {
      toAdd.add(op.id);
    } else if (op.type === "removeSelected") {
      toRemove.add(op.id);
    } else if (op.type === "reorderSelected") {
      lastReorder = op.ids;
    } else {
      moves.push({ moveId: op.moveId, beforeId: op.beforeId });
    }
  }
  for (const id of toRemove) removeFromSelected(id);
  if (toAdd.size) addToSelected([...toAdd]);
  if (lastReorder) reorderSelected(lastReorder);
  for (const { moveId, beforeId } of moves) moveSelected(moveId, beforeId);
  updateQueue.length = 0;
  updateTimer = null;
}

export function enqueueAddElement(id: number): void {
  addElementsQueue.push({ type: "addElement", id });
  if (!addElementsTimer) addElementsTimer = setTimeout(flushAddElements, ADD_ELEMENTS_BATCH_MS);
}

export function enqueueAddSelected(id: number): void {
  updateQueue.push({ type: "addSelected", id });
  if (!updateTimer) updateTimer = setTimeout(flushUpdate, GET_UPDATE_BATCH_MS);
}

export function enqueueAddSelectedBatch(ids: number[]): void {
  for (const id of ids) updateQueue.push({ type: "addSelected", id });
  if (!updateTimer) updateTimer = setTimeout(flushUpdate, GET_UPDATE_BATCH_MS);
}

export function enqueueRemoveSelected(id: number): void {
  updateQueue.push({ type: "removeSelected", id });
  if (!updateTimer) updateTimer = setTimeout(flushUpdate, GET_UPDATE_BATCH_MS);
}

export function enqueueReorderSelected(ids: number[]): void {
  updateQueue.push({ type: "reorderSelected", ids });
  if (!updateTimer) updateTimer = setTimeout(flushUpdate, GET_UPDATE_BATCH_MS);
}

export function enqueueMoveSelected(moveId: number, beforeId: number | null): void {
  updateQueue.push({ type: "moveSelected", moveId, beforeId });
  if (!updateTimer) updateTimer = setTimeout(flushUpdate, GET_UPDATE_BATCH_MS);
}

function flushBeforeGet() {
  if (updateTimer) {
    clearTimeout(updateTimer);
    flushUpdate();
  }
  if (addElementsTimer) {
    clearTimeout(addElementsTimer);
    flushAddElements();
  }
}

export function getAvailablePaginated(page: number, limit: number, filter?: string): number[] {
  flushBeforeGet();
  if (filter !== undefined && filter !== "") {
    const all = getAvailableIdsFiltered(filter);
    const start = (page - 1) * limit;
    return all.slice(start, start + limit);
  }
  const start = (page - 1) * limit;
  return getAvailableSlice(start, limit);
}

export function getSelectedPaginated(page: number, limit: number, filter?: string): number[] {
  flushBeforeGet();
  const all = getSelectedIdsFiltered(filter);
  const start = (page - 1) * limit;
  return all.slice(start, start + limit);
}

export function getTotalAvailable(filter?: string): number {
  flushBeforeGet();
  if (filter !== undefined && filter !== "") {
    return getAvailableIdsFiltered(filter).length;
  }
  return getAvailableTotal();
}

export function getTotalSelected(filter?: string): number {
  flushBeforeGet();
  return getSelectedIdsFiltered(filter).length;
}

export function getSelectedOrder(): number[] {
  flushBeforeGet();
  return getSelectedIds();
}
