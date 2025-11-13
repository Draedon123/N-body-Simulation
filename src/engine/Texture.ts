import { resolveBasePath } from "../utils/resolveBasePath";

class Texture {
  public readonly label: string;
  public readonly texture: GPUTexture;
  constructor(label: string, texture: GPUTexture) {
    this.label = label;
    this.texture = texture;
  }

  private static fromSources(
    device: GPUDevice,
    label: string,
    sources: GPUCopyExternalImageSource[],
    width: number,
    height: number
  ): Texture {
    const texture = device.createTexture({
      label,
      format: "rgba8unorm",
      size: [width, height, sources.length],
      usage:
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.RENDER_ATTACHMENT,
    });

    for (let layer = 0; layer < sources.length; layer++) {
      const source = sources[layer];

      device.queue.copyExternalImageToTexture(
        {
          source: source,
        },
        {
          texture,
          origin: [0, 0, layer],
        },
        {
          width: width,
          height: height,
        }
      );
    }

    return new Texture(label, texture);
  }

  private static async toBitmap(urls: string[]): Promise<ImageBitmap[]> {
    const requests = urls.map(
      async (url) => await (await fetch(resolveBasePath(url))).blob()
    );
    const blobs = await Promise.all(requests);
    const bitmaps = await Promise.all(
      blobs.map((blob) => createImageBitmap(blob))
    );

    return bitmaps;
  }

  public static async create(
    device: GPUDevice,
    label: string,
    ...urls: string[]
  ): Promise<Texture> {
    const sources = await Texture.toBitmap(urls);

    return Texture.fromSources(
      device,
      label,
      sources,
      sources[0].width,
      sources[1].height
    );
  }

  /** assumes textures have the same dimensions */
  public static async createTextureAtlas(
    device: GPUDevice,
    label: string,
    ...urls: string[]
  ): Promise<Texture> {
    const sources = await Texture.toBitmap(urls);

    const maxSize = device.limits.maxTextureDimension2D;
    const columns = Math.min(
      Math.floor(maxSize / sources[0].width),
      sources.length
    );
    const rows = Math.ceil(sources.length / columns);
    const textureWidth = columns * sources[0].width;
    const textureHeight = rows * sources[0].height;

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

      const x = (column * textureWidth) / i;
      const y = (row * textureHeight) / i;

      ctx.drawImage(source, x, y);
    }

    return Texture.fromSources(
      device,
      label,
      [canvas],
      textureWidth,
      textureHeight
    );
  }

  public static async createCubemap(
    device: GPUDevice,
    label: string,
    textureDirectory: string
  ): Promise<Texture> {
    return await Texture.create(
      device,
      label,
      `${textureDirectory}/px.png`,
      `${textureDirectory}/nx.png`,
      `${textureDirectory}/py.png`,
      `${textureDirectory}/ny.png`,
      `${textureDirectory}/pz.png`,
      `${textureDirectory}/nz.png`
    );
  }
}

export { Texture };
