import React from 'react';
import cavity1 from '../assets/images/cavity1.svg';
import cavity2 from '../assets/images/cavity2.svg';

const techs = [
  'Python', 'FastAPI', 'Uvicorn', 'OpenCV', 'Pillow', 'NumPy', 'ReportLab', 'FPDF',
  'React', 'Vite', 'Axios'
];

export default function Landing({ onTry }){
  return (
    <div className="landing">
      <div className="glass-card hero">
        <div className="hero-grid">
          <div>
            <h1 className="hero-title">Dental Cavity Detection</h1>
            <p className="hero-sub">Upload dental X-rays to detect suspicious regions and download a PDF report.</p>
            <div className="hero-cta">
              <button onClick={onTry} className="primary">Test Now</button>
            </div>
          </div>
          <div className="hero-images">
            <img src={cavity1} alt="tooth illustration" />
            <img src={cavity2} alt="tooth illustration 2" />
          </div>
        </div>
      </div>

      <div className="glass-card intro">
        <h3>Project introduction</h3>
        <p>
          Dental cavities (caries) remain one of the most common chronic conditions worldwide. Left untreated,
          cavities can cause severe pain, infection, tooth loss and can affect nutrition, speech and quality of life.
          Early detection is essential to prevent progression and reduce the need for invasive treatment.
        </p>
        <p>
          This project demonstrates a lightweight screening workflow: clinicians, screening programs, and
          tele-dentistry services can use it to quickly identify suspicious regions on X-rays and generate
          standardized PDF reports for follow-up.
        </p>
      </div>

      <div className="glass-card stack">
        <h3>Tech stack</h3>
        <ul className="tech-list">
          {techs.map(t => <li key={t}>{t}</li>)}
        </ul>
      </div>

      
    </div>
  )
}
