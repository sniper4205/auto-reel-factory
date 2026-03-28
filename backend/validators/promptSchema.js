const { z } = require("zod");

const PromptSchema = z.object({
  sceneId: z.number(),
  shotType: z.string().min(3),
  location: z.string().min(3),
  description: z.string().min(5),
  prompt: z.string().min(10),
  negativePrompt: z.string().min(10),
  visualStyle: z.string().min(3),
  steps: z.number().min(10).max(50),
  guidanceScale: z.number().min(1).max(20),
  lighting: z.string().min(3),
  composition: z.string().min(3),
});

const PromptArraySchema = z.array(PromptSchema);

function validatePrompts(data) {
  try {
    return PromptArraySchema.parse(data);
  } catch (err) {
    console.error("❌ Prompt validation failed:");
    console.error(JSON.stringify(err.errors, null, 2));
    return null;
  }
}

module.exports = {
  validatePrompts,
};
