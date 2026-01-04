'use client';

import { flushOfflineQueue } from "@/lib/offline-queue";
import { useEffect, useState } from "react";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  const [isOffline, setIsOffline] = useState<boolean>(() =>
    typeof navigator === "undefined" ? false : !navigator.onLine,
  );
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.error("Service worker registration failed", error);
      });
    }

    if (navigator.onLine) {
      flushOfflineQueue();
    }

    const goOnline = async () => {
      setIsOffline(false);
      const result = await flushOfflineQueue();
      if (result.flushed > 0) {
        setSyncMessage(`${result.flushed} offline item(s) synced`);
        setTimeout(() => setSyncMessage(null), 3200);
      }
    };

    const goOffline = () => setIsOffline(true);

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return (
    <>
      {isOffline && (
        <div className="w-full bg-amber-500 text-sm text-slate-950 px-3 py-2 text-center">
          Offline mode: entries will be queued and synced when you reconnect.
        </div>
      )}
      {syncMessage && (
        <div className="w-full bg-emerald-600 text-sm text-white px-3 py-2 text-center">
          {syncMessage}
        </div>
      )}
      {children}
    </>
  );
}