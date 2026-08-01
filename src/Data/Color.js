import {generateInfoBox} from "../Discord.js";
import {sortObjectByKeys} from "../../utils.js";

export class Color {
  id;
  rgb;
  isTransparent;
  names = {};

  static fromRebrickableJSON(json) {
    let color = new Color();
    color.id = json.id;
    color.rgb = json.rgb;
    color.isTransparent = json.is_trans;
    color.names["Rebrickable"] = json.name;

    // All other names are read from the external_ids data.
    // NB: This produces multiple names, and multiple IDs. We just worry about the first one for now.
    for (let [siteName, data] of Object.entries(json.external_ids)) {
      const firstDescriptor = data.ext_descrs[0];
      if (Array.isArray(firstDescriptor)) {
        color.names[siteName] = firstDescriptor[0];
      } else {
        color.names[siteName] = firstDescriptor;
      }
    }

    color.names = sortObjectByKeys(color.names);

    return color;
  }

  get name() {
    return this.names["Rebrickable"];
  }

  get discordMessageJSON() {
    let description = `
## Color ${this.names["Rebrickable"]}    
`;

    for (let [siteName, name] of Object.entries(this.names)) {
      description += `- ${siteName}: ${name}\n`;
    }

    return generateInfoBox(parseInt(this.rgb, 16), description, false);
  }
}
