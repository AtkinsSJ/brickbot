import {getJSON} from "../utils.js";
import {Color} from "./Data/Color.js";

export class ColorManager {
  static #instance;

  #colors; // Map()
  #siteCaches = new Map();

  constructor(colors) {
    this.#colors = colors;

    // Build per-site caches!
    // Each is roughly this format:
    /*
      "SomeSiteName": {
        "ids": Map {
          23: 128, // Site's ID -> Rebrickable's ID
          24: 17,
        },
        "names": Map {
          "cool orange": 128, // Site's name -> Rebrickable's ID
          "black": 0,
        }
      }
     */

    for (let [id, color] of this.#colors) {
      for (let [siteName, siteID] of color.ids) {
        this.ensureSiteCache(siteName).ids.set(siteID, id);
      }
      for (let [siteName, name] of color.names) {
        this.ensureSiteCache(siteName).names.set(name, id);
      }
    }
  }

  ensureSiteCache(siteName) {
    // TODO: getOrInsertComputed() would be better here, but that's not available until Node v26.
    const existingCache = this.#siteCaches.get(siteName);
    if (existingCache)
      return existingCache;

    const siteCache = {
      ids: new Map(),
      names: new Map(),
    };
    this.#siteCaches.set(siteName, siteCache);
    return siteCache;
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
    const siteColors = this.#siteCaches.get(siteName);
    if (!siteColors)
      return null;

    for (let [colorName, id] of siteColors.names) {
      if (colorName.localeCompare(name, undefined, { sensitivity: "base" }) === 0)
        return this.#colors.get(id);
    }

    return null;
  }

  getByID(siteName, id) {
    const siteColors = this.#siteCaches.get(siteName);
    if (!siteColors)
      return null;

    const rebrickableID = siteColors.ids.get(id);
    if (rebrickableID)
      return this.#colors.get(rebrickableID);
    return null;
  }

  // NB: Discord limits autocomplete results to 25 entries
  findNameMatches(siteName, query, maximumResults = 25) {
    const siteColors = this.#siteCaches.get(siteName);
    if (!siteColors)
      return null;

    const queryRegex = new RegExp(query, "i");

    return siteColors.names.keys()
      .filter(name => name.match(queryRegex))
      .toArray()
      .sort()
      .slice(0, maximumResults);
  }
}
