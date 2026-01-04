'use client';

import { del, get, set } from "idb-keyval";
import type { OfflineAction } from "@/lib/types";

const QUEUE_KEY = "budget-offline-queue";

export async function enqueueOfflineAction(action: OfflineAction) {
  const existing = ((await get<OfflineAction[]>(QUEUE_KEY)) ?? []).filter(Boolean);
  await set(QUEUE_KEY, [...existing, action]);
}

export async function readOfflineQueue() {
  return ((await get<OfflineAction[]>(QUEUE_KEY)) ?? []).filter(Boolean);
}

export async function clearOfflineQueue() {
  await del(QUEUE_KEY);
}

export async function flushOfflineQueue() {
  const queue = await readOfflineQueue();
  if (!queue.length) return { flushed: 0 };

  let flushed = 0;
  for (const action of queue) {
    try {
      const endpoint = action.type === "expense" ? "/api/expense" : "/api/income";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...action.payload,
          occurredAt: action.payload.occurredAt,
        }),
      });
      if (res.ok) {
        flushed += 1;
      }
    } catch (err) {
      console.error("Failed to flush offline item", err);
    }
  }

  if (flushed === queue.length) {
    await clearOfflineQueue();
  }

  return { flushed };
}