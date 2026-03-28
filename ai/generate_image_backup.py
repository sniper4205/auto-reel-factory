import argparse
import json
import os
import sys
import torch
from diffusers import StableDiffusionPipeline


PIPE = None


def load_pipeline():
    global PIPE
    if PIPE is not None:
        return PIPE

    torch.set_num_threads(1)

    pipe = StableDiffusionPipeline.from_pretrained(
        "runwayml/stable-diffusion-v1-5",
        torch_dtype=torch.float32,
        safety_checker=None,
        requires_safety_checker=False,
    )

    pipe = pipe.to("cpu")
    pipe.enable_attention_slicing()

    PIPE = pipe
    return PIPE


def sanitize_text(text):
    return str(text or "").replace("\n", " ").strip()


def generate_one(pipe, prompt, negative, output_path, steps, guidance, seed):
    generator = torch.Generator(device="cpu").manual_seed(int(seed))

    result = pipe(
        prompt=sanitize_text(prompt),
        negative_prompt=sanitize_text(negative) if negative else None,
        num_inference_steps=int(steps),
        guidance_scale=float(guidance),
        generator=generator,
        height=768,
        width=432,
    )

    image = result.images[0]
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    image.save(output_path)
    print(output_path)


def run_manifest_mode(manifest_path):
    if not os.path.exists(manifest_path):
      raise FileNotFoundError(f"Manifest not found: {manifest_path}")

    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    shots = manifest.get("shots", [])
    if not shots:
        raise ValueError("Manifest contains no shots.")

    default_steps = int(manifest.get("steps", 10))
    default_guidance = float(manifest.get("guidance", 6.5))

    pipe = load_pipeline()

    for shot in shots:
        generate_one(
            pipe=pipe,
            prompt=shot.get("prompt", ""),
            negative=shot.get("negative", ""),
            output_path=shot["output"],
            steps=shot.get("steps", default_steps),
            guidance=shot.get("guidance", default_guidance),
            seed=shot.get("seed", 0),
        )


def run_single_mode(args):
    pipe = load_pipeline()
    generate_one(
        pipe=pipe,
        prompt=args.prompt,
        negative=args.negative,
        output_path=args.output,
        steps=args.steps,
        guidance=args.guidance,
        seed=args.seed,
    )


def main():
    parser = argparse.ArgumentParser()

    parser.add_argument("--manifest", type=str, default="")
    parser.add_argument("--prompt", type=str, default="")
    parser.add_argument("--output", type=str, default="")
    parser.add_argument("--steps", type=int, default=10)
    parser.add_argument("--guidance", type=float, default=6.5)
    parser.add_argument("--seed", type=int, default=0)
    parser.add_argument("--negative", type=str, default="")

    args = parser.parse_args()

    try:
        if args.manifest:
            run_manifest_mode(args.manifest)
        else:
            if not args.prompt or not args.output:
                raise ValueError(
                    "Single mode requires --prompt and --output, or use --manifest."
                )
            run_single_mode(args)
    except Exception as error:
        print(f"ERROR: {error}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
