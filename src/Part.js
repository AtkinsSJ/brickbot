import {generateInfoBox} from "./Discord.js";
import {sortObjectByKeys} from "../utils.js";

const partLinks = {
  "BrickLink": function (ids) {
    return ids.map(id => `[${id}](<https://www.bricklink.com/v2/search.page?q=${id}>)`).join(", ");
  },
  "BrickOwl": function (ids) {
    return ids.map(id => `[${id}](<https://www.brickowl.com/catalog/${id}>)`).join(", ");
  },
  "Brickset": function (ids) {
    return ids.map(id => `[${id}](<https://brickset.com/parts/design-${id}>)`).join(", ");
  },
  "LDraw": function (ids) {
    return ids.map(id => `[${id}](<https://library.ldraw.org/parts/list?tableSearch=${id}>)`).join(", ");
  },
  "LEGO": function (ids) {
    return `[Pick a Brick](<https://www.lego.com/pick-and-build/pick-a-brick?query=${ids.join("+")}>)`;
  },
  "Rebrickable": function (ids) {
    return ids.map(id => `[${id}](<https://rebrickable.com/parts/${id}>)`).join(", ");
  },
};

export class Part {
  id;
  name;
  years = {
    from: 0,
    to: 0,
  };
  printOf;
  printCount = 0;
  imageURL = "https://rebrickable.com/static/img/nil.png";
  links = {};

  static fromRebrickableJSON(json) {
    let part = new Part();
    part.id = json.part_num;
    part.name = json.name;
    part.years = {
      from: json.year_from,
      to: json.year_to,
    };
    part.printOf = json.print_of;
    part.printCount = json.prints?.length || 0;
    if (json.part_img_url) {
      part.imageURL = json.part_img_url;
    }
    part.links["Rebrickable"] = [json.part_num];
    for (let [siteName, ids] of Object.entries(json.external_ids)) {
      part.links[siteName] = ids;
    }
    part.links = sortObjectByKeys(part.links);

    return part;
  }

  get discordMessageJSON() {
    let description = `
## Part ${this.id}: ${this.name}
Produced ${this.years.from} - ${this.years.to}
`;

    if (this.printOf) {
      description += `Print of ${this.printOf}
`;
    } else {
      description += `${this.printCount} known prints
`;
    }

    for (let [siteName, ids] of Object.entries(this.links)) {
      const formatLinks = partLinks[siteName];
      if (!formatLinks)
        continue;

      description += `- ${siteName}: ${formatLinks(ids)}\n`;
    }

    return generateInfoBox(0x00AAFC, description, this.imageURL);
  }
}
