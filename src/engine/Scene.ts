import { SingleObjectScene } from "./SingleObjectScene";
import type { TextureAtlas } from "./TextureAtlas";

class Scene {
  public readonly maxObjectsPerScene: Readonly<number[]>;
  public readonly maxScenes: number;
  /** do not reorder */
  public readonly scenes: SingleObjectScene[];
  public readonly textureAtlas: TextureAtlas;

  public sceneBuffer!: GPUBuffer;
  public textureAtlasDataBuffer!: GPUBuffer;

  private initialised: boolean;
  constructor(
    textureAtlas: TextureAtlas,
    maxScenes: number,
    maxObjectsPerScene: number[] | number = 128
  ) {
    this.textureAtlas = textureAtlas;
    this.maxObjectsPerScene =
      typeof maxObjectsPerScene === "number"
        ? new Array(maxScenes).fill(0).map(() => maxObjectsPerScene)
        : Array.from(
            { length: maxScenes },
            (_, i) => maxObjectsPerScene[i] ?? 128
          );
    this.maxScenes = maxScenes;
    this.scenes = [];

    const originalPush = this.scenes.push.bind(this.scenes);
    this.scenes.push = (...items) => {
      for (const item of items) {
        if (this.scenes.length >= this.maxScenes) {
          console.warn(
            "Maximum number of scenes reached. New scenes not added"
          );
          break;
        }

        originalPush(item);
      }

      return this.scenes.length;
    };

    this.initialised = false;
  }

  public initialise(device: GPUDevice): void {
    if (this.initialised) {
      return;
    }

    this.sceneBuffer = device.createBuffer({
      label: "Scene Buffer",
      size:
        this.maxScenes *
        this.maxObjectsPerScene.reduce(
          (total, maxObjects) => total + maxObjects,
          0
        ) *
        SingleObjectScene.objectByteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    this.textureAtlasDataBuffer = device.createBuffer({
      label: "Texture Atlas Data Buffer",
      size: 4 * 4,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    device.queue.writeBuffer(
      this.textureAtlasDataBuffer,
      0,
      new Uint32Array([
        this.textureAtlas.texture.width,
        this.textureAtlas.texture.height,
        this.textureAtlas.columns,
        this.textureAtlas.rows,
      ])
    );

    for (const scene of this.scenes) {
      scene.initialise(this, device);
      scene.updateBuffer();
    }

    this.initialised = true;
  }
}

export { Scene };
