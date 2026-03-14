'use client';

import { useCallback, useEffect, useState } from 'react';
import { lofiMusic } from '../lib/lofi-music';

export function useLofiMusic() {
  const [isPlaying, setIsPlaying] = useState(false);

  const toggle = useCallback(() => {
    const nowPlaying = lofiMusic.toggle();
    setIsPlaying(nowPlaying);
  }, []);

  const setVolume = useCallback((v: number) => {
    lofiMusic.setVolume(v);
  }, []);

  // Sync state if toggle is called externally
  useEffect(() => {
    setIsPlaying(lofiMusic.isPlaying());
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      lofiMusic.destroy();
    };
  }, []);

  return { isPlaying, toggle, setVolume };
}
