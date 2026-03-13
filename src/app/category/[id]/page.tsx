import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { CATEGORIES, getCategoryById } from '@/lib/categories';

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
      {/* ── Category Hero ─────────────────────────────────────────── */}
      <section
        style={{
          padding: '100px 2rem 40px',
          maxWidth: 'var(--max-width)',
          margin: '0 auto',
        }}
      >
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Link
            href="/"
            className="breadcrumb-link"
            style={{ color: 'var(--text-muted)', transition: 'color 0.25s' }}
          >
            home
          </Link>
          <span style={{ opacity: 0.4 }}>/</span>
          <span style={{ color: 'var(--text-secondary)' }}>
            {category.title}
          </span>
        </nav>

        {/* Icon + Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              fontSize: '0.9rem',
              background: category.glowRgba,
              border: `1px solid ${category.accentHex}44`,
              color: category.accentHex,
              flexShrink: 0,
            }}
          >
            {category.icon}
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              fontWeight: 400,
              lineHeight: 1.1,
              color: 'var(--text-primary)',
            }}
          >
            {category.title}
          </h1>
        </div>

        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '1.05rem',
            maxWidth: '560px',
            lineHeight: 1.7,
          }}
        >
          {category.description}
        </p>

        {/* Stats row */}
        <div
          style={{
            display: 'flex',
            gap: '2rem',
            marginTop: '2rem',
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

      {/* Divider */}
      <div
        style={{
          height: '1px',
          background: 'var(--border-subtle)',
          maxWidth: 'var(--max-width)',
          margin: '0 auto',
        }}
      />

      {/* ── Animations Grid ───────────────────────────────────────── */}
      <section
        style={{
          padding: '40px 2rem 120px',
          maxWidth: 'var(--max-width)',
          margin: '0 auto',
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
              // available now
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1.25rem',
                marginBottom: '3rem',
              }}
            >
              {readyAnims.map((anim) => (
                <AnimCard
                  key={anim.id}
                  href={`/animation/${category.id}/${anim.id}`}
                  title={anim.title}
                  complexity={anim.complexity}
                  status="ready"
                  accentHex={category.accentHex}
                />
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
              // coming soon
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1.25rem',
              }}
            >
              {comingAnims.map((anim) => (
                <AnimCard
                  key={anim.id}
                  href="#"
                  title={anim.title}
                  complexity={anim.complexity}
                  status="coming"
                  accentHex={category.accentHex}
                />
              ))}
            </div>
          </>
        )}
      </section>
    </>
  );
}

/* ── Animation Card Sub-component ──────────────────────────────────── */

interface AnimCardProps {
  href: string;
  title: string;
  complexity: string;
  status: 'ready' | 'coming';
  accentHex: string;
}

function AnimCard({ href, title, complexity, status, accentHex }: AnimCardProps) {
  const isReady = status === 'ready';

  return (
    <Link
      href={href}
      style={{
        display: 'block',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '1.5rem',
        textDecoration: 'none',
        transition: 'border-color 0.25s, background 0.25s, transform 0.25s',
        opacity: isReady ? 1 : 0.65,
        cursor: isReady ? 'pointer' : 'default',
        pointerEvents: isReady ? 'auto' : 'none',
      }}
      /* Inline hover via onMouse is only available in client components.
         For a server component sub-function we rely on CSS — add a className
         or use a CSS-in-JS trick. Since this file is a server component we keep
         the styling static; interactive hover is layered via globals.css below. */
      className={isReady ? 'anim-card-ready' : ''}
    >
      {/* Status badge */}
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.62rem',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: isReady ? 'var(--syn-success)' : 'var(--text-muted)',
          marginBottom: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: isReady ? 'var(--syn-success)' : 'var(--text-muted)',
          }}
        />
        {isReady ? 'ready' : 'coming soon'}
      </div>

      {/* Title */}
      <h3
        style={{
          fontSize: '1.05rem',
          fontWeight: 500,
          color: 'var(--text-primary)',
          marginBottom: '0.5rem',
        }}
      >
        {title}
      </h3>

      {/* Complexity */}
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.72rem',
          color: accentHex,
        }}
      >
        {complexity}
      </div>
    </Link>
  );
}
