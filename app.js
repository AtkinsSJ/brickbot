import 'dotenv/config';
import express from 'express';
import {InteractionResponseType, InteractionType, verifyKeyMiddleware,} from 'discord-interactions';
import {DiscordRequest, getJSON} from './utils.js';
import * as fs from "node:fs";
import * as https from "node:https";
import {ThemeManager} from "./src/ThemeManager.js";
import {partNicknames} from "./data/part-nicknames.js";
import {ComponentType, MessageFlag} from "./src/Discord.js";

// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;

const themes = await ThemeManager.load(process.env.REBRICKABLE_KEY);
console.log(`Loaded ${themes.count} themes. My favourite is ${themes.getByID(themes.randomID()).name}`);

const partURLs = {
  "BrickLink": "https://www.bricklink.com/v2/search.page?q=@id@",
  "BrickOwl": "https://www.brickowl.com/catalog/@id@",
  "Brickset": "https://brickset.com/parts/design-@id@",
  "LDraw": "https://library.ldraw.org/parts/list?tableSearch=@id@",
};

function generatePartMessage(partJSON) {
  const printCount = partJSON.prints?.length || 0;

  let description = `
## Part ${partJSON.part_num}: ${partJSON.name}
Produced ${partJSON.year_from} - ${partJSON.year_to}
${printCount} known prints
`;

  for (let [siteName, ids] of Object.entries(partJSON.external_ids)) {
    const siteURLFormat = partURLs[siteName];
    if (!siteURLFormat)
      continue;

    description += `- ${siteName}: `;
    for (const id of ids) {
      description += `[${id}](<${siteURLFormat.replaceAll("@id@", id)}>) `;
    }
    description += '\n';
  }

  description += `- Rebrickable: [${partJSON.part_num}](<${partJSON.part_url}>)\n`;

  return {
    flags: MessageFlag.IsComponentsV2,
    components: [{
      type: ComponentType.Container,
      accent_color: 0x00AAFC,
      components: [{
        type: ComponentType.Section,
        components: [{
          type: ComponentType.TextDisplay,
          content: description,
        }],
        accessory: {
          type: ComponentType.Thumbnail,
          media: {
            url: partJSON.part_img_url,
          }
        },
      }]
    }]
  };
}

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 * Parse request body and verifies incoming requests using discord-interactions package
 */
