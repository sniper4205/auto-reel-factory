function generateTopics() {

  return [

    "Success story of a poor boy becoming rich",
    "Daily habits of successful people",
    "Why most people fail in life",
    "A motivational story about discipline",
    "The secret mindset of millionaires",
    "A short life lesson story",
    "How small actions change your future"

  ];

}

function generateScript(topic) {

  const scripts = {

    "Success story of a poor boy becoming rich":
`A poor boy once dreamed of becoming successful.
People laughed at him and said it was impossible.
But he worked every single day without quitting.
Years later he became one of the most successful entrepreneurs.`,

    "Daily habits of successful people":
`Successful people start their day early.
They focus on discipline and consistency.
They invest time in learning and improving.
Small daily habits create massive success.`,

    "Why most people fail in life":
`Most people fail not because they are weak.
They fail because they quit too early.
Success belongs to those who continue when things get hard.`,

    "A motivational story about discipline":
`A man decided to change his life with discipline.
Every day he improved just one percent.
After a year his life completely transformed.`,

    "The secret mindset of millionaires":
`Millionaires think differently.
They see opportunities where others see problems.
Their mindset is their greatest asset.`,

    "A short life lesson story":
`Life teaches powerful lessons through struggles.
Every challenge hides an opportunity to grow.`,

    "How small actions change your future":
`Small actions repeated daily shape your future.
Tiny improvements compound into massive results.`

  };

  return scripts[topic];

}

function getContent() {

  const topics = generateTopics();

  const topic = topics[Math.floor(Math.random() * topics.length)];

  const script = generateScript(topic);

  return {
    topic,
    script
  };

}

module.exports = getContent;
