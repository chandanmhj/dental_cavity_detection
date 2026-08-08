import cv2
import numpy as np
import base64
from io import BytesIO
from PIL import Image
from typing import List, Dict, Tuple

# ------------------------------
# Helper functions (tooth/labels)
# ------------------------------
def assign_tooth_number(cx, cy, img_w, img_h):
    """Simple FDI-like assignment using horizontal segmentation and upper/lower jaw."""
    # Choose array based on jaw
    if cy < img_h * 0.45:
        teeth = [18,17,16,15,14,13,12,11, 21,22,23,24,25,26,27,28]
    else:
        teeth = [48,47,46,45,44,43,42,41, 31,32,33,34,35,36,37,38]
    col = int((cx / img_w) * 16)
    col = max(0, min(15, col))
    return int(teeth[col])

def classify_cavity_type(y1, y2, img_h):
    mid = img_h * 0.55
    if y2 < mid * 0.9:
        return "Occlusal cavity (chewing surface)"
    if mid * 0.9 <= y2 <= mid * 1.1:
        return "Proximal cavity (between teeth)"
    if y1 > mid:
        return "Root / gumline decay"
    return "Unclassified"

def severity_from_conf(conf):
    if conf >= 0.80:
        return "High — likely progressed decay"
    elif conf >= 0.55:
        return "Moderate — early cavity likely"
    else:
        return "Mild — early enamel change"

def ai_explain_note(cavity_type, severity):
    if "Proximal" in cavity_type:
        return "Dark region sits between adjacent teeth — typical of proximal decay."
    if "Occlusal" in cavity_type:
        return "Located on chewing surface — enamel pits or occlusal caries."
    if "Root" in cavity_type:
        return "Near gumline/root — may indicate root exposure or gumline decay."
    return "Region is darker than surrounding enamel; clinical exam advised."

# ------------------------------
# Image processing / detection
# ------------------------------
def preprocess_image_gray(img_bgr: np.ndarray) -> np.ndarray:
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    return clahe.apply(gray)

def classical_detect(gray: np.ndarray) -> Tuple[np.ndarray, List[Dict]]:
    h, w = gray.shape

    # 1) Find horizontal band where teeth exist using simple projection
    horiz_proj = np.sum(gray < 200, axis=1)
    if horiz_proj.max() > 0:
        h_thr = horiz_proj.max() * 0.30
        rows = np.where(horiz_proj > h_thr)[0]
        if rows.size:
            y_min = max(0, rows[0] - 30)
            y_max = min(h - 1, rows[-1] + 30)
        else:
            y_min, y_max = int(h*0.30), int(h*0.70)
    else:
        y_min, y_max = int(h*0.30), int(h*0.70)

    # 2) Vertical band too (remove large empty sides)
    vert_proj = np.sum(gray < 180, axis=0)
    if vert_proj.max() > 0:
        v_thr = vert_proj.max() * 0.25
        cols = np.where(vert_proj > v_thr)[0]
        if cols.size:
            x_min = max(0, cols[0] - 20)
            x_max = min(w - 1, cols[-1] + 20)
        else:
            x_min, x_max = int(w*0.10), int(w*0.90)
    else:
        x_min, x_max = int(w*0.10), int(w*0.90)

    # Prepare mask to limit search to tooth area
    roi_mask = np.zeros_like(gray)
    roi_mask[y_min:y_max, x_min:x_max] = 255

    # 3) Threshold inside ROI and clean
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    _, th = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    th = cv2.bitwise_and(th, roi_mask)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    clean = cv2.morphologyEx(th, cv2.MORPH_OPEN, kernel, iterations=2)

    # 4) connected components
    num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(clean, connectivity=8)
    detections = []
    mask_final = np.zeros_like(clean)

    for i in range(1, num_labels):
        x, y, ww, hh, area = stats[i]
        # ensure component lies inside tooth band
        if not (y_min <= y <= y_max and x_min <= x <= x_max):
            continue
        # filters
        if area < 50 or area > (h * w * 0.04):
            continue
        # confidence = darker region stronger
        region = gray[y:y+hh, x:x+ww]
        mean_intensity = float(np.mean(region))
        conf = min(0.99, max(0.12, (255.0 - mean_intensity) / 255.0 + (area / (h*w)) * 0.15))
        # expand small boxes a bit for visibility
        pad = 10 if (ww < 20 or hh < 20) else 4
        x1 = max(0, x - pad)
        y1 = max(0, y - pad)
        x2 = min(w - 1, x + ww + pad)
        y2 = min(h - 1, y + hh + pad)

        detections.append({
            "label": "possible_cavity",
            "confidence": round(float(conf), 3),
            "bbox": [int(x1), int(y1), int(x2), int(y2)],
            "area": int(area)
        })
        mask_final[labels == i] = 255

    return mask_final, detections

