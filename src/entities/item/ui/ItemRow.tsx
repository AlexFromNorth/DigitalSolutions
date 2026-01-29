'use client';

import type { ReactNode } from 'react';

type ItemRowProps = {
  id: number;
  actions?: ReactNode;
  className?: string;
  draggable?: boolean;
};

export function ItemRow({ id, actions, className = '', draggable }: ItemRowProps) {
  return (
    <div
      className={`flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 shadow-sm transition hover:border-accent/30 hover:shadow ${className}`}
      data-id={id}
      draggable={draggable}
    >
      <span className="font-mono text-sm font-medium tabular-nums">ID {id}</span>
      {actions}
    </div>
  );
}
