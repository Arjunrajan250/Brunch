'use client';

import React from 'react';
import { useBrunch } from '@/context/BrunchContext';

export function Toast() {
  const { toastMsg } = useBrunch();

  return (
    <div
      className={`toast ${toastMsg ? 'on' : ''}`}
      role="status"
      aria-live="polite"
    >
      {toastMsg}
    </div>
  );
}

