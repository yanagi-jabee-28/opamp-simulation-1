const components = [
	'capacitor2.svg',
	'inductor2.svg',
	'nmos-simple2.svg',
	'pmos-simple2.svg',
	'resistor2.svg'
];

const componentPalette = document.getElementById('component-palette')!;
const circuitCanvas = document.getElementById('circuit-canvas')!;

components.forEach(componentName => {
	const componentElement = document.createElement('div');
	componentElement.classList.add('component');
	componentElement.draggable = true;

	const img = document.createElement('img');
	img.src = `svg-components/${componentName}`;
	img.alt = componentName;
	componentElement.appendChild(img);

	componentElement.addEventListener('dragstart', (event) => {
		event.dataTransfer!.setData('text/plain', componentName);
	});

	componentPalette.appendChild(componentElement);
});

circuitCanvas.addEventListener('dragover', (event) => {
	event.preventDefault();
});

circuitCanvas.addEventListener('drop', (event) => {
	event.preventDefault();
	const componentName = event.dataTransfer!.getData('text/plain');
	const newComponent = document.createElement('img');
	newComponent.src = `svg-components/${componentName}`;
	newComponent.classList.add('component');
	newComponent.style.position = 'absolute';

	const canvasRect = circuitCanvas.getBoundingClientRect();
	const x = event.clientX - canvasRect.left;
	const y = event.clientY - canvasRect.top;

	const gridSize = 20;
	const snappedX = Math.round(x / gridSize) * gridSize;
	const snappedY = Math.round(y / gridSize) * gridSize;

	newComponent.style.left = `${snappedX}px`;
	newComponent.style.top = `${snappedY + 2}px`;

	circuitCanvas.appendChild(newComponent);
});
