import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { CATEGORIES, getAnimationById } from '@/lib/categories';
import { AnimationViewClient } from '@/components/AnimationViewClient';
import AnimatedBreadcrumb from '@/components/AnimatedBreadcrumb';

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
      complexity: { time: 'O(n\u00B2)', space: 'O(1)', best: 'O(n)', worst: 'O(n\u00B2)' },
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
        padding: 'clamp(72px, 10vw, 80px) clamp(1rem, 3vw, 2rem) 4rem',
        maxWidth: 'var(--max-width)',
        margin: '0 auto',
        position: 'relative',
      }}
    >
      {/* ── Atmospheric background glow ──────────────────────────── */}
      <div
        className="page-glow"
        style={{ '--page-accent': category.glowRgba } as React.CSSProperties}
        aria-hidden
      />

      {/* ── Header ──────────────────────────────────────────────── */}
      <header style={{ marginBottom: '2rem', position: 'relative', zIndex: 1 }}>
        {/* Animated breadcrumb */}
        <AnimatedBreadcrumb
          segments={[
            { label: 'home', href: '/' },
            { label: category.title, href: `/category/${category.id}` },
            { label: animation.title },
          ]}
        />

        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', flexWrap: 'wrap' }}>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
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
              marginBottom: '0.35rem',
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
      <div
        style={{
          marginBottom: '2.5rem',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Ambient glow behind canvas */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '80%',
            height: '80%',
            borderRadius: '24px',
            background: `radial-gradient(ellipse, ${category.accentHex}0a 0%, transparent 70%)`,
            filter: 'blur(40px)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
          aria-hidden
        />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <AnimationViewClient algorithmId={animation.id} initialSize={24} />
        </div>
      </div>

      {/* ── Info Panels ──────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))',
          gap: '1.25rem',
          marginTop: '2rem',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* How it works */}
        <div
          className="float-card"
          style={{
            padding: '1.75rem',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Accent line at top */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '2px',
              background: `linear-gradient(90deg, ${category.accentHex}, transparent)`,
              opacity: 0.6,
            }}
            aria-hidden
          />
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
          className="float-card"
          style={{
            padding: '1.75rem',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Accent line at top */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '2px',
              background: `linear-gradient(90deg, ${category.accentHex}, transparent)`,
              opacity: 0.6,
            }}
            aria-hidden
          />
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

        {/* Key insight — spans full width on wide screens */}
        <div
          className="float-card"
          style={{
            padding: '1.75rem',
            gridColumn: '1 / -1',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Accent line at top */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '2px',
              background: `linear-gradient(90deg, ${category.accentHex}, transparent)`,
              opacity: 0.6,
            }}
            aria-hidden
          />
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
