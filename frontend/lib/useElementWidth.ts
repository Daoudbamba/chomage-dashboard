"use client";

import { useEffect, useRef, useState } from "react";

/** Measures a container's width directly instead of relying on recharts'
 * own ResponsiveContainer, whose internal ResizeObserver can fail to fire
 * a first render in some environments (containers stay empty with no error). */
export function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const measure = () => setWidth(node.getBoundingClientRect().width);
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(node);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return [ref, width] as const;
}
