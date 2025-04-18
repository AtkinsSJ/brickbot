import 'dotenv/config';
import {capitalize, InstallGlobalCommands} from './utils.js';

// Simple test command
const TEST_COMMAND = {
  name: 'test',
  description: 'Basic command',
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
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

const ALL_COMMANDS = [TEST_COMMAND, PART_COMMAND];

InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS);
