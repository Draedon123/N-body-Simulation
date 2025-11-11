import { Renderer } from "./engine/Renderer";
import { Loop } from "./utils/Loop";
import { initialiseConfigPanel } from "./configPanel";
import { NBodySimulation } from "./engine/NBodySimulation";
import { Vector3 } from "./utils/Vector3";

async function main(): Promise<void> {
  const message = document.getElementById("message") as HTMLElement;

  message.style.zIndex = "2";

  const canvas = document.getElementById("main") as HTMLCanvasElement;
  const simulation = new NBodySimulation({ bodyCount: 50 });

  const renderer = await Renderer.create(canvas, {
    scene: simulation.scene,
    cameraOptions: {
      mouseSensitivity: 0.1,
      movementSpeed: 0.01,
    },
  });

  await simulation.initialise(renderer.device);
  await renderer.initialise();

  renderer.camera.position = new Vector3(30, 30, 30);
  renderer.camera.lookAt(new Vector3(0, 0, 0));

  initialiseConfigPanel(renderer);

  const loop = new Loop({ wormholeThreshold: 100 });
  loop.addCallback((frame) => {
    renderer.camera.checkKeyboardInputs(frame.deltaTime);
    simulation.tick(frame.deltaTime);
    renderer.render();
  });

  loop.start();
  message.style.zIndex = "unset";

  canvas.addEventListener("click", () => {
    canvas.requestPointerLock();
  });
}

main().catch((error) => {
  const errorMessage =
    error instanceof Error ? error.message : JSON.stringify(error);
  const iframe = document.querySelector("iframe") as HTMLIFrameElement;
  const errorElement = document.getElementById("message") as HTMLElement;

  errorElement.classList.add("error");
  errorElement.textContent = errorMessage;
  iframe.classList.remove("hidden");
  // iframe.src = "https://www.youtube.com/embed/PLACEHOLDER";

  const chevron = document.getElementById("chevron");
  const panel = document.getElementById("content");

  chevron?.classList.add("collapsed");
  panel?.classList.add("collapsed");

  console.error(errorMessage);
});
