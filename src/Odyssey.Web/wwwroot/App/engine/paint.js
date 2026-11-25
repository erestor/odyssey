import { toPoints } from './geometry.js';

//helpers for painting placeholder art in code: crisp scanline shapes and ordered dithering in the spirit of VGA-era pixel art.
//all coordinates are whole logical pixels.
const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

export function rect(context, x, y, width, height, color) {
	context.fillStyle = color;
	context.fillRect(x, y, width, height);
}

//fills the area with color and mixes in the given amount (0-1) of ditherColor
export function dither(context, x, y, width, height, color, ditherColor, amount) {
	rect(context, x, y, width, height, color);
	ditherPixels(context, x, y, width, height, ditherColor, amount);
}

//vertical gradient through the colors with dithered transitions between neighbours
export function gradient(context, x, y, width, height, colors) {
	const segments = colors.length - 1;
	for (let row = 0; row < height; row++) {
		const position = row / Math.max(1, height - 1) * segments,
			index = Math.min(segments - 1, Math.floor(position));

		dither(context, x, y + row, width, 1, colors[index], colors[index + 1], position - index);
	}
}

//fills a polygon given as a flat coordinate list
export function polygon(context, flat, color, ditherColor = null, amount = 0) {
	const points = toPoints(flat),
		ys = points.map(point => point.y),
		top = Math.floor(Math.min(...ys)),
		bottom = Math.ceil(Math.max(...ys));

	for (let y = top; y < bottom; y++) {
		const scan = y + 0.5,
			crossings = [];

		for (let i = 0; i < points.length; i++) {
			const a = points[i], b = points[(i + 1) % points.length];
			if ((a.y <= scan) !== (b.y <= scan))
				crossings.push(a.x + (scan - a.y) / (b.y - a.y) * (b.x - a.x));
		}

		crossings.sort((p, q) => p - q);
		for (let i = 0; i + 1 < crossings.length; i += 2) {
			const left = Math.round(crossings[i]), right = Math.round(crossings[i + 1]);
			if (right > left)
				span(context, left, y, right - left, color, ditherColor, amount);
		}
	}
}

export function ellipse(context, cx, cy, rx, ry, color, ditherColor = null, amount = 0) {
	for (let y = -ry; y < ry; y++) {
		const t = (y + 0.5) / ry,
			half = Math.round(rx * Math.sqrt(1 - t * t));

		if (half > 0)
			span(context, cx - half, cy + y, half * 2, color, ditherColor, amount);
	}
}

//scatters single pixels with a seeded generator, so the pattern is identical every time the picture is painted
export function speckle(context, x, y, width, height, color, count, seed = 1) {
	const random = seeded(seed);
	context.fillStyle = color;
	for (let i = 0; i < count; i++)
		context.fillRect(x + Math.floor(random() * width), y + Math.floor(random() * height), 1, 1);
}

export function seeded(seed) {
	let state = seed >>> 0;
	return () => {
		state = (state + 0x6d2b79f5) >>> 0;
		let t = state;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function span(context, x, y, width, color, ditherColor, amount) {
	rect(context, x, y, width, 1, color);
	if (ditherColor)
		ditherPixels(context, x, y, width, 1, ditherColor, amount);
}

function ditherPixels(context, x, y, width, height, color, amount) {
	const threshold = amount * 16;
	if (threshold <= 0)
		return;

	context.fillStyle = color;
	for (let row = y; row < y + height; row++) {
		for (let column = x; column < x + width; column++) {
			if (bayer[(row & 3) * 4 + (column & 3)] < threshold)
				context.fillRect(column, row, 1, 1);
		}
	}
}
