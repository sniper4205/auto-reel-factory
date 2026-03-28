const { buildStoryGraph } = require("./engines/storyGraphEngine");

const script = `
Sara and Zara are talking at Sara's place.
Then they go to meet Mark at his house in a car.
On the way they see Max and greet him.
They arrive at Mark's house and talk.
`;

const graph = buildStoryGraph(script);

console.log(JSON.stringify(graph, null, 2));
