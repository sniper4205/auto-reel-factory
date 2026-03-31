const STYLES = {
  realistic: {
    model: 'sdxl',
    promptTemplate: 'ultra realistic cinematic photograph, film still, dynamic composition, depth of field, dramatic perspective',
    negative: 'low quality, blur, distortion, watermark, extra limbs, poorly drawn, bad anatomy',
    colour: 'natural colours, filmic tones',
    lighting: 'dramatic lighting, chiaroscuro, high dynamic range',
    mood: 'cinematic, dramatic',
  },
  comic: {
    model: 'flux',
    promptTemplate: 'comic book art, crisp line art, inked outlines, dynamic angles, motion lines',
    negative: 'photorealistic, dull colours, watermark, text, logo',
    colour: 'vibrant colours, bold contrast',
    lighting: 'flat lighting, cell shading',
    mood: 'action, energetic',
  },
  creepy_comic: {
    model: 'flux',
    promptTemplate: 'dark comic illustration, gritty textures, gothic atmosphere, eerie shadows',
    negative: 'bright cheerful, realistic photograph, watermark, text, logo',
    colour: 'muted palette, desaturated tones',
    lighting: 'moody lighting, strong shadows, high contrast',
    mood: 'creepy, suspenseful',
  },
  modern_cartoon: {
    model: 'cartoon',
    promptTemplate: 'modern cartoon style, clean vector lines, soft gradients, cute characters',
    negative: 'photorealistic, gritty, watermark, text, logo, deformed',
    colour: 'pastel and bright palette, soft gradients',
    lighting: 'soft lighting, minimal shadows',
    mood: 'playful, friendly',
  },
  disney_like: {
    model: 'disney_lora',
    promptTemplate: 'Disney animation style, expressive faces, lush backgrounds, magical ambiance, fairy‑tale composition',
    negative: 'rough sketch, realistic photograph, watermark, text, logo',
    colour: 'saturated hues, warm tones',
    lighting: 'magical lighting, soft glow',
    mood: 'whimsical, adventurous',
  },
  kids_cartoon: {
    model: 'kids_lora',
    promptTemplate: 'kids cartoon style, simple shapes, big eyes, cheerful characters, educational composition',
    negative: 'horror, realistic, complex textures, watermark, text, logo',
    colour: 'bright primary colours',
    lighting: 'cheerful lighting, even illumination',
    mood: 'happy, friendly',
  },
  baby_cartoon: {
    model: 'kids_lora',
    promptTemplate: 'baby cartoon style, adorable rounded shapes, minimal details, nursery rhyme atmosphere',
    negative: 'scary, complex, realistic, watermark, text, logo',
    colour: 'pastel colours, soft hues',
    lighting: 'gentle lighting, soft glow',
    mood: 'cute, gentle',
  },
  horror_cinematic: {
    model: 'sdxl',
    promptTemplate: 'dark cinematic horror scene, cinematic lighting, film grain, spooky environment, intense focus',
    negative: 'cheerful, bright, cartoonish, watermark, text, logo',
    colour: 'dark tones, muted palette',
    lighting: 'low key lighting, deep shadows',
    mood: 'tense, unsettling',
  },
};

const DEFAULT_STYLE_KEY = 'realistic';

function getStyle(name) {
  const key = name && STYLES[name] ? name : DEFAULT_STYLE_KEY;
  const def = STYLES[key];
  return { key, ...def };
}

module.exports = {
  getStyle,
};
