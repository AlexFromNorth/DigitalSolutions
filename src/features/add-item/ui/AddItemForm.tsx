'use client';

import { useState, useCallback } from 'react';

type AddItemFormProps = {
  onAdd: (id: number) => void;
};

export function AddItemForm({ onAdd }: AddItemFormProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      const num = parseInt(value.trim(), 10);
      if (Number.isNaN(num) || num < 1) {
        setError('Enter a valid positive ID');
        return;
      }
      onAdd(num);
      setValue('');
    },
    [value, onAdd]
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="text"
          inputMode="numeric"
          placeholder="New ID (e.g. 1000001)"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
        <button
          type="submit"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent/50"
        >
          Add
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  );
}
