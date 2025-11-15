import { SingleObjectScene } from "./SingleObjectScene";
import { PhysicsShader } from "./PhysicsShader";
import { Sphere } from "./meshes/Sphere";
import { Scene } from "./Scene";
import { Vector3 } from "../utils/Vector3";
import { Body } from "./Body";
import { TextureArray } from "./TextureArray";
import { clamp } from "../utils/clamp";

type NBodyOptions = {
  bodyCount: number;
  bodyRadius: number;
  bodySpawnRadius: number;
  maxBodies: number;
};

class NBodySimulation {
  public scene!: Scene;

  public readonly bodies: Body[];
  public readonly maxBodies: number;

  private readonly bodyScene: SingleObjectScene;
  private readonly bodyRadius: number;
  private readonly bodySpawnRadius: number;

  private _bodyCount: number;
  private initialised: boolean;

  public physicsShader!: PhysicsShader;
  constructor(options: Partial<NBodyOptions> = {}) {
    this.initialised = false;

    this.bodies = [];
    this.bodyRadius = options.bodyRadius ?? 1;
    this.maxBodies = options.maxBodies ?? 128;

    this.bodyScene = new SingleObjectScene(new Sphere(20, this.bodyRadius));
    this._bodyCount = 0;

    const bodyCount = options.bodyCount ?? 10;

    this.bodySpawnRadius =
      options.bodySpawnRadius ?? 1.5 * this.bodyRadius * bodyCount;
    this.bodyCount = bodyCount;
  }

  public get bodyCount(): number {
    return this._bodyCount;
  }

  public set bodyCount(count: number) {
    count = clamp(count, 0, this.maxBodies);

    const delta = count - this.bodyCount;

    if (delta === 0) {
      return;
    }

    if (delta > 0) {
      for (let i = 0; i < delta; i++) {
        const position = Vector3.random(
          -this.bodySpawnRadius,
          this.bodySpawnRadius
        );
        const velocity = Vector3.random(-1, 1).scale(5 * this.bodyRadius);
        const scale = 1 + 0.75 * Math.random();
        const mass = 1e13 * scale;
        const radius = this.bodyRadius * scale;
        const body = new Body(position, radius, mass, velocity);

        body.textureID = this.scene?.textureArray.random() ?? 0;
        this.bodies.push(body);
      }

      this.bodyScene.addObjects(this.bodies.slice(this.bodyCount));
      this.bodyScene.updateBuffer(delta);
    } else {
      const deleted = this.bodies.splice(count, -delta);
      this.bodyScene.removeObjects(deleted);
    }

    this._bodyCount = count;
  }

  public tick(deltaTimeMs: number): void {
    if (!this.initialised) {
      return;
    }

    this.physicsShader.run(deltaTimeMs);
  }

  public async initialise(device: GPUDevice): Promise<void> {
    if (this.initialised) {
      return;
    }

    const textureArray = await TextureArray.create(
      device,
      "N-body Simulation Texture Array",
      ...[
        "Alpine",
        "Gaseous1",
        "Gaseous2",
        "Gaseous3",
        "Gaseous4",
        "Icy",
        "Martian",
        "Savannah",
        "Swamp",
        "Terrestrial1",
        "Terrestrial2",
        "Terrestrial3",
        "Terrestrial4",
        "Tropical",
        "Venusian",
        "Volcanic",
      ].map((name) => `textures/${name}`)
    );
    this.scene = new Scene(textureArray, 1, [this.maxBodies]);

    this.scene.initialise(device);
    this.physicsShader = await PhysicsShader.create(device, this);

    for (const body of this.bodies) {
      body.textureID = textureArray.random();
    }

    this.bodyScene.initialise(this.scene, device);

    this.initialised = true;
  }
}

export { NBodySimulation };
export type { NBodyOptions };
