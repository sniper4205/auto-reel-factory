const { z } = require("zod");

const SceneSchema = z.object({
  subject: z.string().min(1),
  age: z.enum([
    "Newborn",
    "Infant",
    "Child",
    "Teenager",
    "Young adult",
    "Young Woman",
    "Young Man",
    "Adult",
  ]),
  action: z.string().min(2),
  environment: z.string().min(2),
});

const SceneArraySchema = z.array(SceneSchema).min(1);

function validateScenes(data) {
  try {
    return SceneArraySchema.parse(data);
  } catch (error) {
    console.error("Scene validation failed.");
    if (error?.issues) {
      console.error(JSON.stringify(error.issues, null, 2));
    } else {
      console.error(error);
    }
    return null;
  }
}

module.exports = {
  validateScenes,
};
