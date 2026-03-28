function generateScriptFromTopic(topic) {

  if (!topic) {
    return "";
  }

  const t = topic.trim();

  const script = `
${t} started with a bold vision.

At first many people doubted the idea.

But through persistence and innovation the journey changed an entire industry forever.
`;

  return script;

}

module.exports = {
  generateScriptFromTopic
};
