import React, { useState } from "react";
import axios from "axios";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFile = (e) => {
    setFile(e.target.files[0]);
    setResult(null);
  };

  const handleUpload = async () => {
    if (!file) return alert("Select an image first");
    setLoading(true);

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await axios.post("http://127.0.0.1:8000/predict", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(res.data);
    } catch (err) {
      alert("Error: " + (err?.response?.data?.detail || err.message));
    }

    setLoading(false);
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.headerIcon}>🦷</div>
          <h1 style={styles.headerTitle}>Dental Cavity Detection</h1>
          <p style={styles.headerSubtitle}>
            Upload a dental X-ray to analyze for possible cavities or decay regions with AI-powered detection
          </p>
        </div>
      </div>

      {/* Upload Card */}
      <div style={styles.uploadCard}>
        <div style={styles.uploadContent}>
          <div style={styles.uploadArea}>
            <label 
              htmlFor="file-upload" 
              style={styles.fileUploadLabel}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-5px)';
                e.target.style.boxShadow = '0 10px 25px rgba(74, 144, 226, 0.3)';
                e.target.style.borderColor = '#66b3ff';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
                e.target.style.borderColor = '#4a90e2';
              }}
            >
              <div style={styles.uploadIcon}>📁</div>
              <h3 style={styles.uploadTitle}>Choose Dental X-ray</h3>
              <p style={styles.uploadSubtitle}>PNG, JPG, JPEG files accepted</p>
              <div style={styles.uploadButton}>Select File</div>
            </label>
            <input
              id="file-upload"
              type="file"
              accept="image/*"
              onChange={handleFile}
              style={{ display: "none" }}
            />

            {file && (
              <div style={styles.selectedFile}>
                <span style={styles.selectedText}>✅ Selected: {file.name}</span>
              </div>
            )}
          </div>

          <button
            onClick={handleUpload}
            disabled={loading || !file}
            style={{
              ...styles.analyzeButton,
              background:
                loading || !file
                  ? "#333"
                  : "linear-gradient(135deg, #4a90e2 0%, #357abd 100%)",
            }}
            onMouseEnter={(e) => {
              if (!loading && file) {
                e.target.style.transform = 'translateY(-3px)';
                e.target.style.boxShadow = '0 15px 30px rgba(74, 144, 226, 0.6)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading && file) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 10px 25px rgba(74, 144, 226, 0.4)';
              }
            }}
          >
            {loading ? (
              <>
                <div style={styles.spinner} />
                Analyzing X-ray...
              </>
            ) : (
              "🔍 Upload & Analyze"
            )}
          </button>
        </div>
      </div>

      {/* Results Section */}
      {result && (
        <div style={styles.resultsContainer}>
          <div style={styles.imageSection}>
            <h3 style={styles.sectionTitle}>Detection Results</h3>

            <div style={styles.imageComparison}>
              {/* Original X-ray */}
              <div style={styles.originalImageContainer}>
                <h4 style={styles.imageLabel}>Original X-ray</h4>
                <img
                  src={URL.createObjectURL(file)}
                  alt="Original"
                  style={styles.originalImage}
                />
              </div>

              {/* Overlay Image (FIXED) */}
              <div style={styles.overlayImageContainer}>
                <h4 style={styles.imageLabel}>Detection Overlay</h4>

                <div style={styles.overlayWrapper}>
                  <img
                    src={`data:image/png;base64,${result.mask_base64}`}
                    alt="Detection Overlay"
                    style={styles.overlayImageOnly}
                  />
                  <div style={styles.detectedBadge}>🔴 Detected Areas</div>
                </div>
              </div>
            </div>
          </div>

          {/* Analysis Report */}
          <div style={styles.reportSection}>
            <h3 style={styles.sectionTitle}>Dental Analysis Report</h3>

            <div style={styles.reportCard}>
              {/* Image Details */}
              <div style={styles.reportSectionItem}>
                <div style={styles.sectionHeader}>
                  <span style={styles.sectionIcon}>📊</span>
                  <h4 style={styles.sectionTitle}>Image Details</h4>
                </div>
                <div style={styles.sectionContent}>
                  <p style={styles.detailText}>
                    {result.image_width} × {result.image_height} pixels
                  </p>
                </div>
              </div>

              {/* Detected Problems */}
              <div style={styles.reportSectionItem}>
                <div style={styles.sectionHeader}>
                  <span style={styles.sectionIcon}>🦷</span>
                  <h4 style={styles.sectionTitle}>Detected Problems</h4>
                </div>
                <div style={styles.sectionContent}>
                  <ul style={styles.problemsList}>
                    {result.problem_points?.map((p, i) => (
                      <li key={i} style={styles.problemItem}>{p}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Breakdown */}
              {result.detection_breakdown?.length > 0 && (
                <div style={styles.reportSectionItem}>
                  <div style={styles.sectionHeader}>
                    <span style={styles.sectionIcon}>📌</span>
                    <h4 style={styles.sectionTitle}>Detection Breakdown</h4>
                  </div>

                  <div style={styles.sectionContent}>
                    {result.detection_breakdown.map((d, i) => (
                      <div key={i} style={styles.breakdownItem}>
                        <div style={styles.breakdownRow}>
                          <span style={styles.breakdownLabel}>Tooth:</span>
                          <span style={styles.breakdownValue}>{d.tooth}</span>
                        </div>
                        <div style={styles.breakdownRow}>
                          <span style={styles.breakdownLabel}>Type:</span>
                          <span style={styles.breakdownValue}>{d.cavity_type}</span>
                        </div>
                        <div style={styles.breakdownRow}>
                          <span style={styles.breakdownLabel}>Severity:</span>
                          <span style={styles.breakdownValue}>{d.severity}</span>
                        </div>
                        <div style={styles.breakdownRow}>
                          <span style={styles.breakdownLabel}>Confidence:</span>
                          <span style={styles.breakdownValue}>{d.confidence}</span>
                        </div>
                        {i < result.detection_breakdown.length - 1 && (
                          <div style={styles.separator} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PDF Button */}
              <button
                onClick={async () => {
                  if (!file) return alert("Upload first to generate PDF");
                  const f = new FormData();
                  f.append("file", file);

                  try {
                    const resp = await axios.post(
                      "http://127.0.0.1:8000/download-pdf",
                      f,
                      { responseType: "blob" }
                    );
                    const url = window.URL.createObjectURL(
                      new Blob([resp.data], { type: "application/pdf" })
                    );
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "dental_report.pdf";
                    a.click();
                    window.URL.revokeObjectURL(url);
                  } catch (err) {
                    alert("PDF generation failed");
                  }
                }}
                style={styles.pdfButton}
              >
                📄 Download PDF Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------- FIXED + EXISTING STYLES ------------------- */
const styles = {
  page: { 
    background: "#000", 
    minHeight: "100vh", 
    padding: "2rem 1rem", 
    color: "#fff", 
    fontFamily: "'Poppins', sans-serif" 
  },

  header: { 
    textAlign: "center", 
    marginBottom: "3rem" 
  },
  headerContent: { 
    maxWidth: "800px", 
    margin: "0 auto" 
  },
  headerIcon: { 
    fontSize: "4rem", 
    marginBottom: "1rem",
    filter: "drop-shadow(0 4px 8px rgba(255,255,255,0.1))",
  },
  headerTitle: { 
    fontSize: "2.5rem", 
    fontWeight: "700",
    background: "linear-gradient(45deg, #fff, #a0e7ff)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    textShadow: "0 2px 4px rgba(0,0,0,0.3)",
    marginBottom: "1rem",
  },
  headerSubtitle: { 
    fontSize: "1.2rem", 
    opacity: 0.8,
    lineHeight: "1.6",
    color: "#e0e0e0",
  },

  uploadCard: {
    background: "#1a1a1a",
    borderRadius: "20px",
    padding: "3rem 2rem",
    maxWidth: "600px",
    margin: "0 auto 2rem auto",
    boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
    border: "1px solid #333",
  },

  uploadContent: { 
    display: "flex", 
    flexDirection: "column", 
    alignItems: "center", 
    gap: "2rem" 
  },

  uploadArea: { 
    width: "100%", 
    textAlign: "center" 
  },

  fileUploadLabel: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "3rem 2rem",
    border: "3px dashed #4a90e2",
    borderRadius: "15px",
    cursor: "pointer",
    background: "#0a0a0a",
    transition: "all 0.3s ease",
  },

  uploadIcon: { 
    fontSize: "3rem", 
    marginBottom: "1rem", 
    color: "#4a90e2",
    filter: "drop-shadow(0 0 10px rgba(74, 144, 226, 0.5))",
  },

  uploadTitle: { 
    color: "#fff", 
    marginBottom: "0.5rem", 
    fontWeight: "600", 
    fontSize: "1.3rem" 
  },

  uploadSubtitle: { 
    color: "#b0b0b0", 
    marginBottom: "1.5rem" 
  },

  uploadButton: {
    padding: "12px 24px",
    background: "linear-gradient(135deg, #4a90e2 0%, #357abd 100%)",
    color: "white",
    borderRadius: "25px",
    fontWeight: "600",
    fontSize: "0.9rem",
    boxShadow: "0 4px 15px rgba(74, 144, 226, 0.3)",
    transition: "all 0.3s ease",
  },

  selectedFile: {
    marginTop: "1rem",
    padding: "1rem",
    background: "rgba(76, 175, 80, 0.2)",
    borderRadius: "10px",
    border: "2px solid #4caf50",
  },

  selectedText: { 
    fontWeight: "600", 
    color: "#4caf50" 
  },

  analyzeButton: {
    padding: "16px 40px",
    color: "white",
    border: "none",
    borderRadius: "50px",
    fontSize: "1.1rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 10px 25px rgba(74, 144, 226, 0.4)",
    position: "relative",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  spinner: {
    width: "20px",
    height: "20px",
    border: "3px solid rgba(255,255,255,0.3)",
    borderTop: "3px solid white",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },

  resultsContainer: {
    background: "#1a1a1a",
    borderRadius: "20px",
    padding: "3rem",
    maxWidth: "1000px",
    margin: "0 auto",
    boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
    border: "1px solid #333",
  },

  imageSection: { 
    marginBottom: "3rem" 
  },

  sectionTitle: {
    color: "#fff",
    marginBottom: "2rem",
    fontSize: "1.8rem",
    textAlign: "center",
    fontWeight: "600",
  },

  imageComparison: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "2rem",
    alignItems: "start",
  },

  originalImageContainer: { 
    textAlign: "center" 
  },
  overlayImageContainer: { 
    textAlign: "center" 
  },

  imageLabel: { 
    color: "#fff", 
    marginBottom: "1rem", 
    fontWeight: "600",
    fontSize: "1.2rem",
  },

  originalImage: {
    width: "100%",
    maxWidth: "400px",
    borderRadius: "12px",
    border: "2px solid #333",
    boxShadow: "0 10px 25px rgba(0,0,0,0.4)",
  },

  /* FIXED — overlay image only (with red boxes visible) */
  overlayImageOnly: {
    width: "100%",
    maxWidth: "400px",
    borderRadius: "12px",
    display: "block",
    boxShadow: "0 10px 25px rgba(0,0,0,0.4)",
  },

  overlayWrapper: {
    position: "relative",
    display: "inline-block",
    borderRadius: "12px",
    overflow: "hidden",
    border: "2px solid #333",
  },

  detectedBadge: {
    position: "absolute",
    bottom: "10px",
    left: "10px",
    background: "rgba(255,0,0,0.8)",
    color: "white",
    padding: "5px 10px",
    borderRadius: "20px",
    fontSize: "0.8rem",
    fontWeight: "600",
  },

  reportSection: { 
    width: "100%" 
  },

  reportCard: {
    background: "#2d2d2d",
    padding: "2rem",
    borderRadius: "15px",
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
    boxShadow: "0 10px 25px rgba(0,0,0,0.4)",
    border: "1px solid #444",
  },

  reportSectionItem: {
    background: "#333",
    padding: "1.5rem",
    borderRadius: "10px",
    border: "1px solid #444",
  },

  sectionHeader: { 
    display: "flex", 
    alignItems: "center", 
    gap: "0.5rem", 
    marginBottom: "1rem" 
  },

  sectionIcon: { 
    fontSize: "1.2rem" 
  },

  sectionContent: { 
    color: "#cbd5e0" 
  },

  detailText: { 
    margin: 0,
    fontSize: "0.95rem",
  },

  problemsList: { 
    paddingLeft: "20px", 
    margin: 0 
  },

  problemItem: { 
    marginBottom: "10px",
    fontSize: "0.9rem",
    lineHeight: "1.4",
  },

  breakdownItem: { 
    marginBottom: "14px", 
    paddingBottom: "10px" 
  },

  breakdownRow: { 
    display: "flex", 
    justifyContent: "space-between", 
    marginBottom: "5px" 
  },

  breakdownLabel: { 
    fontWeight: "600", 
    color: "#e2e8f0",
    fontSize: "0.9rem",
  },

  breakdownValue: { 
    color: "#cbd5e0",
    fontSize: "0.9rem",
  },

  separator: { 
    height: "1px", 
    background: "rgba(255,255,255,0.1)", 
    marginTop: "10px" 
  },

  pdfButton: {
    padding: "12px 20px",
    background: "linear-gradient(135deg, #0b84ff 0%, #0066cc 100%)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "1rem",
    fontSize: "1rem",
    boxShadow: "0 4px 15px rgba(11, 132, 255, 0.3)",
    transition: "all 0.3s ease",
  },
};

/* Global styles */
const globalStyles = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  body {
    background: #000000;
    margin: 0;
    padding: 0;
  }
`;

if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = globalStyles;
  document.head.appendChild(styleSheet);
}

export { Upload };