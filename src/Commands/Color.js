import {Command} from "../Command.js";
import {CommandType, OptionType, replaceLoadingMessage, sendLoadingMessage, sendResultMessage} from "../Discord.js";
import {ColorManager} from "../ColorManager.js";

const colorSources = {
  "bricklink": {
    displayName: "BrickLink",
    internalName: "BrickLink",
  },
  "brickowl": {
    displayName: "BrickOwl",
    internalName: "BrickOwl",
  },
  "lego": {
    displayName: "Lego",
    internalName: "LEGO",
  },
  "rebrickable": {
    displayName: "Rebrickable",
    internalName: "Rebrickable",
  },
}

function generateLookupCommandData(commandName, displayName) {
  return {
    type: OptionType.SubCommandGroup,
    name: commandName,
    description: `Look up a ${displayName} color`,
    options: [
      {
        type: OptionType.SubCommand,
        name: "id",
        description: `Look up a color by ${displayName} ID`,
        options: [
          {
            type: OptionType.Integer,
            name: "id",
            required: true,
            description: `${displayName} ID`,
          }
        ]
      },
      {
        type: OptionType.SubCommand,
        name: "name",
        description: `Look up a color by ${displayName} name`,
        options: [
          {
            type: OptionType.String,
            name: "name",
            required: true,
            description: `${displayName} name`,
          }
        ]
      },
    ],
  };
}

export class ColorCommand extends Command {
  constructor() {
    super("color", "Convert between color names, or get a random color", CommandType.ChatInput, [
      {
        type: OptionType.SubCommand,
        name: "random",
        description: "Pick a random color",
      },
      ...Object.entries(colorSources)
        .map(([commandName, v]) => {
          return generateLookupCommandData(commandName, v.displayName);
        }),
    ]);
  }

  async run(request, response, data) {
    console.log("Requested color command!");
    console.log(JSON.stringify(data));

    await sendLoadingMessage(response, "Loading color...");

    const command = data.options[0];
    const colorManager = ColorManager.instance;

    if (command.name === "random") {
      // /color random
      const color = colorManager.random();
      return sendResultMessage(request, color.discordMessageJSON);
    }

    // Other commands are all lookups, of the form `/color source name <name>` or `/color source id <id>`
    const colorSource = colorSources[command.name];
    if (colorSource) {
      const queryType = command.options[0];
      const queryInput = queryType?.options?.at(0);
      let color = null;
      if (queryType.name === "id") {
        color = colorManager.getByID(colorSource.internalName, queryInput.value);
      } else if (queryType.name === "name") {
        color = colorManager.getByName(colorSource.internalName, queryInput.value);
      } else {
        return replaceLoadingMessage(request, `:warning: Unrecognized color command '/color ${command.name} ${queryType.name}'`);
      }

      if (!color) {
        return replaceLoadingMessage(request, `${colorSource.displayName} color (${queryType.name}=${queryInput.value}) not found.`);
      }

      return sendResultMessage(request, color.discordMessageJSON);
    }

    return replaceLoadingMessage(request, `:warning: Unrecognized color command '/color ${command.name}'`);
  }

}

