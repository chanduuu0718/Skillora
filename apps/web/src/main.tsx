import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

function App() {
  return (
    <main className="app-shell">
      <nav className="topbar">
        <a className="brand" href="/" aria-label="Skillora home">
          <span className="brand-mark">S</span>
          <span>Skillora</span>
        </a>
        <div className="nav-links" aria-label="Primary navigation">
          <a href="#products">Products</a>
          <a href="#how-it-works">How it works</a>
          <a href="#about">About</a>
        </div>
        <div className="nav-actions">
          <button className="ghost-button" type="button">Log in</button>
          <button className="primary-button" type="button">Create account</button>
        </div>
      </nav>

      <section className="hero" id="about">
        <div className="hero-glow hero-glow-one" />
        <div className="hero-glow hero-glow-two" />
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> Premium digital resources</div>
          <h1>Learn faster. Prepare smarter. <span>Grow further.</span></h1>
          <p>
            Skillora brings practical guides, templates and learning resources into one beautiful place —
            built for real progress, not information overload.
          </p>
          <div className="hero-actions">
            <button className="primary-button large" type="button">Explore products <span>→</span></button>
            <button className="secondary-button large" type="button">See how it works</button>
          </div>
          <div className="trust-row" aria-label="Platform benefits">
            <span>Instant access</span><span>Secure checkout</span><span>Buy once, keep access</span>
          </div>
        </div>
        <div className="hero-card" aria-label="Featured product preview">
          <div className="hero-card-top"><span>FEATURED RESOURCE</span><span>01</span></div>
          <div className="product-orbit"><div className="orbit-core">SK</div></div>
          <h2>Interview Accelerator</h2>
          <p>A focused toolkit for sharper preparation, better answers and more confidence.</p>
          <div className="price-row"><strong>₹199</strong><span>Instant download</span></div>
          <button className="card-button" type="button">Preview resource <span>↗</span></button>
        </div>
      </section>

      <section className="section" id="products">
        <div className="section-heading"><div><div className="section-kicker">CURATED FOR PROGRESS</div><h2>Useful resources, thoughtfully packaged.</h2></div><button className="text-button" type="button">View all <span>→</span></button></div>
        <div className="product-grid">
          {[
            ['Interview Accelerator', 'Career', '₹199'],
            ['Resume Launch Kit', 'Career', '₹149'],
            ['30-Day Study Planner', 'Planning', '₹99'],
          ].map(([title, category, price], index) => (
            <article className="product-card" key={title}>
              <div className={`product-art art-${index + 1}`}><span>{String(index + 1).padStart(2, '0')}</span></div>
              <div className="product-meta"><span>{category}</span><span>{price}</span></div>
              <h3>{title}</h3>
              <p>{index === 0 ? 'A compact preparation system for interviews and job applications.' : index === 1 ? 'Clean templates and prompts to build a stronger, clearer resume.' : 'A practical daily system to turn study plans into consistent progress.'}</p>
              <button className="card-link" type="button">View resource <span>→</span></button>
            </article>
          ))}
        </div>
      </section>

      <section className="how-section" id="how-it-works">
        <div className="section-kicker">HOW SKILLORA WORKS</div>
        <h2>Simple for customers. Powerful behind the scenes.</h2>
        <div className="steps">
          {[
            ['01', 'Discover', 'Find a resource built around a real goal or problem.'],
            ['02', 'Checkout', 'Pay securely through our payment flow in a few clicks.'],
            ['03', 'Access', 'Your purchase is automatically added to your account.'],
          ].map(([number, title, body]) => (
            <div className="step" key={number}><span>{number}</span><h3>{title}</h3><p>{body}</p></div>
          ))}
        </div>
      </section>

      <footer className="footer"><div className="brand"><span className="brand-mark">S</span><span>Skillora</span></div><p>Learn. Prepare. Grow.</p></footer>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
