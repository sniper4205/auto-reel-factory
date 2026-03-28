import sys
import os
from pathlib import Path
import urllib.request

import cv2
from insightface.app import FaceAnalysis
from insightface.model_zoo import get_model

# -----------------------------
# INPUTS
# -----------------------------
source_path = sys.argv[1]   # character image
target_path = sys.argv[2]   # generated scene image
output_path = sys.argv[3]   # final image

# -----------------------------
# HELPERS
# -----------------------------
def ensure_parent_dir(file_path: str):
    Path(file_path).parent.mkdir(parents=True, exist_ok=True)

def ensure_inswapper_model() -> str:
    """
    Make sure inswapper_128.onnx exists locally and return its absolute path.
    """
    models_dir = Path.home() / ".insightface" / "models"
    models_dir.mkdir(parents=True, exist_ok=True)

    model_path = models_dir / "inswapper_128.onnx"

    if model_path.exists() and model_path.stat().st_size > 10_000_000:
        print(f"Using local swapper model: {model_path}")
        return str(model_path)

    url = "https://github.com/deepinsight/insightface/releases/download/v0.7/inswapper_128.onnx"
    print(f"Downloading face swap model to: {model_path}")
    urllib.request.urlretrieve(url, model_path)

    if not model_path.exists() or model_path.stat().st_size < 10_000_000:
        raise RuntimeError("Failed to download a valid inswapper_128.onnx model")

    print(f"Downloaded swapper model: {model_path}")
    return str(model_path)

# -----------------------------
# PREP PATHS
# -----------------------------
source_path = os.path.abspath(source_path)
target_path = os.path.abspath(target_path)
output_path = os.path.abspath(output_path)

ensure_parent_dir(output_path)

# -----------------------------
# LOAD IMAGES
# -----------------------------
source_img = cv2.imread(source_path)
target_img = cv2.imread(target_path)

if source_img is None:
    raise RuntimeError(f"Could not read source image: {source_path}")

if target_img is None:
    raise RuntimeError(f"Could not read target image: {target_path}")

# -----------------------------
# LOAD FACE ANALYSIS
# -----------------------------
providers = ["CPUExecutionProvider"]

print("Loading FaceAnalysis...")
app = FaceAnalysis(name="buffalo_l", providers=providers)
app.prepare(ctx_id=0, det_size=(640, 640))

# -----------------------------
# LOAD SWAPPER MODEL
# -----------------------------
swapper_model_path = ensure_inswapper_model()

print("Loading face swapper model...")
swapper = get_model(swapper_model_path, providers=providers)

# -----------------------------
# DETECT FACES
# -----------------------------
print("Detecting faces...")
source_faces = app.get(source_img)
target_faces = app.get(target_img)

if len(source_faces) == 0:
    print("No face found in source image. Saving original target.")
    cv2.imwrite(output_path, target_img)
    sys.exit(0)

if len(target_faces) == 0:
    print("No face found in target image. Saving original target.")
    cv2.imwrite(output_path, target_img)
    sys.exit(0)

source_face = source_faces[0]

# -----------------------------
# SWAP
# -----------------------------
print(f"Swapping onto {len(target_faces)} face(s)...")
result = target_img.copy()

for face in target_faces:
    result = swapper.get(result, face, source_face, paste_back=True)

# -----------------------------
# SAVE
# -----------------------------
cv2.imwrite(output_path, result)
print(f"✅ Face swapped saved: {output_path}")
sys.exit(0)
