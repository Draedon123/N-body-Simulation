import { resolveBasePath } from "../utils/resolveBasePath";

class Texture {
  public readonly label: string;
  public readonly texture: GPUTexture;
  constructor(label: string, texture: GPUTexture) {
    this.label = label;
    this.texture = texture;
  }

  protected static fromSources(
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

  protected static toBitmap(urls: string[]): Promise<ImageBitmap[]> {
    const requests = urls.map(
      async (url) =>
        await createImageBitmap(
          await (await fetch(resolveBasePath(url))).blob()
        )
    );

    return Promise.all(requests);
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

  public static createCubemap(
    device: GPUDevice,
    label: string,
    textureDirectory: string
  ): Promise<Texture> {
    return Texture.create(
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
