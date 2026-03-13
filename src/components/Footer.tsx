export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      style={{
        padding: '3rem 2rem',
        textAlign: 'center',
        borderTop: '1px solid var(--border-subtle)',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.7rem',
        color: 'var(--text-muted)',
        letterSpacing: '0.1em',
      }}
    >
      <div
        style={{
          maxWidth: 'var(--max-width)',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <span>
          <span style={{ color: 'var(--syn-keyword)' }}>cs</span>
          <span style={{ color: 'var(--text-muted)' }}>.</span>
          visualized
        </span>

        <span style={{ color: 'var(--border)' }}>
          // interactive algorithm animations — {year}
        </span>

        <span>
          built with{' '}
          <span style={{ color: 'var(--syn-number)' }}>♥</span>
          {' '}& vanilla canvas
        </span>
      </div>
    </footer>
  );
}
