# backend/app/utils.py
from io import BytesIO
from PIL import Image
import base64

def bytes_to_pil(b: bytes):
    return Image.open(BytesIO(b))

def pil_to_base64(im, fmt="PNG"):
    buf = BytesIO()
    im.save(buf, format=fmt)
    return base64.b64encode(buf.getvalue()).decode("ascii")
