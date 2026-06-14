import {Command} from "../Command.js";
import {CommandType, OptionType, replaceLoadingMessage, sendLoadingMessage, sendResultMessage} from "../Discord.js";
import {getJSON} from "../../utils.js";
import {Set} from "../Data/Set.js";

export class SetCommand extends Command {
  constructor() {
    super("set", "Look up a set", CommandType.ChatInput, [
      {
        type: OptionType.String,
        name: "id",
        description: "Lego set ID",
        required: true,
        max_length: 50,
      }
    ]);
  }

  async run(request, response, data) {
    // /set <id>
    // Look up a set by its Lego ID

    // Get the id
    let setID = request.body.data.options[0].value;

    await sendLoadingMessage(response, `Loading set #${setID}...`);

    // Rebrickable set IDs always have a dash and a number at the end. If we don't have one, add `-1`.
    let didManuallySpecifyVersion = setID.includes('-');
    if (!didManuallySpecifyVersion) {
      setID += "-1";
    }

    // Fetch data from Rebrickable
    let setJSON;
    try {
      setJSON = await getJSON(`https://rebrickable.com/api/v3/lego/sets/${setID}/?key=${process.env.REBRICKABLE_KEY}`);
    } catch (error) {
      console.error(`Rebrickable API request failed: ${error.message}`);
      return replaceLoadingMessage(request, `:warning: Rebrickable API request failed: ${error.message}`);
    }

    // If Rebrickable gave us an error, show it instead.
    if (setJSON.detail) {
      return replaceLoadingMessage(request, `:warning: Unable to get set '${setID}': ${setJSON.detail}`);
    }

    // Send completed message
    const set = Set.fromRebrickableJSON(setJSON, didManuallySpecifyVersion);
    return sendResultMessage(request, set.discordMessageJSON);
  }

}
