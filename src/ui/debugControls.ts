/** Small form controls for the developer panel (plain DOM; developer-only, so labels aren't in strings.ts). */

export function select<T extends string>(
  legend: string,
  options: readonly (readonly [T, string])[],
  onPick: (value: T) => void,
): { element: HTMLLabelElement; set(value: T): void } {
  const element = document.createElement('label');
  const input = document.createElement('select');
  for (const [value, text] of options) input.append(new Option(text, value));
  input.addEventListener('change', () => {
    const picked = options.find(([value]) => value === input.value);
    if (picked) onPick(picked[0]);
  });
  element.append(legend, input);
  return {
    element,
    set(value) {
      input.value = value;
    },
  };
}

export function checkbox(
  text: string,
  onToggle: (on: boolean) => void,
): { element: HTMLLabelElement; set(on: boolean): void } {
  const input = Object.assign(document.createElement('input'), { type: 'checkbox' });
  input.addEventListener('change', () => {
    onToggle(input.checked);
  });
  const element = document.createElement('label');
  element.append(input, text);
  return {
    element,
    set(on) {
      input.checked = on;
    },
  };
}

export function radioGroup<T extends string>(
  legend: string,
  name: string,
  options: readonly (readonly [T, string])[],
  onPick: (value: T) => void,
): { element: HTMLFieldSetElement; set(value: T): void } {
  const element = document.createElement('fieldset');
  element.append(Object.assign(document.createElement('legend'), { textContent: legend }));
  const inputs = options.map(([value, text]) => {
    const input = Object.assign(document.createElement('input'), { type: 'radio', name, value });
    input.addEventListener('change', () => {
      if (input.checked) onPick(value);
    });
    const label = document.createElement('label');
    label.append(input, text);
    element.append(label);
    return input;
  });
  return {
    element,
    set(value) {
      for (const input of inputs) input.checked = input.value === value;
    },
  };
}
