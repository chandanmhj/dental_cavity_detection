import React, { useState } from 'react';
import Upload from './components/Upload';
import Landing from './components/Landing';
import About from './components/About';

export default function App(){
  const [page, setPage] = useState('home');

  return (
    <div className="app-root">
      <header className="nav">
        <div className="brand">Dental Cavity Detection</div>
        <nav className="nav-links">
          <button onClick={() => setPage('home')}>Home</button>
          <button onClick={() => setPage('demo')}>Test Now</button>
          <button onClick={() => setPage('about')}>About</button>
        </nav>
      </header>

      <main className="main-area">
        {page === 'home' && <Landing onTry={() => setPage('demo')} />}
        {page === 'demo' && <div className="glass-card demo-area"><Upload /></div>}
        {page === 'about' && <About />}
      </main>

      <footer className="footer">© {new Date().getFullYear()} — Built by Chandan & Sakshi</footer>
    </div>
  )
}
