import { SingleObjectScene } from "./SingleObjectScene";
import { PhysicsShader } from "./PhysicsShader";
import { Sphere } from "./meshes/Sphere";
import { Scene } from "./Scene";
import { Model } from "./meshes/Model";

type NBodyOptions = {
  bodyCount: number;
};

class NBodySimulation {
  public readonly scene: Scene;
  public readonly bodies: SingleObjectScene;
  public readonly bodyCount: number;

  private initialised: boolean;

  public physicsShader!: PhysicsShader;
  constructor(options: Partial<NBodyOptions> = {}) {
    this.initialised = false;

    this.bodyCount = options.bodyCount ?? 10;
    this.bodies = new SingleObjectScene(new Sphere(9, 1));

    this.scene = new Scene(1, this.bodyCount);

    this.bodies.addObjects([new Model({})]);
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
