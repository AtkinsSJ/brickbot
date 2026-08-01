import {getJSON} from "../utils.js";
import {Color} from "./Data/Color.js";

export class ColorManager {
  static #instance;

  #colors = {};

  constructor(colors) {
    this.#colors = colors;
  }

  static async load(rebrickableKey) {
    const colors = {};

    console.log("Loading colors...");

    try {
      let requestUrl = "https://rebrickable.com/api/v3/lego/colors/?page=1";
      while (requestUrl) {
        const json = await getJSON(`${requestUrl}&key=${rebrickableKey}`);
        console.log(`...got ${json.results.length}`);
        requestUrl = json.next;

        for (const result of json.results) {
          colors[result.id] = Color.fromRebrickableJSON(result);
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
    return Object.keys(this.#colors).length;
  }

  random() {
    const keys = Object.keys(this.#colors);
    return this.#colors[keys[Math.floor(Math.random() * keys.length)]];
  }

  getByName(siteName, name) {
    // FIXME: We could really use an index by site!
    for (let color of Object.values(this.#colors)) {
      const nameForSite = color.names[siteName];
      if (nameForSite && nameForSite.localeCompare(name, undefined, { sensitivity: "base" }) === 0) {
        return color;
      }
    }

    return null;
  }

  getByID(siteName, id) {
    // FIXME: We could really use an index by site!
    for (let color of Object.values(this.#colors)) {
      if (color.ids[siteName] === id)
        return color;
    }
    return null;
  }
}
