import React from 'react';

export default function About(){
  return (
    <div className="about-page">
      <div className="glass-card about-card">
        <h2>About this project</h2>
        <p>This demo performs classical image-processing based cavity detection on dental X-rays and generates a PDF report.</p>

        <h4>Credits</h4>
        <p>This project was built by Chandan and Sakshi.</p>

        <h4>How it works</h4>
        <ol>
          <li>Upload an X-ray image.</li>
          <li>Server analyzes the image and returns overlay and breakdown.</li>
          <li>Download a PDF report with the results.</li>
        </ol>
      </div>
    </div>
  )
}
