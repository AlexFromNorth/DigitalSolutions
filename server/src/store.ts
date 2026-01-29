const MAX_ID = 1_000_000;
let selectedIds: number[] = [];
const customIds = new Set<number>();

export function getSelectedIds(): number[] {
  return [...selectedIds];
}

export function setSelectedIds(ids: number[]): void {
  selectedIds = ids;
}

export function addToSelected(ids: number[]): void {
  const set = new Set(selectedIds);
  for (const id of ids) {
    set.add(id);
  }
  selectedIds = [...set];
}

export function removeFromSelected(id: number): void {
  selectedIds = selectedIds.filter((x) => x !== id);
}

export function reorderSelected(orderedIds: number[]): void {
  const currentSet = new Set(selectedIds);
  const valid = orderedIds.filter((id) => currentSet.has(id));
  const rest = selectedIds.filter((id) => !valid.includes(id));
  selectedIds = [...valid, ...rest];
}

export function moveSelected(moveId: number, beforeId: number | null): void {
  const idx = selectedIds.indexOf(moveId);
  if (idx === -1) return;
  const without = selectedIds.filter((_, i) => i !== idx);
  if (beforeId === null) {
    selectedIds = [...without, moveId];
    return;
  }
  const beforeIdx = without.indexOf(beforeId);
  if (beforeIdx === -1) {
    selectedIds = [...without, moveId];
    return;
  }
  selectedIds = [...without.slice(0, beforeIdx), moveId, ...without.slice(beforeIdx)];
}

export function addCustomId(id: number): void {
  customIds.add(id);
}

export function addCustomIds(ids: number[]): void {
  ids.forEach((id) => customIds.add(id));
}

export function isCustomId(id: number): boolean {
  return customIds.has(id);
}

export function getAvailableIdsFiltered(filter: string): number[] {
  const selectedSet = getSelectedSet();
  const num = parseInt(filter, 10);
  if (Number.isNaN(num)) return [];
  const isAvailable = (num >= 1 && num <= MAX_ID) || customIds.has(num);
  if (isAvailable && !selectedSet.has(num)) return [num];
  return [];
}

const selectedSetForAvailable = new Set<number>();
function getSelectedSet(): Set<number> {
  selectedSetForAvailable.clear();
  for (const id of selectedIds) selectedSetForAvailable.add(id);
  return selectedSetForAvailable;
}

export function getAvailableSlice(offset: number, limit: number): number[] {
  const selectedSet = getSelectedSet();
  const result: number[] = [];
  let count = 0;
  for (let i = 1; i <= MAX_ID; i++) {
    if (!selectedSet.has(i)) {
      if (count >= offset) result.push(i);
      count++;
      if (result.length >= limit) return result;
    }
  }
  const customSorted = [...customIds].sort((a, b) => a - b);
  for (const id of customSorted) {
    if (!selectedSet.has(id)) {
      if (count >= offset) result.push(id);
      count++;
      if (result.length >= limit) return result;
    }
  }
  return result;
}

export function getAvailableTotal(): number {
  const selectedSet = getSelectedSet();
  let count = 0;
  for (let i = 1; i <= MAX_ID; i++) {
    if (!selectedSet.has(i)) count++;
  }
  for (const id of customIds) {
    if (!selectedSet.has(id)) count++;
  }
  return count;
}

export function getSelectedIdsFiltered(filter?: string): number[] {
  if (filter !== undefined && filter !== "") {
    const num = parseInt(filter, 10);
    if (!Number.isNaN(num) && selectedIds.includes(num)) return [num];
    return [];
  }
  return [...selectedIds];
}

export function getMaxId(): number {
  let max = MAX_ID;
  for (const id of customIds) {
    if (id > max) max = id;
  }
  return max;
}
