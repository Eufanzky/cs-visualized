import CategoryCard from '@/components/CategoryCard';
import { CATEGORIES, TOTAL_ANIMATIONS, READY_ANIMATIONS } from '@/lib/categories';

export default function HomePage() {
  return (
    <>
      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section
        style={{
          position: 'relative',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '120px 2rem 80px',
          maxWidth: 'var(--max-width)',
          margin: '0 auto',
          overflow: 'hidden',
        }}
      >
        {/* Background grid decoration */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 0,
            right: '-10%',
            width: '60%',
            height: '100%',
            opacity: 0.04,
            backgroundImage: `
              linear-gradient(var(--text-muted) 1px, transparent 1px),
              linear-gradient(90deg, var(--text-muted) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
            maskImage: 'radial-gradient(ellipse at 70% 50%, black 20%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(ellipse at 70% 50%, black 20%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Eyebrow */}
        <p
          className="anim-fade-up anim-delay-0"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            color: 'var(--syn-string)',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            marginBottom: '1.5rem',
          }}
        >
          <span style={{ color: 'var(--text-muted)' }}>{'//'} </span>
          interactive algorithm visualizations
        </p>

        {/* Main title */}
        <h1
          className="anim-fade-up anim-delay-1"
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(3rem, 8vw, 7rem)',
            fontWeight: 400,
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
            marginBottom: '2rem',
          }}
        >
          algorithms,{' '}
          <em style={{ fontStyle: 'italic', color: 'var(--syn-keyword)' }}>made</em>
          <br />
          <span style={{ position: 'relative', whiteSpace: 'nowrap' }}>
            visible
            <span
              aria-hidden
              style={{
                position: 'absolute',
                bottom: '0.1em',
                left: '-0.05em',
                right: '-0.05em',
                height: '0.35em',
                background: 'var(--glow-keyword)',
                borderRadius: '2px',
                zIndex: -1,
              }}
            />
          </span>
        </h1>

        {/* Description */}
        <p
          className="anim-fade-up anim-delay-2"
          style={{
            maxWidth: '520px',
            fontSize: '1.1rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
            marginBottom: '3rem',
          }}
        >
          Step through sorting algorithms, traverse data structures, and watch
          graph traversals unfold — one frame at a time.
        </p>

        {/* Meta stats */}
        <div
          className="anim-fade-up anim-delay-3"
          style={{
            display: 'flex',
            gap: '3rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <strong
              style={{
                display: 'block',
                fontSize: '1.5rem',
                fontFamily: 'var(--font-sans)',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '0.25rem',
              }}
            >
              {CATEGORIES.length}
            </strong>
            categories
          </div>
          <div>
            <strong
              style={{
                display: 'block',
                fontSize: '1.5rem',
                fontFamily: 'var(--font-sans)',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '0.25rem',
              }}
            >
              {TOTAL_ANIMATIONS}
            </strong>
            animations planned
          </div>
          <div>
            <strong
              style={{
                display: 'block',
                fontSize: '1.5rem',
                fontFamily: 'var(--font-sans)',
                fontWeight: 600,
                color: 'var(--syn-success)',
                marginBottom: '0.25rem',
              }}
            >
              {READY_ANIMATIONS}
            </strong>
            live now
          </div>
        </div>

        {/* Scroll hint */}
        <div
          className="anim-fade-up anim-delay-4"
          style={{
            position: 'absolute',
            bottom: '2.5rem',
            left: '2rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.65rem',
            color: 'var(--text-muted)',
            letterSpacing: '0.15em',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              width: '32px',
              height: '1px',
              background: 'var(--border)',
            }}
          />
          scroll to explore
        </div>
      </section>

      {/* ── Categories Grid ─────────────────────────────────────────── */}
      <section
        id="categories"
        style={{
          padding: '80px 2rem 120px',
          maxWidth: 'var(--max-width)',
          margin: '0 auto',
        }}
      >
        {/* Section header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '1rem',
            marginBottom: '3.5rem',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              letterSpacing: '0.1em',
            }}
          >
            01
          </span>
          <h2
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '2.25rem',
              fontWeight: 400,
              letterSpacing: '-0.01em',
              color: 'var(--text-primary)',
            }}
          >
            Explore topics
          </h2>
          <div
            style={{
              flex: 1,
              height: '1px',
              background: 'var(--border)',
              marginLeft: '0.5rem',
            }}
          />
        </div>

        {/* Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {CATEGORIES.map((category, i) => (
            <CategoryCard key={category.id} category={category} index={i} />
          ))}
        </div>
      </section>
    </>
  );
}
