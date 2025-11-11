import { SingleObjectScene } from "./SingleObjectScene";
import { PhysicsShader } from "./PhysicsShader";
import { Sphere } from "./meshes/Sphere";
import { Scene } from "./Scene";
import { Model } from "./meshes/Model";
import { Vector3 } from "../utils/Vector3";

type NBodyOptions = {
  bodyCount: number;
  bodyRadius: number;
  bodySpawnRadius: number;
};

class NBodySimulation {
  public readonly scene: Scene;
  public readonly bodies: SingleObjectScene;
  public readonly bodyCount: number;

  private readonly bodyRadius: number;
  private readonly bodySpawnRadius: number;

  private initialised: boolean;

  public physicsShader!: PhysicsShader;
  constructor(options: Partial<NBodyOptions> = {}) {
    this.initialised = false;

    this.bodyCount = options.bodyCount ?? 10;
    this.bodyRadius = options.bodyRadius ?? 1;
    this.bodySpawnRadius =
      options.bodySpawnRadius ?? 3 * this.bodyRadius * this.bodyCount;
    this.bodies = new SingleObjectScene(new Sphere(9, this.bodyRadius));

    this.scene = new Scene(1, this.bodyCount);

    this.spawnBodies();
  }

  private spawnBodies(): void {
    const bodies: Model[] = [];

    for (let i = 0; i < this.bodyCount; i++) {
      let position = Vector3.random(
        -this.bodySpawnRadius,
        this.bodySpawnRadius
      );

      while (
        bodies.some(
          (body) =>
            Vector3.subtract(body.position, position).magnitude <=
            2 * this.bodyRadius
        )
      ) {
        position = Vector3.random(-this.bodySpawnRadius, this.bodySpawnRadius);
      }

      bodies.push(new Model({ position }));
    }

    this.bodies.addObjects(bodies);
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

    this.scene.initialise(device);
    this.bodies.initialise(this.scene, device);
    this.physicsShader = await PhysicsShader.create(device, this);

    this.initialised = true;
  }
}

export { NBodySimulation };
export type { NBodyOptions };
