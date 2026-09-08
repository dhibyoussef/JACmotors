import { Link } from 'react-router-dom'

export function PrivacyPage() {
  return (
    <>
      <header className="page-hero">
        <p className="section__eyebrow" style={{ color: '#ff6b73' }}>
          Protection des données
        </p>
        <h1>Confidentialité</h1>
        <p>
          Transparence sur ce que fait ce site Tunisie — réservation d’entretien
          sans compte.
        </p>
      </header>

      <section className="section prose">
        <h2>Qui est responsable</h2>
        <p>
          Ce site est une vitrine locale JAC Motors Tunisie (showrooms listés).
          Il n’est pas le site corporate mondial{' '}
          <a href="https://jacen.jac.com.cn/" target="_blank" rel="noopener noreferrer">
            jacen.jac.com.cn
          </a>
          .
        </p>

        <h2>Données collectées</h2>
        <p>
          Lors d’une réservation, vous saisissez : matricule, nom, email,
          téléphone, modèle, showroom, type d’entretien, date et heure.
        </p>

        <h2>Où sont stockées les données</h2>
        <p>
          Les tickets sont enregistrés <strong>uniquement dans votre navigateur</strong>{' '}
          (localStorage), sur votre appareil. Aucun compte n’est créé. Aucun
          serveur d’hébergement de formulaires n’est utilisé dans cette version.
        </p>

        <h2>Finalité</h2>
        <p>
          Générer un ticket d’entretien à présenter / imprimer, et éviter le
          double-booking des créneaux sur le même appareil.
        </p>

        <h2>Mesures de sécurité</h2>
        <ul>
          <li>Validation et assainissement des champs (XSS)</li>
          <li>Champ piège anti-bot</li>
          <li>Limitation du nombre de soumissions par heure</li>
          <li>Sceau d’intégrité (empreinte) sur chaque ticket</li>
          <li>Liens externes en <code>rel=&quot;noopener noreferrer&quot;</code></li>
        </ul>

        <h2>Vos droits</h2>
        <p>
          Vous pouvez effacer les données du site via les paramètres de votre
          navigateur (données de site / localStorage) pour ce domaine. Pour une
          demande liée à un showroom, contactez directement le numéro affiché.
        </p>

        <h2>Contact showrooms</h2>
        <ul>
          <li>Immeuble Etraton · 50 512 877</li>
          <li>CLH Motors Tunis · 79 731 328</li>
          <li>Ben Arous · 58 554 765</li>
          <li>ZI El Mghira · 29 402 200</li>
        </ul>

        <p style={{ marginTop: '2rem' }}>
          <Link className="btn btn--primary" to="/reserver">
            Retour à la réservation
          </Link>
        </p>
      </section>
    </>
  )
}
