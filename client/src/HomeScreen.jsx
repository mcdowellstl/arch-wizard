const CATEGORY_GRADIENTS = {
  printer: 'linear-gradient(135deg, rgba(249,115,22,0.18) 0%, rgba(249,115,22,0.04) 100%)',
  pos:     'linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(99,102,241,0.04) 100%)',
  kds:     'linear-gradient(135deg, rgba(20,184,166,0.18) 0%, rgba(20,184,166,0.04) 100%)',
  kiosk:   'linear-gradient(135deg, rgba(236,72,153,0.18) 0%, rgba(236,72,153,0.04) 100%)',
  other:   'linear-gradient(135deg, rgba(148,163,184,0.18) 0%, rgba(148,163,184,0.04) 100%)',
}

const CATEGORY_BORDERS = {
  printer: 'rgba(249,115,22,0.30)',
  pos:     'rgba(99,102,241,0.30)',
  kds:     'rgba(20,184,166,0.30)',
  kiosk:   'rgba(236,72,153,0.30)',
  other:   'rgba(148,163,184,0.20)',
}

export function HomeScreen({ categories, onSelect }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div
        style={{
          padding: '28px 20px 18px',
          background: 'var(--color-surface-1)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--color-accent)',
            marginBottom: 6,
          }}
        >
          Restaurant Support
        </p>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--color-text-primary)', lineHeight: 1.2, margin: 0 }}>
          What needs<br />attention?
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginTop: 8 }}>
          Select a device to begin the diagnostic.
        </p>
      </div>

      {/* Category Grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 14,
          }}
        >
          {categories.map((cat, i) => (
            <button
              key={cat.id}
              id={`cat-${cat.id}`}
              onClick={() => onSelect(cat.id)}
              style={{
                background: CATEGORY_GRADIENTS[cat.id],
                border: `1.5px solid ${CATEGORY_BORDERS[cat.id]}`,
                borderRadius: 18,
                padding: '22px 16px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                // "Other" spans full width
                gridColumn: i === categories.length - 1 && categories.length % 2 !== 0 ? '1 / -1' : undefined,
                animation: `slideUp 0.35s cubic-bezier(0.16,1,0.3,1) ${i * 60}ms both`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.03)'
                e.currentTarget.style.boxShadow = `0 8px 30px ${CATEGORY_BORDERS[cat.id]}`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <span style={{ fontSize: 42, lineHeight: 1 }}>{cat.icon}</span>
              <div>
                <span
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: 'var(--color-text-primary)',
                    display: 'block',
                    marginBottom: 2,
                  }}
                >
                  {cat.label}
                </span>
                <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 500 }}>
                  Tap to diagnose →
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Footer hint */}
        <div
          style={{
            marginTop: 28,
            padding: '14px 16px',
            borderRadius: 12,
            background: 'var(--color-surface-2)',
            border: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span style={{ fontSize: 22 }}>💡</span>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13, lineHeight: 1.5, margin: 0 }}>
            Most issues resolve in under 2 minutes. Follow the steps — a ticket is only created if needed.
          </p>
        </div>
      </div>
    </div>
  )
}
