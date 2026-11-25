import { logicalHeight, logicalWidth } from '../config.js';
import { rect } from '../paint.js';
import { lineHeight, wrapText } from '../text.js';
import { colors } from './theme.js';

const margin = 6,
	maxWidth = logicalWidth - margin * 2;

//dialog options listed at the bottom of the screen; resolves the chosen index
export class DialogChoices {
	constructor(game, texts, resolve) {
		this.game = game;
		this.resolve = resolve;
		this.pauses = false;
		this.covers = true;
		this.selected = -1;

		const lineCount = texts.reduce((count, text) => count + wrapText(text, maxWidth).length, 0);
		let y = logicalHeight - lineCount * lineHeight - 4;
		this.top = y - 2;
		this.options = texts.map(text => {
			const lines = wrapText(text, maxWidth), option = { lines, y, height: lines.length * lineHeight };
			y += option.height;
			return option;
		});
	}

	get hovering() {
		return this.selected >= 0;
	}

	update() {
		const pointer = this.game.input.pointer;
		this.selected = this._indexAt(pointer.y);
	}

	handle(event) {
		if (event.type === 'click' && event.button === 0)
			this._choose(this._indexAt(event.y));
		else if (event.type === 'key' && /^[1-9]$/.test(event.key))
			this._choose(Number(event.key) - 1);
	}

	draw(context) {
		rect(context, 0, this.top, logicalWidth, logicalHeight - this.top, '#000');
		this.options.forEach((option, index) => {
			const color = index === this.selected ? colors.highlight : colors.text;
			option.lines.forEach((line, lineIndex) => {
				this.game.text.draw(context, line, margin, option.y + lineIndex * lineHeight, { color, align: 'left', outline: null });
			});
		});
	}

	_indexAt(y) {
		return this.options.findIndex(option => y >= option.y && y < option.y + option.height);
	}

	_choose(index) {
		if (index < 0 || index >= this.options.length)
			return;

		this.game.closeOverlay(this);
		this.resolve(index);
	}
}
