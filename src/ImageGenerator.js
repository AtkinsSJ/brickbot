import * as fsPromises from "node:fs/promises";
import sharp from "sharp";

export class ImageGenerator {
  static #instance;

  #solidColorSVG;
  #transparentColorSVG;

  constructor(solidColorSVG, transparentColorSVG) {
    this.#solidColorSVG = solidColorSVG;
    this.#transparentColorSVG = transparentColorSVG;
  }

  static async init() {
    const [solidColorSVG, transparentColorSVG] = await Promise.all([
      fsPromises.readFile("data/color.svg", "utf8"),
      fsPromises.readFile("data/color-transparent.svg", "utf8"),
    ]);

    this.#instance = new ImageGenerator(solidColorSVG, transparentColorSVG);
    return this.#instance;
  }

  static get instance() {
    return this.#instance;
  }

  generateColorSwatch(rgb, isTransparent) {
    if (isTransparent) {
      return this.#transparentColorSVG.replaceAll("$COLOR$", `#${rgb}`);
    }
    return this.#solidColorSVG.replaceAll("$COLOR$", `#${rgb}`);
  }

  async generatePNGColorSwatch(rgb, isTransparent) {
    const svg = this.generateColorSwatch(rgb, isTransparent);
    return await sharp(Buffer.from(svg, "utf-8"))
      .toFormat('png')
      .toBuffer();
  }
}