app.post('/interactions', verifyKeyMiddleware(process.env.PUBLIC_KEY), async function (req, res) {
  try {
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

      async function sendLoadingMessage(text) {
        return res.send({
          type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: text,
          }
        });
      }

      const LOADING_MESSAGE_URL = `webhooks/${process.env.APP_ID}/${req.body.token}/messages/@original`;

      async function replaceLoadingMessage(text) {
        return DiscordRequest(LOADING_MESSAGE_URL, {
          method: "PATCH",
          body: {
            content: text,
          },
        });
      }

      async function sendResultMessage(messageBody) {
        return DiscordRequest(`webhooks/${process.env.APP_ID}/${req.body.token}`, {
          method: "POST",
          body: messageBody,
        });
      }

      // /minifig <id>
      // Look up a minifig by its Rebrickable ID
      if (name === "minifig") {
        let minifigID = req.body.data.options[0].value;

        // The format for these names is "fig-000657", so if we just got a number, make it match that
        if (/^\d+$/.test(minifigID)) {
          minifigID = "fig-" + '0'.repeat(Math.max(6 - minifigID.length, 0)) + minifigID;
        }

        await sendLoadingMessage(`Loading minifig #${minifigID}...`);

        // Fetch data from Rebrickable
        let minifigJSON;
        try {
          minifigJSON = await getJSON(`https://rebrickable.com/api/v3/lego/minifigs/${minifigID}/?key=${process.env.REBRICKABLE_KEY}`);
        } catch (error) {
          console.error(`Rebrickable API request failed: ${error.message}`);
          return replaceLoadingMessage(`:warning: Rebrickable API request failed: ${error.message}`);
        }

        // If Rebrickable gave us an error, show it instead.
        if (minifigJSON.detail) {
          return replaceLoadingMessage(`:warning: Unable to get minifig '${minifigID}': ${minifigJSON.detail}`);
        }

        // Send completed message
        return sendResultMessage({
          embeds: [{
            title: `${minifigJSON.name}`,
            description: `
${minifigJSON.num_parts} parts
[View on Rebrickable](<${minifigJSON.set_url}>)`,
            image: {
              url: minifigJSON.set_img_url,
            },
          }],
        });
      }

      // /part <id>
      // Look up a part by its Lego ID
      if (name === "part") {
        // Get the id
        const partID = req.body.data.options[0].value;

        await sendLoadingMessage(`Loading part #${partID}...`);

        // Fetch data from Rebrickable
        let partsJSON;
        try {
          partsJSON = await getJSON(`https://rebrickable.com/api/v3/lego/parts/?key=${process.env.REBRICKABLE_KEY}&lego_id=${partID}&inc_part_details=1`);
        } catch (error) {
          console.error(`Rebrickable API request failed: ${error.message}`);
          return replaceLoadingMessage(`:warning: Rebrickable API request failed: ${error.message}`);
        }

        if (partsJSON.count == 0) {
          return replaceLoadingMessage(`No results found for '${partID}'`);
        }

        const partJSON = partsJSON.results[0];

        // Send completed message
        return sendResultMessage(generatePartMessage(partJSON));
      }

      // /set <id>
      // Look up a set by its Lego ID
      if (name === "set") {
        // Get the id
        let setID = req.body.data.options[0].value;

        // Rebrickable set IDs always have a dash and a number at the end. If we don't have one, add `-1`.
        if (!setID.includes('-')) {
          setID += "-1";
        }

        await sendLoadingMessage(`Loading set #${setID}...`);

        // Fetch data from Rebrickable
        let setJSON;
        try {
          setJSON = await getJSON(`https://rebrickable.com/api/v3/lego/sets/${setID}/?key=${process.env.REBRICKABLE_KEY}`);
        } catch (error) {
          console.error(`Rebrickable API request failed: ${error.message}`);
          return replaceLoadingMessage(`:warning: Rebrickable API request failed: ${error.message}`);
        }

        // If Rebrickable gave us an error, show it instead.
        if (setJSON.detail) {
          return replaceLoadingMessage(`:warning: Unable to get set '${setID}': ${setJSON.detail}`);
        }

        const theme = themes.getByID(setJSON.theme_id);

        // Send completed message
        return sendResultMessage({
          embeds: [{
            title: `${setJSON.name} (${setJSON.set_num})`,
            description: `
Theme: [${theme.name}](<${theme.url}>)
Released in ${setJSON.year}
${setJSON.num_parts} parts
[View on Rebrickable](<${setJSON.set_url}>)`,
            image: {
              url: setJSON.set_img_url,
            }
          }]
        });
      }

      console.error(`unknown command: ${name}`);
      return res.status(400).json({ error: 'unknown command' });
    }

    // Request for autocomplete suggestions
    // https://discord.com/developers/docs/interactions/application-commands#autocomplete
    if (type === InteractionType.APPLICATION_COMMAND_AUTOCOMPLETE) {
      const { name } = data;

      if (name === "part") {
        // Try and provide suggestions for nicknames
        const query = data.options?.filter(it => it.name === "id")?.at(0)?.value;
        if (!query)
          return;

        const matches = Object.keys(partNicknames).filter(it => it.includes(query));
        return res.send({
          type: InteractionResponseType.APPLICATION_COMMAND_AUTOCOMPLETE_RESULT,
          data: {
            choices: matches.map(it => ({ name: it, value: partNicknames[it] })).slice(0, 25),
          },
        });
      }
    }

    console.error('unknown interaction type', type);
    return res.status(400).json({ error: 'unknown interaction type' });
  } catch (err) {
    console.error("Unhandled exception!", err);
    try {
      return res.sendStatus(500);
    } catch (_) {
    }
  }
});

let options = {};
try {
  options = {
    cert: fs.readFileSync(process.env.TLS_FULLCHAIN_PATH),
    key: fs.readFileSync(process.env.TLS_PRIVKEY_PATH)
  };
  https.createServer(options, app).listen(PORT, () => {
    console.log('Listening on port', PORT);
  });
} catch (err) {
  console.error("Failed to read TLS file:", err);
  console.log("To enable TLS, please set TLS_FULLCHAIN_PATH and TLS_PRIVKEY_PATH in .env");
  app.listen(PORT, () => {
    console.log('Listening on port', PORT);
  });
}

