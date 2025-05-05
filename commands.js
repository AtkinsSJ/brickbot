import 'dotenv/config';
import {InstallGlobalCommands} from './utils.js';

// https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-types
const COMMAND_TYPE = {
  CHAT_INPUT: 1,
  USER: 2,
  MESSAGE: 3,
  PRIMARY_ENTRY_POINT: 4,
};

// https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-option-type
const OPTION_TYPE = {
  SUB_COMMAND: 1,
  SUB_COMMAND_GROUP: 2,
  STRING: 3,
  INTEGER: 4,
  BOOLEAN: 5,
  USER: 6,
  CHANNEL: 7,
  ROLE: 8,
  MENTIONABLE: 9,
  NUMBER: 10,
  ATTACHMENT: 11,
};

const MINIFIG_COMMAND = {
  name: "minifig",
  description: "Look up a minifig",
  options: [
    {
      type: OPTION_TYPE.STRING,
      name: "id",
      description: "Rebrickable number (`fig-001234` or just `1234`)",
      required: true,
      max_length: 50,
    }
  ],
  type: COMMAND_TYPE.CHAT_INPUT,
};

const PART_COMMAND = {
  name: "part",
  description: "Look up a part",
  options: [
    {
      type: OPTION_TYPE.STRING,
      name: "id",
      description: "Lego part ID",
      required: true,
      max_length: 50,
    }
  ],
  type: COMMAND_TYPE.CHAT_INPUT,
};

const SET_COMMAND = {
  name: "set",
  description: "Look up a set",
  options: [
    {
      type: OPTION_TYPE.STRING,
      name: "id",
      description: "Lego set ID",
      required: true,
      max_length: 50,
    }
  ],
  type: COMMAND_TYPE.CHAT_INPUT,
};

const ALL_COMMANDS = [MINIFIG_COMMAND, PART_COMMAND, SET_COMMAND];

InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS);
