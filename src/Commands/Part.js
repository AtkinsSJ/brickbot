import {Command} from "../Command.js";
import {CommandType, OptionType, replaceLoadingMessage, sendLoadingMessage, sendResultMessage} from "../Discord.js";
import {getJSON} from "../../utils.js";
import {Part} from "../Part.js";
import {partNicknames} from "../../data/part-nicknames.js";
import {InteractionResponseType} from "discord-interactions";

export class PartCommand extends Command {
  constructor() {
    super("part", "Look up a part", CommandType.ChatInput, [
      {
        type: OptionType.String,
        name: "id",
        description: "Lego part ID (or autocomplete by nickname)",
        required: true,
        max_length: 50,
        autocomplete: true,
      }
    ]);
  }

  async run(request, response, data) {
    // /part <id>
    // Look up a part by its Lego ID

    // Get the id
    const partID = request.body.data.options[0].value;

    await sendLoadingMessage(response, `Loading part #${partID}...`);

    // Fetch data from Rebrickable

    // First, try loading as a Rebrickable part ID
    let partJSON;
    try {
      partJSON = await getJSON(`https://rebrickable.com/api/v3/lego/parts/${partID}/?key=${process.env.REBRICKABLE_KEY}`);
    } catch (error) {
      console.error(`Rebrickable API request failed: ${error.message}`);
      return replaceLoadingMessage(request, `:warning: Rebrickable API request failed: ${error.message}`);
    }
    if (partJSON && !partJSON.detail) {
      const part = Part.fromRebrickableJSON(partJSON);
      return sendResultMessage(request, part.discordMessageJSON);
    }

    // Then, fall back to the Lego ID
    let partsJSON;
    try {
      partsJSON = await getJSON(`https://rebrickable.com/api/v3/lego/parts/?key=${process.env.REBRICKABLE_KEY}&lego_id=${partID}&inc_part_details=1`);
    } catch (error) {
      console.error(`Rebrickable API request failed: ${error.message}`);
      return replaceLoadingMessage(request, `:warning: Rebrickable API request failed: ${error.message}`);
    }

    if (partsJSON.count === 0) {
      return replaceLoadingMessage(request, `No results found for '${partID}'`);
    }

    // Send completed message
    const part = Part.fromRebrickableJSON(partJSON.results[0]);
    return sendResultMessage(request, part.discordMessageJSON);
  }

  async autocomplete(request, response, data) {
    // Try and provide suggestions for nicknames
    const query = data.options?.filter(it => it.name === "id")?.at(0)?.value;
    if (!query)
      return;

    const matches = Object.keys(partNicknames).filter(it => it.includes(query));
    return response.send({
      type: InteractionResponseType.APPLICATION_COMMAND_AUTOCOMPLETE_RESULT,
      data: {
        choices: matches.map(it => ({ name: it, value: partNicknames[it] })).slice(0, 25),
      },
    });
  }
}
