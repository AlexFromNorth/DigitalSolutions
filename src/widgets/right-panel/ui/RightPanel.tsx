'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ItemRow } from '@/entities/item';
import { FilterInput } from '@/features/filter';
import {
  getSelected,
  enqueueRemoveSelected,
  enqueueMoveSelected,
} from '@/shared/api/client';

const LIMIT = 20;

function SortableItemRow({
  id,
  onRemove,
}: {
  id: number;
  onRemove: (id: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: String(id) });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? 'opacity-50' : ''}>
      <ItemRow
        id={id}
        draggable
        actions={
          <div className="flex items-center gap-1">
            <button
              type="button"
              {...attributes}
              {...listeners}
              className="cursor-grab rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 active:cursor-grabbing"
              aria-label="Drag to reorder"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 2a1 1 0 011 1v1h3a1 1 0 110 2H8v1a1 1 0 11-2 0V6H4a1 1 0 110-2h3V3a1 1 0 011-1zm10 4a1 1 0 011 1v1h3a1 1 0 110 2h-3v1a1 1 0 11-2 0V7h-3a1 1 0 110-2h3V6a1 1 0 011-1zM4 12a1 1 0 011 1v3h3a1 1 0 110 2H5v3a1 1 0 11-2 0v-3H2a1 1 0 110-2h3v-3a1 1 0 011-1zm12 0a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3h-3a1 1 0 110-2h3v-3a1 1 0 011-1z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => onRemove(id)}
              className="rounded px-2 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50 hover:text-red-700"
            >
              Remove
            </button>
          </div>
        }
      />
    </div>
  );
}

export function RightPanel() {
  const [filter, setFilter] = useState('');
  const [ids, setIds] = useState<number[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingMore = useRef(false);
  const load = useCallback(
    async (p: number, append: boolean) => {
      if (loadingMore.current) return;
      loadingMore.current = true;
      setLoading(true);
      setError(null);
      try {
        const res = await getSelected(p, LIMIT, filter || undefined);
        setIds((prev) => (append ? [...prev, ...res.ids] : res.ids));
        setTotal(res.total);
        setPage(p);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        setLoading(false);
        loadingMore.current = false;
      }
    },
    [filter]
  );

  useEffect(() => {
    load(1, false);
  }, [filter]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const [e] = entries;
        if (!e?.isIntersecting || loading || ids.length >= total) return;
        load(page + 1, true);
      },
      { rootMargin: '100px', threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [load, page, loading, ids.length, total]);

  const handleRemove = useCallback((id: number) => {
    enqueueRemoveSelected(id);
    setIds((prev) => prev.filter((x) => x !== id));
    setTotal((t) => Math.max(0, t - 1));
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const currentIds = [...ids];
      const oldIndex = currentIds.indexOf(Number(active.id));
      const newIndex = currentIds.indexOf(Number(over.id));
      if (oldIndex === -1 || newIndex === -1) return;
      const moveId = Number(active.id);
      const reordered = arrayMove(currentIds, oldIndex, newIndex);
      const beforeId = reordered[newIndex + 1] ?? null;
      setIds(reordered);
      enqueueMoveSelected(moveId, beforeId);
    },
    [ids]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-panel-bg shadow-lg">
      <div className="border-b border-slate-200 bg-panel-header px-4 py-3">
        <h2 className="mb-3 text-lg font-semibold text-slate-800">Selected items</h2>
        <FilterInput value={filter} onChange={setFilter} placeholder="Filter by ID" />
        <p className="mt-2 text-xs text-slate-500">
          Drag the handle to reorder. State is saved on the server.
        </p>
      </div>
      <div className="flex-1 overflow-auto p-3">
        {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={ids.map(String)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {ids.map((id) => (
                <SortableItemRow key={id} id={id} onRemove={handleRemove} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        <div ref={sentinelRef} className="h-4" />
        {loading && ids.length === 0 && (
          <p className="py-4 text-center text-sm text-slate-500">Loading…</p>
        )}
        {ids.length > 0 && ids.length < total && loading && (
          <p className="py-2 text-center text-sm text-slate-500">Loading more…</p>
        )}
        {!loading && ids.length === 0 && total === 0 && (
          <p className="py-8 text-center text-sm text-slate-500">No selected items</p>
        )}
      </div>
      <div className="border-t border-slate-200 px-4 py-2 text-xs text-slate-500">
        Showing {ids.length} of {total}
      </div>
    </div>
  );
}
