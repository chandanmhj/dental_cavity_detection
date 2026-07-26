import React from 'react';
import Upload from './components/Upload';

export default function App(){
  return (
    <div className="container">
      <h1>Dental Cavity Detection — Demo</h1>
      <p>Upload a dental X-ray image (JPEG/PNG). The app highlights suspicious regions using classical image processing.</p>
      <Upload />
    </div>
  )
}
