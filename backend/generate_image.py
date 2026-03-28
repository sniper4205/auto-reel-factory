import argparse
import json
import os
import sys

import torch
from diffusers import StableDiffusionXLPipeline
from huggingface_hub import hf_hub_download

PIPE_CACHE = {}

MODEL_MAP = {
    "juggernaut-xl": {
        "load_mode": "single_file",
        "repo": "RunDiffusion/Juggernaut-X-v10",
        "file": "Juggernaut-X-RunDiffusion-NSFW.safetensors",
        "visual_profile": "cinematic",
    },
    "animagine-xl": {
        "load_mode": "pretrained",
        "repo": "cagliostrolab/animagine-xl-3.1",
        "visual_profile": "anime",
    },
    "dreamshaper-xl": {
        "load_mode": "pretrained",
        "repo": "Lykon/dreamshaper-xl-1-0",
        "visual_profile": "cartoon",
    },
    "realvis-xl": {
        "load_mode": "pretrained",
        "repo": "SG161222/RealVisXL_V4.0",
        "visual_profile": "realistic",
    },
    "pixart-sigma": {
        "load_mode": "pretrained",
        "repo": "PixArt-alpha/PixArt-Sigma-XL-2-1024-MS",
        "visual_profile": "pixar",
    },
}


def get_device():
    if torch.backends.mps.is_available():
        return "mps"
    if torch.cuda.is_available():
        return "cuda"
    return "cpu"


def get_dtype(device):
    if device == "mps":
        return torch.float32
    if device == "cuda":
        return torch.float16
    return torch.float32


def normalize_spaces(text):
    return " ".join(str(text or "").replace("\n", " ").split()).strip()


def limit_words(text, max_words=38):
    return " ".join(normalize_spaces(text).split()[:max_words])


def resolve_model_key(model_key):
    key = str(model_key or "juggernaut-xl").strip()
    return key if key in MODEL_MAP else "juggernaut-xl"


def load_pipeline(model_key="juggernaut-xl"):
    model_key = resolve_model_key(model_key)

    if model_key in PIPE_CACHE:
        return PIPE_CACHE[model_key]

    device = get_device()
    dtype = get_dtype(device)
    model_info = MODEL_MAP[model_key]

    print(f"Using device: {device}", flush=True)
    print(f"Using dtype: {dtype}", flush=True)
    print(f"Loading model key: {model_key}", flush=True)

    if model_info["load_mode"] == "single_file":
        checkpoint_path = hf_hub_download(
            repo_id=model_info["repo"],
            filename=model_info["file"],
        )

        pipe = StableDiffusionXLPipeline.from_single_file(
            checkpoint_path,
            torch_dtype=dtype,
            use_safetensors=True,
            config="stabilityai/stable-diffusion-xl-base-1.0",
        )
    else:
        pipe = StableDiffusionXLPipeline.from_pretrained(
            model_info["repo"],
            torch_dtype=dtype,
            use_safetensors=True,
        )

    pipe = pipe.to(device)
    pipe.enable_attention_slicing()

    if hasattr(pipe, "vae") and pipe.vae is not None:
        pipe.vae.to(dtype=torch.float32)

    PIPE_CACHE[model_key] = pipe
    return pipe


def build_final_prompt(raw_prompt, visual_profile="cinematic"):
    text = normalize_spaces(raw_prompt)
    return limit_words(text, 38)


def improve_negative(raw_negative="", visual_profile="cinematic"):
    negatives = [
        "blurry",
        "low quality",
        "bad anatomy",
        "extra fingers",
        "extra arms",
        "extra legs",
        "duplicate person",
        "multiple people",
        "deformed face",
        "crossed eyes",
        "distorted hands",
        "elongated body",
        "watermark",
        "logo",
        "text",
        "brand symbol",
        "trademark",
        "modern clothes",
        "modern objects",
        "modern building",
        "modern furniture",
    ]

    if visual_profile in {"cinematic", "realistic"}:
        negatives.extend([
            "cartoon",
            "anime",
            "illustration",
            "painting",
            "3d render",
        ])

    if visual_profile == "anime":
        negatives.extend([
            "photorealistic",
            "real camera photo",
            "documentary photo",
        ])

    custom = normalize_spaces(raw_negative)
    if custom:
        negatives.extend([part.strip() for part in custom.split(",") if part.strip()])

    seen = set()
    cleaned = []
    for item in negatives:
        key = item.lower()
        if key not in seen:
            seen.add(key)
            cleaned.append(item)

    return limit_words(", ".join(cleaned), 45)


