import type { NBodySimulation } from "./engine/NBodySimulation";

function initialiseConfigPanel(simulation: NBodySimulation): void {
  initialiseChevron();

  initialiseSlider("bodyCount", (count) => {
    simulation.bodyCount = count;
  });
}

function initialiseChevron(): void {
  const chevron = document.getElementById("chevron");
  const panel = document.getElementById("content");

  if (chevron === null) {
    throw new Error("Could not find chevron element");
  }

  if (panel === null) {
    throw new Error("Could not find info panel");
  }

  chevron.addEventListener("click", () => {
    chevron.classList.toggle("collapsed");
    panel.classList.toggle("collapsed");
  });
}

function initialiseSlider(
  id: string,
  onChange: (value: number) => unknown,
  processValue: (value: number) => number = (value) => value,
  processText: (value: number) => string = (value) => `(${value.toString()})`
): void {
  const sliderID = `${id}Input`;
  const valueDisplayID = `${id}Value`;
  const slider = document.getElementById(sliderID) as HTMLInputElement | null;
  const valueDisplay = document.getElementById(valueDisplayID);

  if (slider === null) {
    throw new Error(`Could not find slider with id ${sliderID}`);
  }

  if (valueDisplay === null) {
    throw new Error(`Could not find value display with id ${valueDisplay}`);
  }

  slider.addEventListener("change", () => {
    const value = processValue(parseFloat(slider.value));
    valueDisplay.textContent = processText(value);

    onChange(value);
  });
}

export { initialiseConfigPanel };
