import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { CATEGORIES, getAnimationById } from '@/lib/categories';
import { AnimationViewClient } from '@/components/AnimationViewClient';

/* ── Static params (SSG — only 'ready' animations get real routes) ─── */

export function generateStaticParams() {
  const params: { category: string; id: string }[] = [];
  for (const cat of CATEGORIES) {
    for (const anim of cat.animations) {
      if (anim.status === 'ready') {
        params.push({ category: cat.id, id: anim.id });
      }
    }
  }
  return params;
}

/* ── Metadata ───────────────────────────────────────────────────────── */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; id: string }>;
}): Promise<Metadata> {
  const { category: categoryId, id } = await params;
  const result = getAnimationById(categoryId, id);
  if (!result) return { title: 'Not Found' };
  return {
    title: `${result.animation.title} — ${result.category.title}`,
    description: `Interactive step-through visualization of ${result.animation.title}. Time complexity: ${result.animation.complexity}.`,
  };
}

/* ── Page ───────────────────────────────────────────────────────────── */

export default async function AnimationPage({
  params,
}: {
  params: Promise<{ category: string; id: string }>;
}) {
  const { category: categoryId, id } = await params;
  const result = getAnimationById(categoryId, id);
  if (!result) notFound();

  const { category, animation } = result;

  /* Lookup table: algorithm-specific description snippets */
  const algorithmInfo: Record<
    string,
    { howItWorks: string[]; complexity: { time: string; space: string; best: string; worst: string }; keyInsight: string }
  > = {
    'bubble-sort': {
      howItWorks: [
        'Compare adjacent elements side-by-side.',
        'Swap them if the left is greater than the right.',
        'Repeat until no swaps occur — the array is sorted.',
        'Each full pass "bubbles" the largest unsorted element to its correct position.',
      ],
      complexity: { time: 'O(n²)', space: 'O(1)', best: 'O(n)', worst: 'O(n²)' },
      keyInsight:
        'Although simple to implement, Bubble Sort is rarely used in practice due to its quadratic time complexity. It shines as a teaching tool for understanding in-place comparison sorting.',
    },
  };

  const info = algorithmInfo[animation.id] ?? {
    howItWorks: ['Algorithm steps will appear here during playback.'],
    complexity: {
      time: animation.complexity,
      space: 'O(1)',
      best: animation.complexity,
      worst: animation.complexity,
    },
    keyInsight: 'Interact with the controls to step through the algorithm.',
  };

  return (
    <div
      style={{
        padding: '80px 2rem 4rem',
        maxWidth: 'var(--max-width)',
        margin: '0 auto',
      }}
    >
      {/* ── Header ──────────────────────────────────────────────── */}
      <header style={{ marginBottom: '2rem' }}>
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Link
            href="/"
            style={{ color: 'var(--text-muted)', transition: 'color 0.25s' }}
            className="breadcrumb-link"
          >
            home
          </Link>
          <span style={{ opacity: 0.4 }}>/</span>
          <Link
            href={`/category/${category.id}`}
            style={{ color: 'var(--text-muted)', transition: 'color 0.25s' }}
            className="breadcrumb-link"
          >
            {category.title}
          </Link>
          <span style={{ opacity: 0.4 }}>/</span>
          <span style={{ color: 'var(--text-secondary)' }}>
            {animation.title}
          </span>
        </nav>

        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', flexWrap: 'wrap' }}>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(1.8rem, 4vw, 3rem)',
              fontWeight: 400,
              lineHeight: 1.1,
              color: 'var(--text-primary)',
            }}
          >
            {animation.title}
          </h1>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.78rem',
              color: category.accentHex,
              marginBottom: '0.25rem',
              padding: '0.2rem 0.6rem',
              background: category.glowRgba,
              border: `1px solid ${category.accentHex}33`,
              borderRadius: 'var(--radius-sm)',
            }}
          >
            {animation.complexity}
          </div>
        </div>
        <p
          style={{
            marginTop: '0.5rem',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.72rem',
          }}
        >
          {category.title}
        </p>
      </header>

      {/* ── Animation Canvas + Controls (client component) ──────── */}
      <div style={{ marginBottom: '1.5rem' }}>
        <AnimationViewClient algorithmId={animation.id} initialSize={24} />
      </div>

      {/* ── Info Panels ──────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          marginTop: '1.5rem',
        }}
      >
        {/* How it works */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1.5rem',
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.68rem',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              color: 'var(--text-muted)',
              marginBottom: '1rem',
            }}
          >
            {'// how it works'}
          </h2>
          <ol style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {info.howItWorks.map((step, i) => (
              <li
                key={i}
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  fontSize: '0.88rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.68rem',
                    color: category.accentHex,
                    minWidth: '1.5rem',
                    paddingTop: '0.1rem',
                  }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        {/* Complexity table */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1.5rem',
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.68rem',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              color: 'var(--text-muted)',
              marginBottom: '1rem',
            }}
          >
            {'// complexity'}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {(
              [
                ['Time (avg)', info.complexity.time],
                ['Time (best)', info.complexity.best],
                ['Time (worst)', info.complexity.worst],
                ['Space', info.complexity.space],
              ] as [string, string][]
            ).map(([label, value]) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid var(--border-subtle)',
                  paddingBottom: '0.6rem',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.72rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  {label}
                </span>
                <code
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.82rem',
                    color: 'var(--syn-number)',
                    background: 'var(--bg-elevated)',
                    padding: '0.15rem 0.5rem',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  {value}
                </code>
              </div>
            ))}
          </div>
        </div>

        {/* Key insight — spans full width if only one row left */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1.5rem',
            gridColumn: 'span 2',
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.68rem',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              color: 'var(--text-muted)',
              marginBottom: '0.75rem',
            }}
          >
            {'// key insight'}
          </h2>
          <p
            style={{
              fontSize: '0.9rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.75,
            }}
          >
            {info.keyInsight}
          </p>
        </div>
      </div>
    </div>
  );
}
