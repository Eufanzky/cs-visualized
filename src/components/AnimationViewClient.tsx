'use client';

import dynamic from 'next/dynamic';
import CanvasSkeleton from './CanvasSkeleton';

// AnimationView uses browser-only APIs (requestAnimationFrame, HTMLCanvasElement).
// This client-boundary wrapper prevents it from being executed during SSR/prerender.
const AnimationView = dynamic(
  () => import('./AnimationView').then((m) => m.AnimationView),
  {
    ssr: false,
    loading: () => <CanvasSkeleton height={480} />,
  }
);

interface AnimationViewClientProps {
  algorithmId: string;
  initialSize?: number;
}

export function AnimationViewClient(props: AnimationViewClientProps) {
  return <AnimationView {...props} />;
}
