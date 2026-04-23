"use client";

import { useEffect } from "react";

export function PrintTrigger() {
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      window.print();
    }, 400);

    return () => {
      window.clearTimeout(timeout);
    };
  }, []);

  return null;
}

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => {
        window.print();
      }}
    >
      Print or Save PDF
    </button>
  );
}
