from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from .model import analyze_image_from_bytes
from .schemas import PredictionResponse
import uvicorn
import base64
import os
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from datetime import datetime
from io import BytesIO
from reportlab.lib.utils import ImageReader

app = FastAPI(title="Dental Cavity Detection (Classical)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/predict", response_model=PredictionResponse)
async def predict(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Upload an image file.")
    contents = await file.read()
    try:
        result = analyze_image_from_bytes(contents)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return result

# PDF endpoint: accepts same image, returns a report PDF including breakdown
@app.post("/download-pdf")
async def download_pdf(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Upload an image file.")
    contents = await file.read()
    try:
        result = analyze_image_from_bytes(contents)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    overlay_b64 = result.get("mask_base64")
    if not overlay_b64:
        raise HTTPException(status_code=500, detail="No overlay image to create PDF.")
    image_bytes = base64.b64decode(overlay_b64)

    # create PDF in memory
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    margin = 40

    c.setFont("Helvetica-Bold", 18)
    c.drawString(margin, height - 50, "Dental Cavity Analysis Report")
    c.setFont("Helvetica", 10)
    c.drawString(margin, height - 70, f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    # place image
    try:
        reader = ImageReader(BytesIO(image_bytes))
        c.drawImage(reader, margin, height - 350, width=400, preserveAspectRatio=True, mask='auto')
    except Exception:
        # fallback: skip image if fails
        pass

    # summary
    c.setFont("Helvetica-Bold", 14)
    c.drawString(margin, height - 370 - 20, "Summary")
    text = c.beginText(margin, height - 390 - 20)
    text.setFont("Helvetica", 11)
    text.textLines(result.get("summary", ""))
    c.drawText(text)

    # problem points
    c.setFont("Helvetica-Bold", 14)
    y_pos = height - 460 - 20
    c.drawString(margin, y_pos, "Detected Problems")
    text = c.beginText(margin, y_pos - 20)
    text.setFont("Helvetica", 11)
    for p in result.get("problem_points", []):
        text.textLine(f"• {p}")
    c.drawText(text)

    # detection breakdown
    y_pos = y_pos - 140
    c.setFont("Helvetica-Bold", 14)
    c.drawString(margin, y_pos, "Detection Breakdown")
    text = c.beginText(margin, y_pos - 20)
    text.setFont("Helvetica", 11)
    for d in result.get("detection_breakdown", []):
        text.textLine(f"Tooth: {d.get('tooth')}  |  Type: {d.get('cavity_type')}")
        text.textLine(f"Severity: {d.get('severity')}  |  Confidence: {d.get('confidence')}")
        ai_note = d.get('ai_note', '')
        if ai_note:
            text.textLine(f"AI Note: {ai_note}")
        text.textLine("")  # blank line
    c.drawText(text)

    c.showPage()
    c.save()
    buffer.seek(0)

    pdf_name = "dental_report.pdf"
    # save temp file
    with open(pdf_name, "wb") as f:
        f.write(buffer.read())

    return FileResponse(pdf_name, filename=pdf_name, media_type="application/pdf")

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
