import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { CATEGORIES, getCategoryById } from '@/lib/categories';
import AnimatedBreadcrumb from '@/components/AnimatedBreadcrumb';
import AnimCardReveal from '@/components/AnimCardReveal';
import AnimCardClient from '@/components/AnimCardClient';

/* ── Static params (SSG) ───────────────────────────────────────────── */

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ id: c.id }));
}

/* ── Metadata ───────────────────────────────────────────────────────── */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const category = getCategoryById(id);
  if (!category) return { title: 'Not Found' };
  return {
    title: category.title,
    description: category.description,
  };
}

/* ── Page ───────────────────────────────────────────────────────────── */

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const category = getCategoryById(id);
  if (!category) notFound();

  const readyAnims = category.animations.filter((a) => a.status === 'ready');
  const comingAnims = category.animations.filter((a) => a.status === 'coming');

  return (
    <>
      {/* ── Atmospheric background glow ─────────────────────────────── */}
      <div
        className="page-glow"
        style={{ '--page-accent': category.glowRgba } as React.CSSProperties}
        aria-hidden
      />

      {/* ── Background orb behind header ────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          top: '-80px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${category.accentHex}0d 0%, transparent 70%)`,
          filter: 'blur(60px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
        aria-hidden
      />

      {/* ── Category Hero ─────────────────────────────────────────── */}
      <section
        style={{
          padding: 'clamp(80px, 12vw, 120px) clamp(1rem, 3vw, 2rem) 56px',
          maxWidth: 'var(--max-width)',
          margin: '0 auto',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Animated breadcrumb */}
        <AnimatedBreadcrumb
          segments={[
            { label: 'home', href: '/' },
            { label: category.title },
          ]}
        />

        {/* Icon + Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.25rem' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              fontSize: '0.95rem',
              background: category.glowRgba,
              border: `1px solid ${category.accentHex}44`,
              color: category.accentHex,
              flexShrink: 0,
            }}
          >
            {category.icon}
          </div>
          <h1
            className="category-page-title"
            style={{ color: 'var(--text-primary)' }}
          >
            {category.title}
          </h1>
        </div>

        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '1.1rem',
            maxWidth: '580px',
            lineHeight: 1.75,
            marginTop: '0.5rem',
          }}
        >
          {category.description}
        </p>

        {/* Stats row */}
        <div
          style={{
            display: 'flex',
            gap: '2rem',
            marginTop: '2.5rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
          }}
        >
          <span>
            <span
              style={{
                fontFamily: 'var(--font-sans)',
                fontWeight: 600,
                fontSize: '1.1rem',
                color: 'var(--text-primary)',
                marginRight: '0.35rem',
              }}
            >
              {category.animations.length}
            </span>
            total
          </span>
          {readyAnims.length > 0 && (
            <span>
              <span
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  color: 'var(--syn-success)',
                  marginRight: '0.35rem',
                }}
              >
                {readyAnims.length}
              </span>
              ready
            </span>
          )}
          <span>
            <span
              style={{
                fontFamily: 'var(--font-sans)',
                fontWeight: 600,
                fontSize: '1.1rem',
                color: 'var(--text-muted)',
                marginRight: '0.35rem',
              }}
            >
              {comingAnims.length}
            </span>
            coming soon
          </span>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="section-divider" aria-hidden />

      {/* ── Animations Grid ───────────────────────────────────────── */}
      <section
        style={{
          padding: '48px clamp(1rem, 3vw, 2rem) clamp(64px, 10vw, 120px)',
          maxWidth: 'var(--max-width)',
          margin: '0 auto',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Ready animations first */}
        {readyAnims.length > 0 && (
          <>
            <h2
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                color: 'var(--syn-success)',
                marginBottom: '1.25rem',
              }}
            >
              {'// available now'}
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))',
                gap: '1.25rem',
                marginBottom: '3rem',
              }}
            >
              {readyAnims.map((anim, i) => (
                <AnimCardReveal key={anim.id} index={i}>
                  <AnimCardClient
                    href={`/animation/${category.id}/${anim.id}`}
                    title={anim.title}
                    complexity={anim.complexity}
                    status="ready"
                    accentHex={category.accentHex}
                  />
                </AnimCardReveal>
              ))}
            </div>
          </>
        )}

        {/* Coming soon animations */}
        {comingAnims.length > 0 && (
          <>
            <h2
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                color: 'var(--text-muted)',
                marginBottom: '1.25rem',
              }}
            >
              {'// coming soon'}
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))',
                gap: '1.25rem',
              }}
            >
              {comingAnims.map((anim, i) => (
                <AnimCardReveal key={anim.id} index={i}>
                  <AnimCardClient
                    href="#"
                    title={anim.title}
                    complexity={anim.complexity}
                    status="coming"
                    accentHex={category.accentHex}
                  />
                </AnimCardReveal>
              ))}
            </div>
          </>
        )}
      </section>
    </>
  );
}
