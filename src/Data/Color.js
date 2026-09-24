import {generateInfoBox} from "../Discord.js";
import {ImageGenerator} from "../ImageGenerator.js";

// TODO: We get colour data for LDraw but they don't seem to have a colour page on https://library.ldraw.org
const colorLinks = {
  "BrickLink": function (name, id) {
    return `https://www.bricklink.com/catalogList.asp?catType=P&colorPart=${id}`;
  },
  "BrickOwl": function (name, id) {
    return `https://www.brickowl.com/search/catalog?color=${id}&query=All`;
  },
  "LEGO": function (name, id) {
    return `https://www.lego.com/pick-and-build/pick-a-brick?color=${id}`;
  },
  "Peeron": function (name, id) {
    return `http://www.peeron.com/cgi-bin/invcgis/psearch?query=${name}&limit=color2part`;
  },
  "Rebrickable": function (name, id) {
    return `https://rebrickable.com/parts/?exists_in_color=${id}`;
  },
};

export class Color {
  rgb;
  isTransparent;
  ids = new Map();
  names = new Map();

  static fromRebrickableJSON(json) {
    let color = new Color();
    color.rgb = json.rgb;
    color.isTransparent = json.is_trans;
    color.ids.set("Rebrickable", json.id);
    color.names.set("Rebrickable", json.name);

    // All other names are read from the external_ids data.
    // NB: This produces multiple names, and multiple IDs. We just worry about the first one for now.
    for (let [siteName, data] of Object.entries(json.external_ids)) {
      const firstID = data.ext_ids[0];
      if (Array.isArray(firstID)) {
        color.ids.set(siteName, firstID[0]);
      } else {
        color.ids.set(siteName, firstID);
      }
      const firstDescriptor = data.ext_descrs[0];
      if (Array.isArray(firstDescriptor)) {
        color.names.set(siteName, firstDescriptor[0]);
      } else {
        color.names.set(siteName, firstDescriptor);
      }
    }

    return color;
  }

  get id() {
    return this.ids.get("Rebrickable");
  }

  get name() {
    return this.names.get("Rebrickable");
  }

  async getDiscordMessageJSON(request) {
    const filename = `color-${this.id}.png`;
    const png = await ImageGenerator.instance.generatePNGColorSwatch(this.rgb, this.isTransparent);

    let description = `
## Color ${this.names.get("Rebrickable")}    
`;

    const sortedSiteNames = this.names.keys().toArray().sort();
    for (const siteName of sortedSiteNames) {
      const id = this.ids.get(siteName);
      const name = this.names.get(siteName);
      const makeUrl = colorLinks[siteName];
      description += `- ${siteName}: `;
      if (makeUrl)
        description += '[';
      description += name;
      if (id)
        description += ` (ID ${id})`;
      if (makeUrl)
        description += `](<${makeUrl(name, id)}>)`;
      description += '\n';
    }

    const message = generateInfoBox(
      parseInt(this.rgb, 16),
      description,
      `attachment://${filename}`,
    );

    const attachments = [{
      filename,
      contentType: 'image/png',
      data: png,
      description: `Color swatch for ${this.name}`,
    }];

    return { message, attachments };
  }
}
