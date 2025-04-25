import 'dotenv/config';
import {InstallGlobalCommands} from './utils.js';

const PART_COMMAND = {
  name: "part",
  description: "Look up a part",
  options: [
    {
      type: 3,
      name: "id",
      description: "Lego part ID",
      required: true,
      max_length: 50,
    }
  ],
  type: 1,
};

const SET_COMMAND = {
  name: "set",
  description: "Look up a set",
  options: [
    {
      type: 3,
      name: "id",
      description: "Lego set ID",
      required: true,
      max_length: 50,
    }
  ],
  type: 1,
};

const ALL_COMMANDS = [PART_COMMAND, SET_COMMAND];

InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS);
