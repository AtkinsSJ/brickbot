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
import {ColorManager} from "../ColorManager.js";

export class ColorCommand extends Command {
  constructor() {
    super("color", "Convert between color names", CommandType.ChatInput, [
      // {
      //   type: OptionType.String,
      //   name: "id",
      //   description: "Rebrickable number (`fig-001234` or just `1234`)",
      //   required: true,
      //   max_length: 50,
      // }
    ]);
  }

  async run(request, response, data) {
    // /minifig <id>
    // Look up a minifig by its Rebrickable ID

    const colorManager = ColorManager.instance;

    const color = colorManager.getByID(colorManager.randomID());
    await sendLoadingMessage(response, "Loading color...");
    return sendResultMessage(request, color.discordMessageJSON);
  }

}

