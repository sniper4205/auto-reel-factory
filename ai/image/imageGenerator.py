#!/usr/bin/env python3
"""
Advanced offline image generator using Stable Diffusion XL (SDXL) or Flux models.
"""

import argparse
import os
import sys
from typing import List, Dict
import torch
from diffusers import (
    AutoPipelineForText2Image,
    DiffusionPipeline,
    StableDiffusionXLPipeline,
    StableDiffusionXLImg2ImgPipeline,
    StableDiffusionXLRefinerPipeline,
)
from PIL import Image

_PIPELINE_CACHE: Dict[str, object] = {}

def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description='Offline high‑quality image generator')
    parser.add_argument('--prompt', type=str, required=True, help='Positive prompt')
    parser.add_argument('--negative', type=str, default='', help='Negative prompt')
    parser.add_argument('--seed', type=int, default=0, help='Deterministic seed')
    parser.add_argument('--width', type=int, default=1024, help='Image width')
    parser.add_argument('--height', type=int, default=1792, help='Image height')
    parser.add_argument('--steps', type=int, default=40, help='Number of denoising steps')
    parser.add_argument('--guidance', type=float, default=7.5, help='Guidance scale')
    parser.add_argument('--model', type=str, choices=['sdxl', 'flux', 'cartoon', 'disney_lora', 'kids_lora'], default='sdxl', help='Base model to use')
    parser.add_argument('--reference', type=str, default=None, help='Path to reference image for identity preservation')
    parser.add_argument('--output', type=str, required=True, help='Output file path')
    return parser.parse_args()

def load_sdxl(device: torch.device):
    key = 'sdxl'
    if key in _PIPELINE_CACHE:
        return _PIPELINE_CACHE[key]
    model_id = 'stabilityai/stable-diffusion-xl-base-1.0'
    pipe = StableDiffusionXLPipeline.from_pretrained(
        model_id,
        torch_dtype=torch.float16 if device.type != 'cpu' else torch.float32,
        variant='fp16' if device.type != 'cpu' else None,
        use_safetensors=True,
        local_files_only=True,
    )
    try:
      pipe.enable_xformers_memory_efficient_attention()
    except Exception:
      pass
    pipe.to(device)
    _PIPELINE_CACHE[key] = pipe
    return pipe

def load_sdxl_refiner(device: torch.device):
    key = 'sdxl_refiner'
    if key in _PIPELINE_CACHE:
        return _PIPELINE_CACHE[key]
    refiner_id = 'stabilityai/stable-diffusion-xl-refiner-1.0'
    refiner = StableDiffusionXLRefinerPipeline.from_pretrained(
        refiner_id,
        torch_dtype=torch.float16 if device.type != 'cpu' else torch.float32,
        variant='fp16' if device.type != 'cpu' else None,
        use_safetensors=True,
        local_files_only=True,
    )
    try:
      refiner.enable_xformers_memory_efficient_attention()
    except Exception:
      pass
    refiner.to(device)
    _PIPELINE_CACHE[key] = refiner
    return refiner

def load_sdxl_img2img(device: torch.device):
    key = 'sdxl_img2img'
    if key in _PIPELINE_CACHE:
        return _PIPELINE_CACHE[key]
    model_id = 'stabilityai/stable-diffusion-xl-base-1.0'
    pipe = StableDiffusionXLImg2ImgPipeline.from_pretrained(
        model_id,
        torch_dtype=torch.float16 if device.type != 'cpu' else torch.float32,
        variant='fp16' if device.type != 'cpu' else None,
        use_safetensors=True,
        local_files_only=True,
    )
    try:
      pipe.enable_xformers_memory_efficient_attention()
    except Exception:
      pass
    pipe.to(device)
    _PIPELINE_CACHE[key] = pipe
    return pipe

def load_flux(device: torch.device):
    key = 'flux'
    if key in _PIPELINE_CACHE:
        return _PIPELINE_CACHE[key]
    model_id = 'black-forest-labs/FLUX.1-dev'
    pipe = DiffusionPipeline.from_pretrained(
        model_id,
        torch_dtype=torch.float16 if device.type != 'cpu' else torch.float32,
        use_safetensors=True,
        local_files_only=True,
    )
    try:
      pipe.enable_xformers_memory_efficient_attention()
    except Exception:
      pass
    pipe.to(device)
    _PIPELINE_CACHE[key] = pipe
    return pipe

