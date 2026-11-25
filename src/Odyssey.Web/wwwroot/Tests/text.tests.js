import { getGlyph, normalizeText } from '../App/engine/font.js';
import { measureText, wrapText } from '../App/engine/text.js';

describe('font', () => {
	it('getGlyph trims glyphs to their used columns', () => {
		expect(getGlyph('A').width).toBe(5);
		expect(getGlyph('.').width).toBe(1);
	});

	it('getGlyph puts lowercase marks just above the x-height', () => {
		const glyph = getGlyph('č');
		expect(glyph.width).toBe(getGlyph('c').width);
		expect(Math.min(...glyph.pixels.map(([, y]) => y))).toBe(0);
	});

	it('getGlyph puts capital marks above the cap height', () => {
		expect(Math.min(...getGlyph('Ř').pixels.map(([, y]) => y))).toBe(-2);
	});

	it('getGlyph turns a caron on a letter with an ascender into an apostrophe', () => {
		expect(getGlyph('ď').width).toBe(getGlyph('d').width + 2);
	});

	it('getGlyph uses a dotless base for an accented i', () => {
		const pixels = getGlyph('í').pixels;
		expect(pixels.filter(([, y]) => y === 1).length).toBe(1);
	});

	it('getGlyph falls back to a question mark', () => {
		expect(getGlyph('中')).toEqual(getGlyph('?'));
	});

	it('normalizeText replaces typographic punctuation', () => {
		expect(normalizeText('“Wait…”')).toBe('"Wait..."');
	});
});

describe('text', () => {
	it('measureText adds one pixel between glyphs', () => {
		expect(measureText('AA')).toBe(11);
		expect(measureText('')).toBe(0);
	});

	it('wrapText breaks lines at spaces within the width', () => {
		const lines = wrapText('one two three four five six', 40);
		expect(lines.length).toBeGreaterThan(1);
		lines.forEach(line => expect(measureText(line)).toBeLessThanOrEqual(40));
		expect(lines.join(' ')).toBe('one two three four five six');
	});

	it('wrapText keeps explicit line breaks', () => {
		expect(wrapText('a\nb', 300)).toEqual(['a', 'b']);
	});
});