# ------------------------------
# Overlay generation (selective highlight)
# ------------------------------
def make_overlay_image(orig_bgr: np.ndarray, detections: List[Dict], max_display: int = 5) -> np.ndarray:
    overlay = orig_bgr.copy()
    h, w = overlay.shape[:2]

    if not detections:
        return overlay

    sorted_d = sorted(detections, key=lambda d: d["confidence"], reverse=True)
    selected = sorted_d[:max_display] + [d for d in sorted_d[max_display:] if d["confidence"] >= 0.80]

    for d in selected:
        x1, y1, x2, y2 = d["bbox"]
        conf = d["confidence"]

        # choose color and thickness based on severity
        if conf >= 0.80:
            color = (0, 0, 255)      # red
            thickness = 4
        elif conf >= 0.55:
            color = (0, 140, 255)    # orange-ish (BGR)
            thickness = 3
        else:
            color = (0, 255, 255)    # yellow
            thickness = 2

        # draw box
        cv2.rectangle(overlay, (x1, y1), (x2, y2), color, thickness=thickness)

        # glow/fill effect only inside selected region for clarity
        region = overlay[y1:y2, x1:x2]
        if region.size != 0:
            glow = np.zeros_like(region)
            glow[:, :, 2] = 255  # red channel for subtle warmth
            blended = cv2.addWeighted(region, 0.6, glow, 0.25, 0)
            overlay[y1:y2, x1:x2] = blended

        # label with small dark background
        label = f"{d['label']} {d['confidence']:.2f}"
        (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
        tx1, ty1 = x1, max(0, y1 - (th + 8))
        tx2, ty2 = x1 + tw + 8, ty1 + th + 6
        cv2.rectangle(overlay, (tx1, ty1), (tx2, ty2), (20,20,20), -1)
        cv2.putText(overlay, label, (tx1 + 4, ty2 - 4), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255,255,255), 1, cv2.LINE_AA)

    return overlay

# ------------------------------
# Utilities
# ------------------------------
def to_base64_png(img_bgr: np.ndarray) -> str:
    _, buf = cv2.imencode(".png", img_bgr)
    return base64.b64encode(buf).decode("ascii")

def summarize_problems(detections: List[Dict], img_w: int, img_h: int) -> List[str]:
    if not detections:
        return ["No cavity-like regions detected in the dental X-ray."]
    detections_sorted = sorted(detections, key=lambda d: d["confidence"], reverse=True)
    top5 = detections_sorted[:5]
    extras = [d for d in detections_sorted[5:] if d["confidence"] >= 0.80]
    selected = top5 + extras
    points = []
    total_pixels = img_w * img_h
    for d in selected:
        x1,y1,x2,y2 = d["bbox"]
        area = d["area"]
        conf = d["confidence"]
        cx = (x1 + x2) / 2.0
        cy = (y1 + y2) / 2.0
        tooth = assign_tooth_number(cx, cy, img_w, img_h)
        horizontal = "left" if cx < img_w * 0.33 else "center" if cx < img_w * 0.66 else "right"
        vertical = "upper" if cy < img_h * 0.5 else "lower"
        region_name = f"{vertical}-{horizontal} teeth region"
        if area > total_pixels * 0.05:
            size_desc = "a large dark shadow"
        elif area > total_pixels * 0.01:
            size_desc = "a medium-sized dark patch"
        else:
            size_desc = "a small localized dark spot"
        if conf >= 0.80:
            sev = "strong signs of cavity progression"
        elif conf >= 0.55:
            sev = "moderate signs of early cavity formation"
        else:
            sev = "possible early enamel weakening"
        points.append(f"Tooth {tooth}: In the {region_name}, {size_desc} is visible, indicating {sev} (confidence: {conf}).")
    return points

# ------------------------------
# Main analyze function (exported)
# ------------------------------
def analyze_image_from_bytes(image_bytes: bytes) -> Dict:
    nparr = np.frombuffer(image_bytes, np.uint8)
    img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img_bgr is None:
        pil = Image.open(BytesIO(image_bytes)).convert("RGB")
        img_bgr = cv2.cvtColor(np.array(pil), cv2.COLOR_RGB2BGR)

    h, w = img_bgr.shape[:2]
    gray = preprocess_image_gray(img_bgr)
    mask, detections = classical_detect(gray)

    # enrich detections with tooth/type/severity/note
    for d in detections:
        x1,y1,x2,y2 = d["bbox"]
        cx = (x1 + x2) / 2.0
        cy = (y1 + y2) / 2.0
        d["tooth"] = assign_tooth_number(cx, cy, w, h)
        d["cavity_type"] = classify_cavity_type(y1, y2, h)
        d["severity"] = severity_from_conf(d["confidence"])
        d["ai_note"] = ai_explain_note(d["cavity_type"], d["severity"])

    # overlay highlight only selected detections
    overlay = make_overlay_image(img_bgr, detections, max_display=5)
    mask_b64 = to_base64_png(overlay)

    cnt = len(detections)
    if cnt == 0:
        summary = "No clear cavity-like regions detected."
    elif cnt <= 3:
        summary = f"{cnt} cavity-like regions detected — early decay suspected."
    else:
        summary = f"Multiple ({cnt}) suspicious regions detected — dental evaluation recommended."

    problem_points = summarize_problems(detections, w, h)

    # detection breakdown (only for the selected top detections)
    sorted_d = sorted(detections, key=lambda d: d["confidence"], reverse=True)
    selected = sorted_d[:5] + [d for d in sorted_d[5:] if d["confidence"] >= 0.80]
    detection_breakdown = []
    for d in selected:
        detection_breakdown.append({
            "tooth": d["tooth"],
            "cavity_type": d["cavity_type"],
            "severity": d["severity"],
            "confidence": d["confidence"],
            "ai_note": d["ai_note"],
            "bbox": d["bbox"],
            "area": d.get("area", None)
        })

    return {
        "image_width": w,
        "image_height": h,
        "detections": detections,
        "problem_points": problem_points,
        "detection_breakdown": detection_breakdown,
        "mask_base64": mask_b64,
        "summary": summary,
        "notes": "This AI output is from classical image processing and not a clinical diagnosis."
    }
