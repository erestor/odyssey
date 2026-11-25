import { logicalHeight, logicalWidth } from '../config.js';
import { lineHeight, measureText } from '../text.js';
import { colors, drawPanel } from './theme.js';

const padding = 6;

//a modal list of choices drawn on the game screen, operated by mouse or keyboard.
//items are { label: string | () => string, action: () => {}, disabled: () => bool }
export class Menu {
	constructor(game, { title = null, items, onCancel = null, top = null }) {
		this.game = game;
		this.title = title;
		this.items = items;
		this.onCancel = onCancel;
		this.top = top;
		this.pauses = true;
		this.selected = -1;
		this._pointer = null;
	}

	get hovering() {
		return this._enabled(this.selected);
	}

	update() {
		const pointer = this.game.input.pointer;
		if (this._pointer?.x !== pointer.x || this._pointer?.y !== pointer.y) {
			this._pointer = { x: pointer.x, y: pointer.y };
			this.selected = this._indexAt(pointer.x, pointer.y);
		}
	}

	handle(event) {
		if (event.type === 'click') {
			if (event.button === 2)
				this.onCancel?.();
			else
				this._activate(this._indexAt(event.x, event.y));
		}
		else if (event.key === 'ArrowDown')
			this._move(1);
		else if (event.key === 'ArrowUp')
			this._move(-1);
		else if (event.key === 'Enter' || event.key === ' ')
			this._activate(this.selected);
		else if (event.key === 'Escape')
			this.onCancel?.();
	}

	draw(context) {
		const layout = this._layout(),
			text = this.game.text;

		drawPanel(context, layout.x, layout.y, layout.width, layout.height);
		if (this.title)
			text.draw(context, this.title, layout.x + layout.width / 2, layout.y + padding, { color: colors.title });

		layout.labels.forEach((label, index) => {
			const color = !this._enabled(index) ? colors.disabled : index === this.selected ? colors.highlight : colors.text;
			text.draw(context, label, layout.x + layout.width / 2, layout.itemsTop + index * lineHeight, { color });
		});
	}

	_layout() {
		const labels = this.items.map(item => typeof item.label === 'function' ? item.label() : item.label),
			width = Math.min(logicalWidth - 4, Math.max(measureText(this.title ?? ''), ...labels.map(measureText)) + padding * 2 + 8),
			titleHeight = this.title ? lineHeight + 4 : 0,
			height = titleHeight + labels.length * lineHeight + padding * 2,
			x = Math.floor((logicalWidth - width) / 2),
			y = this.top ?? Math.floor((logicalHeight - height) / 2);

		return { labels, width, height, x, y, itemsTop: y + padding + titleHeight };
	}

	_indexAt(x, y) {
		const layout = this._layout();
		if (x < layout.x || x >= layout.x + layout.width || y < layout.itemsTop)
			return -1;

		const index = Math.floor((y - layout.itemsTop) / lineHeight);
		return index < this.items.length ? index : -1;
	}

	_enabled(index) {
		const item = this.items[index];
		return !!item && !item.disabled?.();
	}

	_move(direction) {
		for (let step = 1; step <= this.items.length; step++) {
			const index = (Math.max(this.selected, direction > 0 ? -1 : 0) + step * direction + this.items.length) % this.items.length;
			if (this._enabled(index)) {
				this.selected = index;
				return;
			}
		}
	}

	_activate(index) {
		if (this._enabled(index))
			this.items[index].action();
	}
}
