import { useState, useEffect } from 'react'
import './index.css'
import { HomeScreen } from './HomeScreen'
import { JourneyPlayer } from './JourneyPlayer'

// Inline the graph for offline-first behavior; also fetched from API on load
import localGraph from '../../diagnostic-graph.json'

// ─── Simulated authenticated user session ────────────────────────────────────
// In production this would come from your auth provider / SSO token.
const MOCK_USER = {
  name:    'Jim Halpert',
  phone:   '(570) 555-0142',
  address: '1725 Slough Avenue, Scranton, PA 18503',
  store:   '12345',
}

export default function App() {
  const [graph, setGraph] = useState(localGraph)
  const [selectedCategory, setSelectedCategory] = useState(null)

  // Hydrate from server (progressive enhancement — not blocking)
  useEffect(() => {
    fetch('/api/diagnostic-graph')
      .then((r) => r.json())
      .then((data) => setGraph(data))
      .catch(() => {/* stay with local graph */})
  }, [])

  return (
    <div
      style={{
        maxWidth: 375,
        margin: '0 auto',
        height: '100vh',
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--color-surface-0)',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 0 80px rgba(0,0,0,0.6)',
      }}
    >
      {selectedCategory ? (
        <JourneyPlayer
          key={selectedCategory}
          graph={graph}
          categoryId={selectedCategory}
          currentUser={MOCK_USER}
          onReset={() => setSelectedCategory(null)}
        />
      ) : (
        <HomeScreen
          categories={graph.categories}
          onSelect={(id) => setSelectedCategory(id)}
        />
      )}
    </div>
  )
}
