export class Command {
  #name;
  #description;
  #discordType;
  #discordOptions;

  constructor(name, description, discordType, discordOptions) {
    this.#name = name;
    this.#description = description;
    this.#discordType = discordType;
    this.#discordOptions = discordOptions;
  }

  get discordDefinition() {
    return {
      name: this.#name,
      description: this.#description,
      options: this.#discordOptions,
      type: this.#discordType,
    };
  }

  get name() {
    return this.#name;
  }

  //
  // Implement these in subclasses.
  //

  // Run the command
  // https://discord.com/developers/docs/interactions/application-commands#slash-commands
  async run(request, response, data) {
    throw Error(`run() isn't implemented for ${this.constructor.name}`);
  };

  // Provide autocomplete suggestions
  // https://discord.com/developers/docs/interactions/application-commands#autocomplete
  async autocomplete(request, response, data) {
    throw Error(`autocomplete() isn't implemented for ${this.constructor.name}`);
  };
}
