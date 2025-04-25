import 'dotenv/config';
import {InstallGlobalCommands} from './utils.js';

const MINIFIG_COMMAND = {
  name: "minifig",
  description: "Look up a minifig",
  options: [
    {
      type: 3,
      name: "id",
      description: "Rebrickable number (`fig-001234` or just `1234`)",
      required: true,
      max_length: 50,
    }
  ],
  type: 1,
};

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

const ALL_COMMANDS = [MINIFIG_COMMAND, PART_COMMAND, SET_COMMAND];

InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS);
