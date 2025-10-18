import 'dotenv/config';
import express from 'express';
import {InteractionResponseType, InteractionType, verifyKeyMiddleware,} from 'discord-interactions';
import * as fs from "node:fs";
import * as https from "node:https";
import {ThemeManager} from "./src/ThemeManager.js";
import {Commands} from "./src/Commands.js";

process.title = "BrickBot";

// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;

console.log(`${Object.keys(Commands).length} commands found: ${Object.keys(Commands).join(', ')}.`);

const themes = await ThemeManager.load(process.env.REBRICKABLE_KEY);
console.log(`Loaded ${themes.count} themes. My favourite is ${themes.getByID(themes.randomID()).name}`);

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

    const { name } = data;
    const command = Commands[name];
    if (command) {
      switch (type) {
        case InteractionType.APPLICATION_COMMAND:
          return command.run(req, res, data);
        case InteractionType.APPLICATION_COMMAND_AUTOCOMPLETE:
          return command.autocomplete(req, res, data);
        default:
          console.error(`unknown interaction type: ${type}`);
          return res.status(400).json({ error: `unknown interaction type: ${type}` });
      }
    }
    console.error(`unknown command: "${name}"`);
    return res.status(400).json({ error: `unknown command: "${name}"` });
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

