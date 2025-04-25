import 'dotenv/config';
import express from 'express';
import {InteractionResponseType, InteractionType, verifyKeyMiddleware,} from 'discord-interactions';
import {DiscordRequest, getJSON} from './utils.js';

// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 * Parse request body and verifies incoming requests using discord-interactions package
 */
app.post('/interactions', verifyKeyMiddleware(process.env.PUBLIC_KEY), async function (req, res) {
  // Interaction id, type and data
  const { id, type, data } = req.body;

  /**
   * Handle verification requests
   */
  if (type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }

  /**
   * Handle slash command requests
   * See https://discord.com/developers/docs/interactions/application-commands#slash-commands
   */
  if (type === InteractionType.APPLICATION_COMMAND) {
    const { name } = data;

    // /part <id>
    // Look up a part by its Lego ID
    if (name === "part") {
      // Get the id
      const partID = req.body.data.options[0].value;

      // Send a loading message
      await res.send({
        type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `Loading part #${partID}...`,
        }
      });

      const loadingMessage = `webhooks/${process.env.APP_ID}/${req.body.token}/messages/@original`;

      // Fetch data from Rebrickable
      let partJSON;
      try {
        partJSON = await getJSON(`https://rebrickable.com/api/v3/lego/parts/${partID}/?key=${process.env.REBRICKABLE_KEY}`);
      } catch (error) {
        console.error(`Rebrickable API request failed: ${error.message}`);
        return DiscordRequest(loadingMessage, {
          method: "PATCH",
          body: {
            content: `:warning: Rebrickable API request failed: ${error.message}`,
          },
        });
      }

      // If Rebrickable gave us an error, show it instead.
      if (partJSON.detail) {
        return DiscordRequest(loadingMessage, {
          method: "PATCH",
          body: {
            content: `:warning: Unable to get part '${partID}': ${partJSON.detail}`,
          },
        });
      }

      // Send completed message
      return DiscordRequest(`webhooks/${process.env.APP_ID}/${req.body.token}`, {
        method: "POST",
        body: {
          embeds: [{
            title: `Part ${partJSON.part_num}: ${partJSON.name}`,
            description: `
- [BrickLink](<https://www.bricklink.com/v2/catalog/catalogitem.page?P=${partJSON.external_ids['BrickLink']}>)
- [Rebrickable](<${partJSON.part_url}>)`,
            image: {
              url: partJSON.part_img_url
            }
          }]
        },
      });
    }

    // /set <id>
    // Look up a set by its Lego ID
    if (name === "set") {
      // Get the id
      let setID = req.body.data.options[0].value;

      // Rebrickable set IDs always have a dash and a number at the end. If we don't have one, add `-1`.
      if (!setID.includes('-'))
        setID += "-1";

      // Send a loading message
      await res.send({
        type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `Loading set #${setID}...`,
        }
      });

      const loadingMessage = `webhooks/${process.env.APP_ID}/${req.body.token}/messages/@original`;

      // Fetch data from Rebrickable
      let setJSON;
      try {
        setJSON = await getJSON(`https://rebrickable.com/api/v3/lego/sets/${setID}/?key=${process.env.REBRICKABLE_KEY}`);
      } catch (error) {
        console.error(`Rebrickable API request failed: ${error.message}`);
        return DiscordRequest(loadingMessage, {
          method: "PATCH",
          body: {
            content: `:warning: Rebrickable API request failed: ${error.message}`,
          },
        });
      }

      // If Rebrickable gave us an error, show it instead.
      if (setJSON.detail) {
        return DiscordRequest(loadingMessage, {
          method: "PATCH",
          body: {
            content: `:warning: Unable to get set '${setID}': ${setJSON.detail}`,
          },
        });
      }

      // Send completed message
      return DiscordRequest(`webhooks/${process.env.APP_ID}/${req.body.token}`, {
        method: "POST",
        body: {
          embeds: [{
            title: `${setJSON.name} (${setJSON.set_num})`,
            description: `
Released in ${setJSON.year}
${setJSON.num_parts} parts
[View on Rebrickable](<${setJSON.set_url}>)`,
            image: {
              url: setJSON.set_img_url,
            }
          }]
        },
      });
    }

    console.error(`unknown command: ${name}`);
    return res.status(400).json({ error: 'unknown command' });
  }

  console.error('unknown interaction type', type);
  return res.status(400).json({ error: 'unknown interaction type' });
});

app.listen(PORT, () => {
  console.log('Listening on port', PORT);
});
