const axios = require("axios");
require("dotenv").config();

const { App } = require("@slack/bolt");

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true
});

app.command("/kittybot-ping", async ({ command, ack, respond }) => {
  const start = Date.now();
  await ack();
  const latency = Date.now() - start;
  await respond({ text: `Pong!\nLatency: ${latency}ms` });
});

app.command("/kittybot-help", async ({ ack, respond }) => {
  await ack();
  await respond({
    text:
`Available Commands:
/kittybot-ping - Check bot latency.
/kittybot-catfact - Get a cat fact.
/kittybot-help - Get a list of all commands.
/kittybot-joke - Get a joke!
/kittybot-catpic - Get a cute cat picture.
/kittybot-randombreed - Get a random cat breed.
`
  });
});

app.command("/kittybot-catfact", async ({ ack, respond }) => {
  await ack();

  try {
    const response = await axios.get("https://catfact.ninja/fact");
    await respond({ text: `Cat Fact:\n${response.data.fact}` });
  } catch (err) {
    await respond({ text: "Failed to fetch a cat fact." });
  }
});

app.command("/kittybot-joke", async ({ ack, respond }) => {
  await ack();

  try {
    const response = await axios.get("https://official-joke-api.appspot.com/random_joke");
    await respond({
      text:
`${response.data.setup}

${response.data.punchline}`
    });
  } catch (err) {
    await respond({ text: "Failed to fetch a joke." });
  }
});

app.command("/kittybot-catpic", async ({ ack, respond }) => {
  await ack();

  try {
    const response = await axios.get('https://api.thecatapi.com/v1/images/search');
    const catImageUrl = response.data[0].url;

    await respond({
      response_type: "in_channel",
      text: "Here is your random cat!",
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*Here is your random cat!*"
          }
        },
        {
          type: "image",
          image_url: catImageUrl,
          alt_text: "A cute cat picture",
          title: {
            type: "plain_text",
            text: "Meow!"
          }
        }
      ]
    });

    console.log('Sent cat block payload to Slack channel.');

  } catch (error) {
    if (error.response) {
      console.error(`API Error: Status ${error.response.status} - Data:`, error.response.data);
    } else {
      console.error('Network/Code Error:', error.message);
    }
    
    await respond({ 
      text: "Sorry, I couldn't fetch a cat picture right now.", 
      response_type: "ephemeral" 
    });
  }
});

app.command("/kittybot-randombreed", async ({ ack, respond }) => {
  await ack();

  try {
    const breedsResponse = await axios.get('https://api.thecatapi.com/v1/breeds');
    const breedsList = breedsResponse;

    const randomBreed = breedsList[Math.floor(Math.random() * breedsList.length)];
    
    const imageResponse = await axios.get(`https://api.thecatapi.com/v1/images/search?breed_id=${randomBreed.id}`);
    const catImageUrl = imageResponse.data.url;

    await respond({
      response_type: "in_channel",
      text: `🐱 Random Breed: ${randomBreed.name}!`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `🐱 *Random Breed:* ${randomBreed.name}\n\n${randomBreed.description}`
          }
        },
        {
          type: "image",
          image_url: catImageUrl,
          alt_text: `A cute ${randomBreed.name} cat`,
          title: {
            type: "plain_text",
            text: `${randomBreed.name}`
          }
        }
      ]
    });

    console.log(`Success! Sent random breed: ${randomBreed.name}`);

  } catch (error) {
    if (error.response) {
      console.error(`API Error: Status ${error.response.status} - Data:`, error.response.data);
    } else {
      console.error('Network/Code Error:', error.message);
    }
    
    await respond({ 
      text: "Sorry, I couldn't fetch a cat breed right now.", 
      response_type: "ephemeral" 
    });
  }
});


(async () => {
  await app.start();
  console.log("bot is running!");
})();