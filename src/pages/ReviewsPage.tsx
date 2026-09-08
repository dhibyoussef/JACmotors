import { useMemo, useState } from 'react'
import { reviews } from '../data/content'

type Filter = 'all' | 'high' | 'low' | 'recent'

export function ReviewsPage() {
  const [filter, setFilter] = useState<Filter>('all')

  const avg =
    reviews.reduce((sum, r) => sum + r.rating, 0) / Math.max(reviews.length, 1)

  const list = useMemo(() => {
    let items = [...reviews]
    if (filter === 'high') items = items.filter((r) => r.rating >= 4)
    if (filter === 'low') items = items.filter((r) => r.rating <= 2)
    if (filter === 'recent') {
      // already roughly ordered; keep as-is with newest-looking first few
      items = [...items].reverse()
    }
    return items
  }, [filter])

  return (
    <>
      <header className="page-hero">
        <p className="section__eyebrow" style={{ color: '#ff6b73' }}>
          Google Reviews
        </p>
        <h1>Avis clients</h1>
        <p>
          Retours réels des showrooms JAC en Tunisie — transparence pour mieux
          servir.
        </p>
      </header>

      <section className="section">
        <div className="rating-summary">
          <div className="rating-summary__score">{avg.toFixed(1)}</div>
          <div>
            <div className="stars">{'★'.repeat(Math.round(avg))}{'☆'.repeat(5 - Math.round(avg))}</div>
            <p style={{ color: 'var(--steel)', marginTop: '0.35rem' }}>
              Moyenne sur {reviews.length} avis affichés (sources Google)
            </p>
          </div>
        </div>

        <div className="review-filters">
          {(
            [
              ['all', 'Les plus pertinents'],
              ['recent', 'Les plus récents'],
              ['high', 'Les meilleurs'],
              ['low', 'Les moins bons'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`chip-filter ${filter === key ? 'active' : ''}`}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="review-list">
          {list.map((r) => (
            <article className="review-item" key={r.id}>
              <div className="review-item__head">
                <div>
                  <strong>{r.author}</strong>
                  <div className="meta">
                    {r.location} · {r.date}
                    {r.likes ? ` · ♥ ${r.likes}` : ''}
                  </div>
                </div>
                <div className="stars">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
              </div>
              <p>{r.text}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}
