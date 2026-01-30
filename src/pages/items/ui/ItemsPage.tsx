'use client';

import { LeftPanel } from '@/widgets/left-panel';
import { RightPanel } from '@/widgets/right-panel';

export  default  function ItemsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">
      <header className="mb-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-800">
          Items list
        </h1>
        <p className="mt-1 text-slate-500">
          1,000,000 elements — filter, select, sort. State saved on server.
        </p>
      </header>
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="min-h-[70vh] lg:min-h-[80vh]">
          <LeftPanel />
        </div>
        <div className="min-h-[70vh] lg:min-h-[80vh]">
          <RightPanel />
        </div>
      </div>
    </main>
  );
}
