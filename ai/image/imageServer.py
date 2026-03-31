#!/usr/bin/env python3
import os
from typing import Optional, Dict

import torch
import uvicorn
from fastapi import FastAPI
from pydantic import BaseModel
from PIL import Image
from diffusers import (
    StableDiffusionXLPipeline,
    StableDiffusionXLImg2ImgPipeline,
    DPMSolverMultistepScheduler,
)

DEFAULT_SDXL_MODEL = "/Users/muhammadfahad/AutoReel_Old/ComfyUI/models/checkpoints/juggernautXL.safetensors"

app = FastAPI()
PIPELINES: Dict[str, object] = {}


class GenerateRequest(BaseModel):
    prompt: str
    negative_prompt: Optional[str] = ""
    seed: int = 0
    width: int = 1024
    height: int = 1792
    steps: int = 12
    guidance: float = 6.0
    model: str = "sdxl"
    output: str
    reference: Optional[str] = None


def get_device() -> str:
    if torch.backends.mps.is_available():
        return "mps"
    if torch.cuda.is_available():
        return "cuda"
    return "cpu"


def get_dtype(device: str):
    if device == "cuda":
        return torch.float16
    return torch.float32


def get_local_model_path(model_name: str) -> str:
    return DEFAULT_SDXL_MODEL


def maybe_optimize(pipe):
    try:
        pipe.enable_attention_slicing()
    except Exception:
        pass
    try:
        pipe.enable_vae_slicing()
    except Exception:
        pass
    return pipe


def apply_stable_scheduler(pipe):
    pipe.scheduler = DPMSolverMultistepScheduler.from_config(
        pipe.scheduler.config,
        use_karras_sigmas=False,
        algorithm_type="dpmsolver++",
    )
    return pipe


def load_pipeline(model_name: str, variant: str = "base"):
    key = f"{model_name}:{variant}"
    if key in PIPELINES:
        return PIPELINES[key]

    device = get_device()
    dtype = get_dtype(device)
    model_path = get_local_model_path(model_name)

    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found: {model_path}")

    print(f"[INFO] Loading {model_name} {variant} on {device}")
    print(f"[INFO] Model path: {model_path}")

    common_kwargs = {
        "torch_dtype": dtype,
        "use_safetensors": True,
    }

    if variant == "img2img":
        pipe = StableDiffusionXLImg2ImgPipeline.from_single_file(
            model_path,
            **common_kwargs,
        )
    else:
        pipe = StableDiffusionXLPipeline.from_single_file(
            model_path,
            **common_kwargs,
        )

    pipe = apply_stable_scheduler(pipe)
    pipe = maybe_optimize(pipe)
    pipe = pipe.to(device)

    PIPELINES[key] = pipe
    return pipe


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/generate")
def generate(req: GenerateRequest):
    device = get_device()
    pipe_variant = "img2img" if req.reference and os.path.exists(req.reference) else "base"
    pipe = load_pipeline(req.model, pipe_variant)

    width = int(req.width)
    height = int(req.height)
    steps = min(max(int(req.steps), 6), 12)
    guidance = float(req.guidance)
    seed = int(req.seed)

    if device == "cpu":
        generator = torch.Generator(device="cpu").manual_seed(seed)
    elif device == "cuda":
        generator = torch.Generator(device="cuda").manual_seed(seed)
    else:
        generator = torch.Generator().manual_seed(seed)

    common_args = {
        "prompt": req.prompt,
        "negative_prompt": req.negative_prompt if req.negative_prompt else None,
        "num_inference_steps": steps,
        "guidance_scale": guidance,
        "generator": generator,
    }

    with torch.no_grad():
        if pipe_variant == "img2img":
            init_image = Image.open(req.reference).convert("RGB")
            init_image = init_image.resize((width, height))
            result = pipe(
                image=init_image,
                strength=0.5,
                **common_args,
            )
        else:
            result = pipe(
                width=width,
                height=height,
                **common_args,
            )

    images = result.images

    out_dir = os.path.dirname(req.output)
    os.makedirs(out_dir, exist_ok=True)

    paths = []
    base, ext = os.path.splitext(req.output)
    if not ext:
        ext = ".png"

    for idx, img in enumerate(images):
        file_path = f"{base}{ext}" if len(images) == 1 else f"{base}_{idx}{ext}"
        img.save(file_path)
        paths.append(file_path)

    return {"paths": paths}


def run():
    port = int(os.getenv("PORT", os.getenv("IMAGE_SERVER_PORT", "7861")))
    host = os.getenv("HOST", os.getenv("IMAGE_SERVER_HOST", "127.0.0.1"))
    uvicorn.run(app, host=host, port=port)


if __name__ == "__main__":
    run()
