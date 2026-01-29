const API = '/api';
const ADD_BATCH_MS = 10_000;
const GET_UPDATE_BATCH_MS = 1_000;

export type AvailableResponse = { ids: number[]; total: number; page: number; limit: number };
export type SelectedResponse = { ids: number[]; total: number; page: number; limit: number };
export type OrderResponse = { order: number[] };

const addElementQueue: number[] = new Array();
const addSelectedQueue: number[] = new Array();
const removeSelectedQueue: number[] = new Array();
let movePayload: { moveId: number; beforeId: number | null } | null = null;
let addElementTimer: ReturnType<typeof setTimeout> | null = null;
let getUpdateTimer: ReturnType<typeof setTimeout> | null = null;

function flushAddElements() {
  if (addElementQueue.length === 0) {
    addElementTimer = null;
    return;
  }
  const seen = new Set<number>();
  const ids: number[] = [];
  for (const id of addElementQueue) {
    if (!seen.has(id)) {
      seen.add(id);
      ids.push(id);
    }
  }
  addElementQueue.length = 0;
  addElementTimer = null;
  ids.forEach((id) =>
    fetch(`${API}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    }).catch(() => {})
  );
}

function flushGetUpdate() {
  const toAdd = [...new Set(addSelectedQueue)];
  const toRemove = [...new Set(removeSelectedQueue)];
  addSelectedQueue.length = 0;
  removeSelectedQueue.length = 0;
  const move = movePayload;
  movePayload = null;
  getUpdateTimer = null;

  const run = async () => {
    if (toAdd.length) {
      await fetch(`${API}/selected`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: toAdd }),
      }).catch(() => {});
    }
    for (const id of toRemove) {
      await fetch(`${API}/selected/${id}`, { method: 'DELETE' }).catch(() => {});
    }
    if (move) {
      await fetch(`${API}/selected/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moveId: move.moveId, beforeId: move.beforeId }),
      }).catch(() => {});
    }
  };
  run();
}

export function enqueueAddElement(id: number): void {
  addElementQueue.push(id);
  if (!addElementTimer) addElementTimer = setTimeout(flushAddElements, ADD_BATCH_MS);
}

export function enqueueAddSelected(id: number): void {
  addSelectedQueue.push(id);
  if (!getUpdateTimer) getUpdateTimer = setTimeout(flushGetUpdate, GET_UPDATE_BATCH_MS);
}

export function enqueueAddSelectedBatch(ids: number[]): void {
  ids.forEach((id) => addSelectedQueue.push(id));
  if (!getUpdateTimer) getUpdateTimer = setTimeout(flushGetUpdate, GET_UPDATE_BATCH_MS);
}

export function enqueueRemoveSelected(id: number): void {
  removeSelectedQueue.push(id);
  if (!getUpdateTimer) getUpdateTimer = setTimeout(flushGetUpdate, GET_UPDATE_BATCH_MS);
}

export function enqueueMoveSelected(moveId: number, beforeId: number | null): void {
  movePayload = { moveId, beforeId };
  if (!getUpdateTimer) getUpdateTimer = setTimeout(flushGetUpdate, GET_UPDATE_BATCH_MS);
}

export function flushPending(): Promise<void> {
  return new Promise((resolve) => {
    if (addElementTimer) {
      clearTimeout(addElementTimer);
      flushAddElements();
    }
    if (getUpdateTimer) {
      clearTimeout(getUpdateTimer);
      flushGetUpdate();
      setTimeout(resolve, 50);
    } else resolve();
  });
}

export async function getAvailable(
  page: number,
  limit: number,
  filter?: string
): Promise<AvailableResponse> {
  await flushPending();
  const q = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (filter !== undefined && filter !== '') q.set('filter', filter);
  const r = await fetch(`${API}/available?${q}`);
  if (!r.ok) throw new Error('Failed to fetch available');
  return r.json();
}

export async function getSelected(
  page: number,
  limit: number,
  filter?: string
): Promise<SelectedResponse> {
  await flushPending();
  const q = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (filter !== undefined && filter !== '') q.set('filter', filter);
  const r = await fetch(`${API}/selected?${q}`);
  if (!r.ok) throw new Error('Failed to fetch selected');
  return r.json();
}

export async function getSelectedOrder(): Promise<OrderResponse> {
  await flushPending();
  const r = await fetch(`${API}/selected/order`);
  if (!r.ok) throw new Error('Failed to fetch order');
  return r.json();
}
