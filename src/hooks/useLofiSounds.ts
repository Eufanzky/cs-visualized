'use client';

import { useCallback, useEffect, useState } from 'react';
import { lofiSounds, type StepLike } from '../lib/lofi-sounds';

export function useLofiSounds() {
  const [isMuted, setIsMuted] = useState(false);

  const toggle = useCallback(() => {
    const soundOn = lofiSounds.toggle();
    setIsMuted(!soundOn);
  }, []);

  const setVolume = useCallback((v: number) => {
    lofiSounds.setVolume(v);
  }, []);

  const playStep = useCallback((step: StepLike) => {
    lofiSounds.step(step);
  }, []);

  const compare = useCallback((value?: number) => {
    lofiSounds.compare(value);
  }, []);

  const swap = useCallback((v1?: number, v2?: number) => {
    lofiSounds.swap(v1, v2);
  }, []);

  const sorted = useCallback((value?: number) => {
    lofiSounds.sorted(value);
  }, []);

  const complete = useCallback(() => {
    lofiSounds.complete();
  }, []);

  const click = useCallback(() => {
    lofiSounds.click();
  }, []);

  const visit = useCallback((value?: number) => {
    lofiSounds.visit(value);
  }, []);

  const found = useCallback(() => {
    lofiSounds.found();
  }, []);

  // Sync state
  useEffect(() => {
    setIsMuted(lofiSounds.isMuted());
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      lofiSounds.destroy();
    };
  }, []);

  return {
    isMuted,
    toggle,
    setVolume,
    playStep,
    compare,
    swap,
    sorted,
    complete,
    click,
    visit,
    found,
  };
}
