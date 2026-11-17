"use client";

import { useLayoutEffect, useRef } from "react";

const DURATION_MS = 200;

/**
 * Slides list items to their new position when items are added, removed or reordered
 * (FLIP: measure after render, then animate from the old offset to the new one).
 *
 * Put the returned ref on a positioned container (e.g. `relative`) and give each item a
 * stable `data-flip-id`. Items that are new to the list appear without animating.
 */
export function useListReorderAnimation<T extends HTMLElement>(items: unknown) {
  const ref = useRef<T>(null);
  const offsets = useRef(new Map<string, number>());

  useLayoutEffect(() => {
    const container = ref.current;
    if (!container) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const next = new Map<string, number>();

    container
      .querySelectorAll<HTMLElement>(":scope > [data-flip-id]")
      .forEach((element) => {
        const id = element.dataset.flipId as string;
        // offsetTop is relative to the container and ignores transforms and page scroll
        const offset = element.offsetTop;
        const previous = offsets.current.get(id);
        next.set(id, offset);

        if (reduceMotion || previous === undefined || previous === offset) {
          return;
        }
        element.animate(
          [
            { transform: `translateY(${previous - offset}px)` },
            { transform: "none" },
          ],
          { duration: DURATION_MS, easing: "ease-out" },
        );
      });

    offsets.current = next;
  }, [items]);

  return ref;
}
