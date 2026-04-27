"use client";

import { useState, useEffect, useRef } from "react";

export function useDragResize(
  storageKey: string,
  defaultSize: number,
  min: number,
  max: number
) {
  const [size, setSize] = useState(defaultSize);
  const sizeRef = useRef(size);
  sizeRef.current = size;

  useEffect(() => {
    const saved = Number(localStorage.getItem(storageKey));
    if (saved >= min && saved <= max) {
      setSize(saved);
      sizeRef.current = saved;
    }
  }, []);

  function startDrag(e: React.MouseEvent, direction: "right" | "left") {
    e.preventDefault();
    const startX = e.clientX;
    const startSize = sizeRef.current;

    function onMove(ev: MouseEvent) {
      const delta =
        direction === "right" ? ev.clientX - startX : startX - ev.clientX;
      const next = Math.min(max, Math.max(min, startSize + delta));
      setSize(next);
      sizeRef.current = next;
    }

    function onUp() {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      localStorage.setItem(storageKey, String(sizeRef.current));
    }

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  return { size, startDrag };
}
