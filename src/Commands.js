import {ColorCommand} from "./Commands/Color.js";
import {MinifigCommand} from "./Commands/Minifig.js";
import {PartCommand} from "./Commands/Part.js";
import {SetCommand} from "./Commands/Set.js";

export const Commands = {
  "color": new ColorCommand(),
  "minifig": new MinifigCommand(),
  "part": new PartCommand(),
  "set": new SetCommand(),
};
