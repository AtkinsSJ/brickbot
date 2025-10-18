import 'dotenv/config';
import {InstallGlobalCommands} from './utils.js';
import {Commands} from "./src/Commands.js";

const ALL_COMMANDS = Object.values(Commands).map(command => command.discordDefinition);
await InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS);
