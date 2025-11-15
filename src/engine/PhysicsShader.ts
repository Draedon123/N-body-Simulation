import { BufferWriter } from "../utils/BufferWriter";
import { GPUTimer } from "../utils/GPUTimer";
import { resolveBasePath } from "../utils/resolveBasePath";
import { roundUp } from "../utils/roundUp";
import { Body } from "./Body";
import type { NBodySimulation } from "./NBodySimulation";
import { Shader } from "./Shader";

class PhysicsShader {
  private static readonly SETTINGS_BYTE_LENGTH: number = roundUp(3 * 4, 16);

  public restitution: number;

  private readonly simulation: NBodySimulation;
  private readonly device: GPUDevice;
  private readonly gpuTimer: GPUTimer;

  private readonly settingsBuffer: GPUBuffer;
  private readonly bodyStatesBuffer: GPUBuffer;

  private readonly bindGroup: GPUBindGroup;
  private readonly computePipeline: GPUComputePipeline;

  constructor(shader: Shader, device: GPUDevice, simulation: NBodySimulation) {
    this.device = device;
    this.simulation = simulation;

    const frameTimeElement = document.getElementById(
      "computeFrameTime"
    ) as HTMLElement;

    this.gpuTimer = new GPUTimer(device, (time) => {
      const microseconds = time / 1e3;
      const milliseconds = time / 1e6;
      const useMilliseconds = milliseconds > 1;
      const displayTime = (
        useMilliseconds ? milliseconds : microseconds
      ).toFixed(2);
      const prefix = useMilliseconds ? "ms" : "μs";

      const frameTime = displayTime + prefix;

      frameTimeElement.textContent = frameTime;
    });

    this.restitution = 1;

    this.settingsBuffer = device.createBuffer({
      label: "Physics Shader Settings Buffer",
      size: PhysicsShader.SETTINGS_BYTE_LENGTH,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.bodyStatesBuffer = device.createBuffer({
      label: "Physics Shader Body States Buffer",
      size: this.simulation.maxBodies * Body.BYTE_LENGTH,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    const bodyStates = new BufferWriter(
      this.simulation.maxBodies * Body.BYTE_LENGTH
    );

    for (const body of this.simulation.bodies) {
      body.writeToBuffer(bodyStates);
    }

    this.device.queue.writeBuffer(this.bodyStatesBuffer, 0, bodyStates.buffer);

    const bindGroupLayout = device.createBindGroupLayout({
      label: "Physics Shader Bind Group Layout",
      entries: [
        {
          binding: 0,
          buffer: { type: "uniform" },
          visibility: GPUShaderStage.COMPUTE,
        },
        {
          binding: 1,
          buffer: { type: "storage" },
          visibility: GPUShaderStage.COMPUTE,
        },
        {
          binding: 2,
          buffer: { type: "storage" },
          visibility: GPUShaderStage.COMPUTE,
        },
      ],
    });

    this.bindGroup = device.createBindGroup({
      label: "Physics Shader Bind Group",
      layout: bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: { buffer: this.settingsBuffer },
        },
        {
          binding: 1,
          resource: { buffer: this.simulation.scene.sceneBuffer },
        },
        {
          binding: 2,
          resource: { buffer: this.bodyStatesBuffer },
        },
      ],
    });

    const pipelineLayout = device.createPipelineLayout({
      label: "Physics Shader Compute Pipeline Layout",
      bindGroupLayouts: [bindGroupLayout],
    });

    this.computePipeline = device.createComputePipeline({
      label: "Physics Shader Compute Pipeline",
      layout: pipelineLayout,
      compute: {
        module: shader.shader,
      },
    });
  }

  private updateSettings(deltaTimeMs: number): void {
    const settings = new BufferWriter(PhysicsShader.SETTINGS_BYTE_LENGTH);

    settings.writeUint32(this.simulation.bodyCount);
    settings.writeFloat32(deltaTimeMs);
    settings.writeFloat32(this.restitution);

    this.device.queue.writeBuffer(this.settingsBuffer, 0, settings.buffer);
  }

  public run(deltaTimeMs: number): void {
    this.updateSettings(deltaTimeMs);

    const commandEncoder = this.device.createCommandEncoder();
    const computePass = this.gpuTimer.beginComputePass(commandEncoder, {
      label: "Physics Shader Compute Pass",
    });

    computePass.setBindGroup(0, this.bindGroup);
    computePass.setPipeline(this.computePipeline);
    computePass.dispatchWorkgroups(
      Math.ceil(this.simulation.bodyCount / 64),
      1,
      1
    );
    computePass.end();

    this.device.queue.submit([commandEncoder.finish()]);
  }

  public static async create(
    device: GPUDevice,
    simulation: NBodySimulation
  ): Promise<PhysicsShader> {
    const shaderModule = await Shader.fetch(
      device,
      resolveBasePath("shaders/physics.wgsl")
    );
    return new PhysicsShader(shaderModule, device, simulation);
  }
}

export { PhysicsShader };
