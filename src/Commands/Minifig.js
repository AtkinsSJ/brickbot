import {Command} from "../Command.js";
import {
  CommandType,
  generateInfoBox,
  OptionType,
  replaceLoadingMessage,
  sendLoadingMessage,
  sendResultMessage
} from "../Discord.js";
import {getJSON} from "../../utils.js";

export class MinifigCommand extends Command {
  constructor() {
    super("minifig", "Look up a minifig", CommandType.ChatInput, [
      {
        type: OptionType.String,
        name: "id",
        description: "Rebrickable number (`fig-001234` or just `1234`)",
        required: true,
        max_length: 50,
      }
    ]);
  }

  async run(request, response, data) {
    // /minifig <id>
    // Look up a minifig by its Rebrickable ID

    // TODO: Put this in a Minifig class like for Part.
    function generateMinifigMessage(minifigJSON) {
      const description = `
## ${minifigJSON.name}
${minifigJSON.num_parts} parts
[View on Rebrickable](<${minifigJSON.set_url}>)`;

      return generateInfoBox(0xFFC404, description, minifigJSON.set_img_url || "https://rebrickable.com/static/img/nil_mf.jpg");
    }

    let minifigID = request.body.data.options[0].value;

    // The format for these names is "fig-000657", so if we just got a number, make it match that
    if (/^\d+$/.test(minifigID)) {
      minifigID = "fig-" + '0'.repeat(Math.max(6 - minifigID.length, 0)) + minifigID;
    }

    await sendLoadingMessage(response, `Loading minifig #${minifigID}...`);

    // Fetch data from Rebrickable
    let minifigJSON;
    try {
      minifigJSON = await getJSON(`https://rebrickable.com/api/v3/lego/minifigs/${minifigID}/?key=${process.env.REBRICKABLE_KEY}`);
    } catch (error) {
      console.error(`Rebrickable API request failed: ${error.message}`);
      return replaceLoadingMessage(request, `:warning: Rebrickable API request failed: ${error.message}`);
    }

    // If Rebrickable gave us an error, show it instead.
    if (minifigJSON.detail) {
      return replaceLoadingMessage(request, `:warning: Unable to get minifig '${minifigID}': ${minifigJSON.detail}`);
    }

    // Send completed message
    return sendResultMessage(request, generateMinifigMessage(minifigJSON));
  }

}

