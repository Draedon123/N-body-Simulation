import { Texture } from "./Texture";

class TextureAtlas extends Texture {
  public readonly columns: number;
  public readonly rows: number;

  constructor(
    columns: number,
    rows: number,
    label: string,
    texture: GPUTexture
  ) {
    super(label, texture);

    this.columns = columns;
    this.rows = rows;
  }

  /** assumes textures have the same dimensions */
  public static override async create(
    device: GPUDevice,
    label: string,
    ...urls: string[]
  ): Promise<TextureAtlas> {
    const sources = await Texture.toBitmap(urls);

    const maxSize = device.limits.maxTextureDimension2D;
    const columns = Math.min(
      Math.floor(maxSize / sources[0].width),
      sources.length
    );
    const rows = Math.ceil(sources.length / columns);

    const textureWidth = columns * sources[0].width;
    const textureHeight = rows * sources[0].height;

    const dx = textureWidth / columns;
    const dy = textureHeight / rows;

    if (textureWidth > maxSize || textureHeight > maxSize) {
      throw new Error(
        `Texture atlas size exceeds maximum dimensions (${maxSize}x${maxSize}px)`
      );
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

    canvas.width = textureWidth;
    canvas.height = textureHeight;

    for (let i = 0; i < sources.length; i++) {
      const source = sources[i];

      const column = i % columns;
      const row = Math.floor(i / columns);

      const x = column * dx;
      const y = row * dy;

      ctx.drawImage(source, x, y);
    }

    return new TextureAtlas(
      columns,
      rows,
      label,
      Texture.fromSources(
        device,
        label,
        [canvas],
        textureWidth,
        textureHeight
      ).texture
    );
  }
}

export { TextureAtlas };
