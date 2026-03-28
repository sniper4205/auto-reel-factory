from diffusers import StableDiffusionPipeline
import torch
import os

os.makedirs("outputs", exist_ok=True)

# FORCE SAFE MODE
torch.set_num_threads(1)

pipe = StableDiffusionPipeline.from_pretrained(
    "runwayml/stable-diffusion-v1-5",
    torch_dtype=torch.float32,
    safety_checker=None
)

pipe = pipe.to("cpu")

# MEMORY OPTIMIZATION (CRITICAL)
pipe.enable_attention_slicing()
pipe.enable_vae_slicing()

prompt = """
passport photo of a middle eastern man,
front facing, looking straight,
neutral expression,
plain background,
natural skin,
no shadows,
realistic face
"""

image = pipe(
    prompt,
    height=512,
    width=512,
    num_inference_steps=15,   # LOWERED
    guidance_scale=6.5        # LOWERED
).images[0]

output_path = "outputs/character_manifest.png"
image.save(output_path)

print("✅ Character generated:", output_path)
