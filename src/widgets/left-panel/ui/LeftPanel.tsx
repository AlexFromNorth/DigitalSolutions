'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { ItemRow } from '@/entities/item';
import { FilterInput } from '@/features/filter';
import { AddItemForm } from '@/features/add-item';
import { getAvailable, enqueueAddElement, enqueueAddSelected } from '@/shared/api/client';

const LIMIT = 20;

export function LeftPanel() {
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
        const res = await getAvailable(p, LIMIT, filter || undefined);
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

  const handleAddElement = useCallback((id: number) => {
    enqueueAddElement(id);
    setIds((prev) => (prev.includes(id) ? prev : [...prev, id].sort((a, b) => a - b)));
    setTotal((t) => t + 1);
  }, []);

  const handleSelect = useCallback((id: number) => {
    enqueueAddSelected(id);
    setIds((prev) => prev.filter((x) => x !== id));
    setTotal((t) => Math.max(0, t - 1));
  }, []);

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-panel-bg shadow-lg">
      <div className="border-b border-slate-200 bg-panel-header px-4 py-3">
        <h2 className="mb-3 text-lg font-semibold text-slate-800">Available items</h2>
        <div className="space-y-3">
          <FilterInput value={filter} onChange={setFilter} placeholder="Filter by ID" />
          <AddItemForm onAdd={handleAddElement} />
        </div>
      </div>
      <div className="flex-1 overflow-auto p-3">
        {error && (
          <p className="mb-2 text-sm text-red-600">{error}</p>
        )}
        <div className="space-y-2">
          {ids.map((id) => (
            <ItemRow
              key={id}
              id={id}
              actions={
                <button
                  type="button"
                  onClick={() => handleSelect(id)}
                  className="rounded bg-accent px-2 py-1 text-xs font-medium text-white transition hover:bg-accent-hover"
                >
                  Add
                </button>
              }
            />
          ))}
        </div>
        <div ref={sentinelRef} className="h-4" />
        {loading && ids.length === 0 && (
          <p className="py-4 text-center text-sm text-slate-500">Loading…</p>
        )}
        {ids.length > 0 && ids.length < total && loading && (
          <p className="py-2 text-center text-sm text-slate-500">Loading more…</p>
        )}
        {!loading && ids.length === 0 && total === 0 && (
          <p className="py-8 text-center text-sm text-slate-500">No items</p>
        )}
      </div>
      <div className="border-t border-slate-200 px-4 py-2 text-xs text-slate-500">
        Showing {ids.length} of {total}
      </div>
    </div>
  );
}
