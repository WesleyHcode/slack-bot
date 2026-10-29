const axios = require("axios");
require("dotenv").config();

const { App } = require("@slack/bolt");

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true
});

catToken = process.env.CAT_API_KEY

app.receiver.client.on('unable_to_establish_connection', (error) => {
  console.error('Unable to establish connection with Slack, retrying.', error);
});

app.receiver.client.on('disconnect', () => {
  console.warn('Temporarily disconnected from Slack, waiting for reconnection.');
});

app.command("/kittybot-ping", async ({ command, ack, respond }) => {
  const start = Date.now();
  await ack();
  const latency = Date.now() - start;
  await respond({ 
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Pong! Ping successful.*\nLatency: ${latency}ms` }
      }
    ]
  });
});

app.command("/kittybot-help", async ({ ack, respond }) => {
  await ack();
  await respond({
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*KittyBot currently has 6 commands:*\nIf you need help contact <@U0B7FD0NAQM>."
        }
      },
      {
        type: "divider",
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*Utility Commands:*\n\`/kittybot-help\` - Get a list of all commands.\n\`/kittybot-ping\` - Check bot latency."
        }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*Basic Commands:*\n\`/kittybot-joke\` - Get a joke!"
        }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*Cat Commands:*\n\`/kittybot-catfact\` - Get a cat fact.\n\`/kittybot-catpic\` - Get a cute cat picture.\n\`/kittybot-randombreed\` - Get a random cat breed's photo and description."
        }
      }
    ]
  });
});

app.command("/kittybot-catfact", async ({ ack, respond }) => {
  await ack();

  try {
    const response = await axios.get("https://catfact.ninja/fact");
    await respond({ 
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Cat Fact:*\n${response.data.fact}`
          }
        }
      ]
    });
  } catch (err) {
    await respond({ text: "Failed to fetch a cat fact." });
  }
});

app.command("/kittybot-joke", async ({ ack, respond }) => {
  await ack();

  try {
    const response = await axios.get("https://official-joke-api.appspot.com/random_joke");
    await respond({
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `${response.data.setup}\n\n${response.data.punchline}`
          }
        }
      ]
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

    console.log('Success! Cat block payload sent to Slack channel.');

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
    const catBreeds = await axios.get('https://api.thecatapi.com/v1/breeds', {
      headers: {
        'x-api-key': catToken
      }
    });
    const randomIndex = Math.floor(Math.random() * catBreeds.data.length);
    const randomBreed = catBreeds.data[randomIndex];

    const catImageResponse = await axios.get(`https://api.thecatapi.com/v1/images/search?breed_ids=${randomBreed.id}`, {
      headers: {
        'x-api-key': catToken
      }
    });
    const catImageUrl = catImageResponse.data[0].url;

    await respond({
      response_type: "in_channel",
      text: `Random Breed: ${randomBreed.name}!`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Random Breed:* ${randomBreed.name}\n\n${randomBreed.description || "No description available for this breed."}`
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