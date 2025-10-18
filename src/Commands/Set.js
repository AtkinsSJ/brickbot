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
import {ThemeManager} from "../ThemeManager.js";

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

    // TODO: Put this in a Set class like for Part.
    function generateSetMessage(setJSON) {
      const theme = ThemeManager.instance.getByID(setJSON.theme_id);

      const description = `
## ${setJSON.name} (${setJSON.set_num})
Theme: [${theme.name}](<${theme.url}>)
Released in ${setJSON.year}
${setJSON.num_parts} parts
[View on Rebrickable](<${setJSON.set_url}>)`;

      return generateInfoBox(0xD12A37, description, setJSON.set_img_url);
    }


    // Get the id
    let setID = request.body.data.options[0].value;

    // Rebrickable set IDs always have a dash and a number at the end. If we don't have one, add `-1`.
    if (!setID.includes('-')) {
      setID += "-1";
    }

    await sendLoadingMessage(response, `Loading set #${setID}...`);

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
    return sendResultMessage(request, generateSetMessage(setJSON));
  }

}
