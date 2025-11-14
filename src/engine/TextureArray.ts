import { Texture } from "./Texture";

/** cubemap texture array */
class TextureArray extends Texture {
  public readonly textureCount: number;

  constructor(texureCount: number, label: string, texture: GPUTexture) {
    super(label, texture);

    this.textureCount = texureCount;
  }

  public random(): number {
    return Math.floor(Math.random() * this.textureCount);
  }

  /** assumes textures have the same dimensions */
  public static override async create(
    device: GPUDevice,
    label: string,
    ...directories: string[]
  ): Promise<TextureArray> {
    const sources = await Texture.toBitmap(
      directories
        .map((directory) => [
          `${directory}/px.png`,
          `${directory}/nx.png`,
          `${directory}/py.png`,
          `${directory}/ny.png`,
          `${directory}/pz.png`,
          `${directory}/nz.png`,
        ])
        .flat()
    );

    return new TextureArray(
      directories.length,
      label,
      Texture.fromSources(
        device,
        label,
        sources,
        sources[0].width,
        sources[0].height
      ).texture
    );
  }
}

export { TextureArray };
