const registry: Record<string, HTMLElement | null> = {};

export function registerDockZone(id: string, el: HTMLElement | null) {
  if (!id) return;
  registry[id] = el;
}

export function getDockZoneElement(id: string): HTMLElement | null | undefined {
  return registry[id];
}

export default { registerDockZone, getDockZoneElement };
