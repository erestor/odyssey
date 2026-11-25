export function createCanvas(width, height) {
	const canvas = document.createElement('canvas');
	canvas.width = Math.max(1, Math.ceil(width));
	canvas.height = Math.max(1, Math.ceil(height));
	return canvas;
}

//creates an offscreen canvas whose context draws in logical pixels
export function createSurface(width, height, renderScale) {
	const canvas = createCanvas(width * renderScale, height * renderScale),
		context = canvas.getContext('2d');

	context.imageSmoothingEnabled = false;
	context.scale(renderScale, renderScale);
	return { canvas, context };
}

export function clamp(value, min, max) {
	return Math.min(max, Math.max(min, value));
}
