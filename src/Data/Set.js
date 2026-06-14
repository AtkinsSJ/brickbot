import {generateInfoBox} from "../Discord.js";
import {sortObjectByKeys} from "../../utils.js";
import {ThemeManager} from "../ThemeManager.js";

export class Set {
  id;
  didManuallySpecifyVersion;
  name;
  year;
  partCount;
  themeID;
  imageURL = "https://rebrickable.com/static/img/nil.png";
  rebrickableURL;

  static fromRebrickableJSON(json, didManuallySpecifyVersion) {
    let set = new Set();
    set.id = json.set_num;
    set.didManuallySpecifyVersion = didManuallySpecifyVersion;
    set.name = json.name;
    set.year = json.year;
    set.partCount = json.num_parts;
    set.themeID = json.theme_id;
    if (json.set_img_url) {
      set.imageURL = json.set_img_url;
    }
    set.rebrickableURL = json.set_url;

    return set;
  }

  get discordMessageJSON() {
    const theme = ThemeManager.instance.getByID(this.themeID);

    let description = `
## ${this.name} (${this.id})
Theme: [${theme.name}](<${theme.url}>)
Released in ${this.year}
${this.partCount} parts
`;

    // Rebrickable doesn't give us direct URLs for other sites, so we have to produce them manually.

    // Set IDs are complicated - on some sites they have a dash and then a version, but not all sites accept that.
    // The ID we already have has a dash because Rebrickable requires it.
    // So, reconstruct the user's requested ID based on whether they specified the version or not, and either use that,
    // or the unversioned ID for sites that need it.

    let unversionedSetID = this.id;
    if (unversionedSetID.includes('-')) {
      unversionedSetID = unversionedSetID.split('-')[0];
    }

    let setID = this.id;
    if (!this.didManuallySpecifyVersion) {
      setID = unversionedSetID;
    }

    description += `
- [BrickLink](https://www.bricklink.com/v2/catalog/catalogitem.page?S=${setID})
- [BrickOwl](https://www.brickowl.com/search/catalog?query=${unversionedSetID})
- [Brickset](https://brickset.com/sets/${setID})
- [LEGO](https://www.lego.com/product/${unversionedSetID})
- [Rebrickable](${this.rebrickableURL})
`;

    return generateInfoBox(0xD12A37, description, this.imageURL);
  }
}
