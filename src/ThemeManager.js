import {getJSON} from "../utils.js";

export class ThemeManager {
  static #instance;

  #themes = {};

  constructor(themes) {
    this.#themes = themes;
  }

  static async load(rebrickableKey) {
    const themes = {};

    try {
      const json = await getJSON(`https://rebrickable.com/api/v3/lego/themes/?page_size=1000&key=${rebrickableKey}`);
      for (const result of json.results) {
        themes[result.id] = result;
      }

    } catch (error) {
      console.error(`Unable to load theme data: ${error}`);
    }

    this.#instance = new ThemeManager(themes);
    return this.#instance;
  }

  static get instance() {
    return this.#instance;
  }

  get count() {
    return Object.keys(this.#themes).length;
  }

  getByID(id) {
    const theme = this.#themes[id];

    if (!theme) {
      return {
        name: "Unknown",
        url: `https://rebrickable.com/sets/?theme=${id}`
      };
    }

    let name = theme.parent_id
      ? `${this.getByID(theme.parent_id).name} > ${theme.name}`
      : theme.name;

    return {
      name: name,
      url: `https://rebrickable.com/sets/?theme=${id}`
    };
  }

  randomID() {
    const keys = Object.keys(this.#themes);
    return keys[Math.floor(Math.random() * keys.length)];
  }
}
