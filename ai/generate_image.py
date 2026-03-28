import sys
import os
import torch
from diffusers import StableDiffusionPipeline

prompt = sys.argv[1] if len(sys.argv) > 1 else "portrait of a middle eastern man"
output_path = sys.argv[2] if len(sys.argv) > 2 else "outputs/scene.png"
seed = int(sys.argv[3]) if len(sys.argv) > 3 else 1234

output_path = output_path.replace(".json", "")
if not output_path.endswith(".png"):
    output_path += ".png"

device = "mps" if torch.backends.mps.is_available() else "cpu"

pipe = StableDiffusionPipeline.from_pretrained(
    "runwayml/stable-diffusion-v1-5",
    torch_dtype=torch.float32
)

pipe = pipe.to(device)
pipe.enable_attention_slicing()

generator = torch.Generator(device="cpu").manual_seed(seed)

image = pipe(
    prompt=prompt,
    num_inference_steps=30,
    guidance_scale=7.5,
    generator=generator
).images[0]

os.makedirs(os.path.dirname(output_path), exist_ok=True)
image.save(output_path)

print(f"✅ Saved image: {output_path}")
sys.exit(0)