def build_generator(seed):
    return torch.Generator(device="cpu").manual_seed(int(seed))


def ensure_parent_dir(output_path):
    directory = os.path.dirname(output_path)
    if directory:
        os.makedirs(directory, exist_ok=True)


def generate_one(pipe, prompt, negative, output_path, steps, guidance, seed, visual_profile="cinematic"):
    final_prompt = build_final_prompt(prompt, visual_profile=visual_profile)
    final_negative = improve_negative(negative, visual_profile=visual_profile)
    generator = build_generator(seed)

    print(f"Final prompt: {final_prompt}", flush=True)
    print(f"Final negative: {final_negative}", flush=True)
    print(f"Seed: {seed}", flush=True)

    result = pipe(
        prompt=final_prompt,
        negative_prompt=final_negative,
        num_inference_steps=int(steps),
        guidance_scale=float(guidance),
        generator=generator,
        width=576,
        height=1024,
    )

    image = result.images[0]

    ensure_parent_dir(output_path)
    image.save(output_path)

    print(output_path, flush=True)


def run_manifest_mode(manifest_path):
    if not os.path.exists(manifest_path):
        raise FileNotFoundError(f"Manifest not found: {manifest_path}")

    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    shots = manifest.get("shots", [])
    if not shots:
        raise ValueError("Manifest contains no shots.")

    default_steps = int(manifest.get("steps", 20))
    default_guidance = float(manifest.get("guidance", 8.0))
    model_key = manifest.get("modelKey", "juggernaut-xl")
    visual_profile = manifest.get("visualProfile", "cinematic")

    pipe = load_pipeline(model_key=model_key)

    for index, shot in enumerate(shots):
        shot_seed = int(shot.get("seed", 12345 + index))

        generate_one(
            pipe=pipe,
            prompt=shot.get("prompt", ""),
            negative=shot.get("negative", "") or shot.get("negativePrompt", ""),
            output_path=shot["output"],
            steps=shot.get("steps", default_steps),
            guidance=shot.get("guidance", shot.get("guidanceScale", default_guidance)),
            seed=shot_seed,
            visual_profile=shot.get("visualProfile", visual_profile),
        )


def run_single_mode(args):
    pipe = load_pipeline(model_key=args.model_key)

    generate_one(
        pipe=pipe,
        prompt=args.prompt,
        negative=args.negative,
        output_path=args.output,
        steps=args.steps,
        guidance=args.guidance,
        seed=args.seed,
        visual_profile=args.visual_profile,
    )


def main():
    parser = argparse.ArgumentParser()

    parser.add_argument("--manifest", type=str, default="")
    parser.add_argument("--prompt", type=str, default="")
    parser.add_argument("--output", type=str, default="")
    parser.add_argument("--steps", type=int, default=20)
    parser.add_argument("--guidance", type=float, default=8.0)
    parser.add_argument("--seed", type=int, default=12345)
    parser.add_argument("--negative", type=str, default="")
    parser.add_argument("--model-key", type=str, default="juggernaut-xl")
    parser.add_argument("--visual-profile", type=str, default="cinematic")

    args = parser.parse_args()

    try:
        if args.manifest:
            run_manifest_mode(args.manifest)
        else:
            if not args.prompt or not args.output:
                raise ValueError("Use --manifest or provide --prompt and --output.")
            run_single_mode(args)

    except Exception as error:
        print(f"ERROR: {error}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