def load_cartoon(device: torch.device):
    key = 'cartoon'
    if key in _PIPELINE_CACHE:
        return _PIPELINE_CACHE[key]
    model_id = 'Lykon/dreamshaper-xl-1-0'
    pipe = DiffusionPipeline.from_pretrained(
        model_id,
        torch_dtype=torch.float16 if device.type != 'cpu' else torch.float32,
        use_safetensors=True,
        local_files_only=True,
    )
    try:
      pipe.enable_xformers_memory_efficient_attention()
    except Exception:
      pass
    pipe.to(device)
    _PIPELINE_CACHE[key] = pipe
    return pipe

def load_lora(pipe, lora_path):
    if lora_path and os.path.exists(lora_path):
        pipe.load_lora_weights(lora_path)
    return pipe

def generate_images(prompt: str, negative_prompt: str, seed: int, width: int, height: int, steps: int, guidance: float, model: str, reference: str = None, output: str = None) -> List[str]:
    device = torch.device('cuda' if torch.cuda.is_available() else ('mps' if torch.backends.mps.is_available() else 'cpu'))
    generator = torch.Generator(device=device)
    generator.manual_seed(seed)
    images = []

    if model in ['sdxl', 'disney_lora', 'kids_lora']:
        if reference:
            pipe = load_sdxl_img2img(device)
            if model == 'disney_lora':
                lora_path = os.environ.get('DISNEY_LORA_PATH', '')
                pipe = load_lora(pipe, lora_path)
            elif model == 'kids_lora':
                lora_path = os.environ.get('KIDS_LORA_PATH', '')
                pipe = load_lora(pipe, lora_path)
            init_img = Image.open(reference).convert('RGB')
            init_img = init_img.resize((width, height))
            result = pipe(
                prompt=[prompt],
                negative_prompt=[negative_prompt] if negative_prompt else None,
                image=init_img,
                strength=0.6,
                num_inference_steps=steps,
                guidance_scale=guidance,
                generator=generator,
            )
            images = result.images
        else:
            pipe = load_sdxl(device)
            if model == 'disney_lora':
                lora_path = os.environ.get('DISNEY_LORA_PATH', '')
                pipe = load_lora(pipe, lora_path)
            elif model == 'kids_lora':
                lora_path = os.environ.get('KIDS_LORA_PATH', '')
                pipe = load_lora(pipe, lora_path)
            result = pipe(
                prompt=[prompt],
                negative_prompt=[negative_prompt] if negative_prompt else None,
                num_inference_steps=steps,
                guidance_scale=guidance,
                height=height,
                width=width,
                generator=generator,
            )
            images = result.images
            if model == 'sdxl':
                try:
                    refiner = load_sdxl_refiner(device)
                    refine_steps = max(steps // 2, 20)
                    refined = refiner(
                        prompt=[prompt],
                        negative_prompt=[negative_prompt] if negative_prompt else None,
                        image=images,
                        num_inference_steps=refine_steps,
                        guidance_scale=guidance,
                    )
                    images = refined.images
                except Exception:
                    pass
    elif model == 'flux':
        pipe = load_flux(device)
        result = pipe(
            prompt=[prompt],
            negative_prompt=[negative_prompt] if negative_prompt else None,
            num_inference_steps=steps,
            guidance_scale=guidance,
            height=height,
            width=width,
            generator=generator,
        )
        images = result.images
    elif model == 'cartoon':
        pipe = load_cartoon(device)
        result = pipe(
            prompt=[prompt],
            negative_prompt=[negative_prompt] if negative_prompt else None,
            num_inference_steps=steps,
            guidance_scale=guidance,
            height=height,
            width=width,
            generator=generator,
        )
        images = result.images
    else:
        raise ValueError(f'Unsupported model: {model}')

    paths = []
    base, ext = os.path.splitext(output)
    os.makedirs(os.path.dirname(output), exist_ok=True)
    for idx, img in enumerate(images):
        filename = base if len(images) == 1 else f"{base}_{idx}"
        file_path = f"{filename}{ext or '.png'}"
        img.save(file_path)
        paths.append(file_path)
    return paths

def main() -> None:
    args = parse_args()
    try:
        paths = generate_images(
            prompt=args.prompt,
            negative_prompt=args.negative,
            seed=args.seed,
            width=args.width,
            height=args.height,
            steps=args.steps,
            guidance=args.guidance,
            model=args.model,
            reference=args.reference,
            output=args.output,
        )
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
    for p in paths:
        print(p)

if __name__ == '__main__':
    main()
