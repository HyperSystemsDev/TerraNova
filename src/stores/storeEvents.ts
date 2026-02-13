type EventMap = {
  "project:close": void;
  "editor:dirty": void;
};

type Handler<T> = T extends void ? () => void : (data: T) => void;

const listeners = new Map<string, Set<Function>>();

export function emit<K extends keyof EventMap>(
  event: K,
  ...[data]: EventMap[K] extends void ? [] : [EventMap[K]]
) {
  const set = listeners.get(event);
  if (set) {
    for (const fn of set) fn(data);
  }
}

export function on<K extends keyof EventMap>(event: K, handler: Handler<EventMap[K]>) {
  let set = listeners.get(event);
  if (!set) {
    set = new Set();
    listeners.set(event, set);
  }
  set.add(handler);
}

export function off<K extends keyof EventMap>(event: K, handler: Handler<EventMap[K]>) {
  listeners.get(event)?.delete(handler);
}
