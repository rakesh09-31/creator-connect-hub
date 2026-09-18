import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getScrollParent(node: HTMLElement | null): HTMLElement | null {
  if (!node || typeof window === "undefined") return null;
  let parent = node.parentElement;
  while (parent && parent !== document.body && parent !== document.documentElement) {
    const { overflowY } = window.getComputedStyle(parent);
    if (overflowY === "auto" || overflowY === "scroll") {
      if (parent.scrollHeight > parent.clientHeight) {
        return parent;
      }
    }
    parent = parent.parentElement;
  }
  return null;
}

export function isElementNearViewport(
  el: HTMLElement | null,
  scrollParent: HTMLElement | null,
  margin = 400
): boolean {
  if (!el || typeof window === "undefined") return true;
  try {
    const rect = el.getBoundingClientRect();
    if (scrollParent) {
      const parentRect = scrollParent.getBoundingClientRect();
      return rect.top < parentRect.bottom + margin && rect.bottom > parentRect.top - margin;
    }
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    return rect.top < viewportHeight + margin && rect.bottom > -margin;
  } catch {
    return true;
  }
}
