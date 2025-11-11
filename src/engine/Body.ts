import type { BufferWriter } from "../utils/BufferWriter";
import { Vector3 } from "../utils/Vector3";
import { Model } from "./meshes/Model";

class Body extends Model {
  public static readonly BYTE_LENGTH: number = 4 * 4;

  private readonly mass: number;
  private readonly initialVelocity: Vector3;
  constructor(
    position: Vector3,
    radius: number,
    mass: number,
    initialVelocity: Vector3 = new Vector3(0, 0, 0)
  ) {
    super({
      position,
      scale: new Vector3(radius, radius, radius),
    });

    this.mass = mass;
    this.initialVelocity = initialVelocity;
  }

  public writeToBuffer(buffer: BufferWriter): void {
    buffer.writeVec3f(this.initialVelocity);
    buffer.writeFloat32(this.mass);
  }
}

export { Body };
