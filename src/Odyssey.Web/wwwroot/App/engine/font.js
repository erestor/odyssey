//5x8 bitmap font; each glyph is a hex string of rows from top to bottom, bit 0x10 is the leftmost pixel.
//capitals use rows 0-6, the lowercase x-height starts at row 2 and row 7 holds descenders.
//accented letters are composed from a base glyph and a mark, so any Latin diacritic covered by the marks works.
const glyphRows = {
	'0': '0e11131519110e',
	'1': '040c040404040e',
	'2': '0e11010204081f',
	'3': '1f02040201110e',
	'4': '02060a121f0202',
	'5': '1f101e0101110e',
	'6': '0608101e11110e',
	'7': '1f010204080808',
	'8': '0e11110e11110e',
	'9': '0e11110f01020c',
	'A': '0e1111111f1111',
	'B': '1e11111e11111e',
	'C': '0e11101010110e',
	'D': '1c12111111121c',
	'E': '1f10101e10101f',
	'F': '1f10101e101010',
	'G': '0e11101711110f',
	'H': '1111111f111111',
	'I': '0e04040404040e',
	'J': '0702020202120c',
	'K': '11121418141211',
	'L': '1010101010101f',
	'M': '111b1515111111',
	'N': '11111915131111',
	'O': '0e11111111110e',
	'P': '1e11111e101010',
	'Q': '0e11111115120d',
	'R': '1e11111e141211',
	'S': '0f10100e01011e',
	'T': '1f040404040404',
	'U': '1111111111110e',
	'V': '11111111110a04',
	'W': '1111111515150a',
	'X': '11110a040a1111',
	'Y': '1111110a040404',
	'Z': '1f01020408101f',
	'a': '00000e010f110f',
	'b': '1010161911111e',
	'c': '00000e1010110e',
	'd': '01010d1311110f',
	'e': '00000e111f100e',
	'f': '0609081c080808',
	'g': '00000f11110f010e',
	'h': '10101619111111',
	'i': '04000c0404040e',
	'j': '020006020202120c',
	'k': '10101214181412',
	'l': '0c04040404040e',
	'm': '00001a15151111',
	'n': '00001619111111',
	'o': '00000e1111110e',
	'p': '00001e11111e1010',
	'q': '00000f11110f0101',
	'r': '00001619101010',
	's': '00000f100e011e',
	't': '08081c08080906',
	'u': '0000111111130d',
	'v': '00001111110a04',
	'w': '0000111115150a',
	'x': '0000110a040a11',
	'y': '00001111110f010e',
	'z': '00001f0204081f',
	'ı': '00000c0404040e',
	'ȷ': '000006020202120c',
	'!': '04040404040004',
	'"': '0a0a',
	'#': '0a0a1f0a1f0a0a',
	'$': '040f140e051e04',
	'%': '18190204081303',
	'&': '0c12140815120d',
	'\'': '0404',
	'(': '02040808080402',
	')': '08040202020408',
	'*': '0004150e1504',
	'+': '0004041f0404',
	',': '0000000000040408',
	'-': '0000000e',
	'.': '00000000000004',
	'/': '000102040810',
	':': '000004000004',
	';': '0000040000040408',
	'<': '02040810080402',
	'=': '00001f001f',
	'>': '08040201020408',
	'?': '0e110102040004',
	'@': '0e11010d15150e',
	'[': '0e08080808080e',
	'\\': '001008040201',
	']': '0e02020202020e',
	'^': '040a11',
	'_': '000000000000001f',
	'`': '0804',
	'{': '02040408040402',
	'|': '04040404040404',
	'}': '08040402040408',
	'~': '0000081502'
};

const caron = '̌',
	marks = {
		'́': ['.#', '#.'],
		'̀': ['#.', '.#'],
		[caron]: ['#.#', '.#.'],
		'̂': ['.#.', '#.#'],
		'̊': ['##', '##'],
		'̈': ['#.#'],
		'̃': ['.#.#', '#.#.']
	},
	dotless = { 'i': 'ı', 'j': 'ȷ' },
	substitutions = {
		'‘': '\'',
		'’': '\'',
		'“': '"',
		'”': '"',
		'–': '-',
		'—': '-',
		'…': '...',
		' ': ' ',
		' ': ' '
	},
	spaceWidth = 3,
	cache = new Map();

export function normalizeText(text) {
	return String(text)
		.normalize('NFC')
		.replace(/[‘’“”–—…  ]/g, ch => substitutions[ch]);
}

//returns { pixels: [[x, y]], width }; y ranges from -2 (marks above capitals) to 7 (descenders)
export function getGlyph(ch) {
	let glyph = cache.get(ch);
	if (!glyph) {
		glyph = buildGlyph(ch);
		cache.set(ch, glyph);
	}
	return glyph;
}

function buildGlyph(ch) {
	if (ch === ' ')
		return { pixels: [], width: spaceWidth };

	const [base, ...combining] = ch.normalize('NFD'),
		baseChar = combining.length && dotless[base] ? dotless[base] : base,
		glyph = decode(glyphRows[baseChar] ?? glyphRows['?']);

	for (const mark of combining)
		addMark(glyph, mark, base);

	return glyph;
}

function decode(hex) {
	const pixels = [];
	for (let row = 0; row * 2 < hex.length; row++) {
		const bits = parseInt(hex.substr(row * 2, 2), 16);
		for (let column = 0; column < 5; column++) {
			if (bits & (0x10 >> column))
				pixels.push([column, row]);
		}
	}

	const columns = pixels.map(([x]) => x),
		left = Math.min(...columns),
		right = Math.max(...columns);

	return { pixels: pixels.map(([x, y]) => [x - left, y]), width: right - left + 1 };
}

function addMark(glyph, mark, base) {
	const shape = marks[mark];
	if (!shape)
		return;

	const tall = glyph.pixels.some(([, y]) => y < 2);
	if (tall && mark === caron && base !== base.toUpperCase()) {
		//lowercase letters with ascenders (ď, ť, ľ) take the caron as an apostrophe
		glyph.pixels.push([glyph.width + 1, 0], [glyph.width + 1, 1]);
		glyph.width += 2;
		return;
	}

	const top = tall ? -2 : 0,
		offset = Math.floor((glyph.width - shape[0].length) / 2);

	shape.forEach((row, y) => {
		[...row].forEach((cell, x) => {
			if (cell === '#')
				glyph.pixels.push([offset + x, top + y]);
		});
	});
}
