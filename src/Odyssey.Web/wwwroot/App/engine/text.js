import { createSurface } from './canvas.js';
import { getGlyph, normalizeText } from './font.js';

export const lineHeight = 11; //2 rows for marks above capitals, 8 glyph rows and 1 row of spacing

const glyphTop = 2,
	letterSpacing = 1,
	maxCacheSize = 300,
	outlineOffsets = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];

export function measureText(text) {
	let width = 0;
	for (const ch of normalizeText(text))
		width += getGlyph(ch).width + letterSpacing;

	return Math.max(0, width - letterSpacing);
}

export function wrapText(text, maxWidth) {
	const lines = [];
	for (const paragraph of normalizeText(text).split('\n')) {
		let line = '';
		for (const word of paragraph.split(' ')) {
			const candidate = line ? `${line} ${word}` : word;
			if (line && measureText(candidate) > maxWidth) {
				lines.push(line);
				line = word;
			}
			else
				line = candidate;
		}
		lines.push(line);
	}
	return lines;
}

//renders text with the bitmap font into cached pictures, outlined in the LucasArts manner
export class TextRenderer {
	constructor(renderScale) {
		this.renderScale = renderScale;
		this._cache = new Map();
	}

	render(text, { color = '#fff', outline = '#000', maxWidth = 0, align = 'center' } = {}) {
		const key = [text, color, outline, maxWidth, align].join('|');
		let picture = this._cache.get(key);
		if (!picture) {
			if (this._cache.size >= maxCacheSize)
				this._cache.clear();

			picture = this._draw(text, color, outline, maxWidth, align);
			this._cache.set(key, picture);
		}
		return picture;
	}

	//x is the center of the text unless options.align is 'left'
	draw(context, text, x, y, options = {}) {
		const picture = this.render(text, options),
			scale = options.scale ?? 1,
			width = picture.width * scale,
			left = options.align === 'left' ? x : x - Math.floor(width / 2);

		context.drawImage(picture.source, Math.round(left), Math.round(y), width, picture.height * scale);
		return picture;
	}

	_draw(text, color, outline, maxWidth, align) {
		const lines = maxWidth ? wrapText(text, maxWidth) : normalizeText(text).split('\n'),
			widths = lines.map(measureText),
			border = outline ? 1 : 0,
			width = Math.max(1, ...widths) + border * 2,
			height = lines.length * lineHeight + border * 2,
			{ canvas, context } = createSurface(width, height, this.renderScale);

		const paint = (fill, dx, dy) => {
			context.fillStyle = fill;
			lines.forEach((line, index) => {
				const y = border + dy + index * lineHeight + glyphTop;
				let x = border + dx + (align === 'center' ? Math.floor((width - border * 2 - widths[index]) / 2) : 0);
				for (const ch of line) {
					const glyph = getGlyph(ch);
					for (const [px, py] of glyph.pixels)
						context.fillRect(x + px, y + py, 1, 1);

					x += glyph.width + letterSpacing;
				}
			});
		};

		if (outline)
			outlineOffsets.forEach(([dx, dy]) => paint(outline, dx, dy));

		paint(color, 0, 0);
		return { source: canvas, width, height };
	}
}
