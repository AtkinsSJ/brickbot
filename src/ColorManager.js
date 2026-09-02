import {getJSON} from "../utils.js";
import {Color} from "./Data/Color.js";

export class ColorManager {
  static #instance;

  #colors; // Map()

  constructor(colors) {
    this.#colors = colors;
  }

  static async load(rebrickableKey) {
    const colors = new Map();

    console.log("Loading colors...");

    try {
      let requestUrl = "https://rebrickable.com/api/v3/lego/colors/?page=1";
      while (requestUrl) {
        const json = await getJSON(`${requestUrl}&key=${rebrickableKey}`);
        console.log(`...got ${json.results.length}`);
        requestUrl = json.next;

        for (const result of json.results) {
          colors.set(result.id, Color.fromRebrickableJSON(result));
        }
      }
    } catch (error) {
      console.error("Unable to load color data", error);
    }
    console.log(`...done!`);

    this.#instance = new ColorManager(colors);
    return this.#instance;
  }

  static get instance() {
    return this.#instance;
  }

  get count() {
    return this.#colors.size;
  }

  random() {
    const randomIndex = Math.floor(Math.random() * this.#colors.size);
    const values = Array.from(this.#colors.values());
    return values[randomIndex];
  }

  getByName(siteName, name) {
    // FIXME: We could really use an index by site!
    for (let color of this.#colors.values()) {
      const nameForSite = color.names[siteName];
      if (nameForSite && nameForSite.localeCompare(name, undefined, { sensitivity: "base" }) === 0) {
        return color;
      }
    }

    return null;
  }

  getByID(siteName, id) {
    // FIXME: We could really use an index by site!
    for (let color of this.#colors.values()) {
      if (color.ids[siteName] === id)
        return color;
    }
    return null;
  }

  // NB: Discord limits autocomplete results to 25 entries
  findNameMatches(siteName, query, maximumResults = 25) {
    // FIXME: We could really use an index by site!
    const queryRegex = new RegExp(query, "i");
    return this.#colors.values()
      .filter(color => {
        const siteColorName = color.names[siteName];
        return siteColorName && siteColorName.match(queryRegex)
      })
      .map(color => {
        return color.names[siteName];
      })
      .toArray()
      .sort()
      .slice(0, maximumResults);
  }
}
