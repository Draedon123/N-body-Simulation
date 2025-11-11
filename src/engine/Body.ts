import type { BufferWriter } from "../utils/BufferWriter";
import { Vector3 } from "../utils/Vector3";
import { Model } from "./meshes/Model";

class Body extends Model {
  public static readonly BYTE_LENGTH: number = 8 * 4;
  constructor(position: Vector3, radius: number) {
    super({
      position,
      scale: new Vector3(radius, radius, radius),
    });
  }

  public writeToBuffer(buffer: BufferWriter, mass: number): void {
    // skip velocity and acceleration
    buffer.pad(7 * 4);

    buffer.writeFloat32(mass);
  }
}

export { Body };
