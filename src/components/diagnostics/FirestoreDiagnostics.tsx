'use client';

import { useState, useEffect } from 'react';

interface ReadLogEntry {
  timestamp: string;
  operation: string;
  collection: string;
  count: number;
  source: string;
}

interface DiagnosticData {
  total: number;
  log: ReadLogEntry[];
  byCollection: Record<string, number>;
  bySource: Record<string, number>;
}

export default function FirestoreDiagnostics() {
  const [data, setData] = useState<DiagnosticData | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    const fetchData = () => {
      if (typeof window !== 'undefined' && (window as any).getFirestoreReadLog) {
        const diagnosticData = (window as any).getFirestoreReadLog();
        setData(diagnosticData);
      }
    };

    fetchData();

    if (autoRefresh) {
      const interval = setInterval(fetchData, 1000); // Update every second
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const resetStats = () => {
    if (confirm('Reset all Firestore read statistics?')) {
      window.location.reload();
    }
  };

  if (!data) return null;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 bg-orange-600 text-white p-3 rounded-full shadow-lg hover:bg-orange-700 z-50 flex items-center space-x-2"
        title="Firestore Diagnostics"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span className="font-bold">{data.total}</span>
      </button>

      {/* Diagnostic Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 w-96 max-h-[80vh] bg-white border-2 border-orange-600 rounded-lg shadow-2xl z-50 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-orange-600 text-white p-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg">🔥 Firestore Diagnostics</h3>
              <p className="text-xs opacity-90">Session Reads: {data.total}</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-orange-700 rounded p-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <div className="text-2xl font-bold text-blue-700">{data.total}</div>
                <div className="text-xs text-blue-600">Total Reads</div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded p-3">
                <div className="text-2xl font-bold text-green-700">{data.log.length}</div>
                <div className="text-xs text-green-600">Operations</div>
              </div>
            </div>

            {/* By Collection */}
            <div>
              <h4 className="font-semibold text-sm mb-2 text-gray-700">📂 Reads by Collection</h4>
              <div className="space-y-1">
                {Object.entries(data.byCollection).map(([collection, count]) => (
                  <div key={collection} className="flex items-center justify-between bg-gray-50 rounded px-3 py-2 text-sm">
                    <span className="font-medium text-gray-700">{collection}</span>
                    <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded font-bold text-xs">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* By Source */}
            <div>
              <h4 className="font-semibold text-sm mb-2 text-gray-700">🎯 Reads by Source</h4>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {Object.entries(data.bySource)
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .map(([source, count]) => (
                    <div key={source} className="flex items-start justify-between bg-gray-50 rounded px-3 py-2 text-xs">
                      <span className="text-gray-700 flex-1 break-words">{source}</span>
                      <span className="bg-red-100 text-red-700 px-2 py-1 rounded font-bold ml-2 shrink-0">
                        {count}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Recent Operations */}
            <div>
              <h4 className="font-semibold text-sm mb-2 text-gray-700">📜 Recent Operations</h4>
              <div className="space-y-1 max-h-48 overflow-y-auto text-xs">
                {data.log.slice(-10).reverse().map((entry, idx) => (
                  <div key={idx} className="bg-gray-50 rounded px-3 py-2 border-l-4 border-orange-400">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-gray-700">{entry.operation}</span>
                      <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-bold">
                        {entry.count}
                      </span>
                    </div>
                    <div className="text-gray-500 text-xs truncate">{entry.source}</div>
                    <div className="text-gray-400 text-xs">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-2 pt-2 border-t">
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded"
                />
                <span>Auto-refresh</span>
              </label>
              <button
                onClick={resetStats}
                className="ml-auto bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600"
              >
                Reset Stats
              </button>
            </div>

            {/* Warning */}
            {data.total > 1000 && (
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <div className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-red-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <div className="font-semibold text-red-700 text-sm">High Read Count!</div>
                    <div className="text-xs text-red-600">
                      You've used {data.total} reads this session. Check for loops or duplicate queries.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
