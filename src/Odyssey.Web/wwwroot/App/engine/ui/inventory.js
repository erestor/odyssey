import { logicalHeight, logicalWidth } from '../config.js';
import { rect } from '../paint.js';
import { lineHeight } from '../text.js';
import { colors, drawPanel } from './theme.js';

export const iconWidth = 24;
export const iconHeight = 16;

const columns = 6,
	maxRows = 3,
	slotWidth = 32,
	slotHeight = 22,
	padding = 5,
	button = { x: 2, y: logicalHeight - 15, width: 18, height: 13 };

//The Dig style inventory window: left click picks an item up as the cursor (or combines it with the held one),
//right click looks at it, clicking outside closes it
export class InventoryPanel {
	constructor(game) {
		const rows = Math.min(maxRows, Math.max(1, Math.ceil(game.state.inventory.length / columns)));
		this.game = game;
		this.pauses = true;
		this.covers = true;
		this.width = columns * slotWidth + padding * 2;
		this.height = rows * slotHeight + padding * 2 + lineHeight;
		this.x = Math.floor((logicalWidth - this.width) / 2);
		this.y = Math.floor((logicalHeight - this.height) / 2) - 20;
		this.hovered = null;
	}

	static buttonContains(x, y) {
		return x >= button.x && x < button.x + button.width && y >= button.y && y < button.y + button.height;
	}

	static drawButton(context, hovered) {
		const { x, y } = button, edge = hovered ? colors.highlight : '#c89048';
		rect(context, x + 2, y + 3, 14, 10, '#000');
		rect(context, x + 1, y + 2, 14, 10, edge);
		rect(context, x + 2, y + 3, 12, 8, '#7a4a20');
		rect(context, x + 5, y, 6, 3, edge);
		rect(context, x + 6, y + 1, 4, 1, '#000');
		rect(context, x + 2, y + 5, 12, 1, edge);
		rect(context, x + 7, y + 5, 2, 3, colors.highlight);
	}

	get hovering() {
		return !!this.hovered;
	}

	update() {
		const pointer = this.game.input.pointer;
		this.hovered = this._itemAt(pointer.x, pointer.y);
	}

	handle(event) {
		const game = this.game;
		if (event.type === 'key') {
			if (['Escape', 'i', 'I'].includes(event.key))
				this.close();

			return;
		}

		const item = this._itemAt(event.x, event.y);
		if (!item) {
			if (!this._contains(event.x, event.y))
				this.close();

			return;
		}

		this.close();
		if (event.button === 2)
			game.lookAtItem(item);
		else if (game.heldItem && game.heldItem !== item)
			game.combineItems(game.heldItem, item);
		else
			game.heldItem = item;
	}

	close() {
		this.game.closeOverlay(this);
	}

	draw(context) {
		const game = this.game;
		drawPanel(context, this.x, this.y, this.width, this.height);
		game.state.inventory.slice(0, columns * maxRows).forEach((item, index) => {
			const slot = this._slot(index), icon = game.itemIcons.get(item);
			rect(context, slot.x, slot.y, slotWidth - 2, slotHeight - 2, item === this.hovered ? '#30306a' : '#181848');
			if (item === game.heldItem)
				rect(context, slot.x, slot.y + slotHeight - 3, slotWidth - 2, 1, colors.highlight);

			if (icon)
				context.drawImage(icon.source, slot.x + (slotWidth - 2 - icon.width) / 2, slot.y + (slotHeight - 2 - icon.height) / 2, icon.width, icon.height);
		});

		const label = this.hovered ? game.itemName(this.hovered) : game.state.inventory.length ? '' : game.messages.emptyInventory;
		if (label)
			game.text.draw(context, label, this.x + this.width / 2, this.y + this.height - lineHeight - 3, { color: colors.label });
	}

	_slot(index) {
		return {
			x: this.x + padding + (index % columns) * slotWidth + 1,
			y: this.y + padding + Math.floor(index / columns) * slotHeight + 1
		};
	}

	_contains(x, y) {
		return x >= this.x && x < this.x + this.width && y >= this.y && y < this.y + this.height;
	}

	_itemAt(x, y) {
		const inventory = this.game.state.inventory;
		for (let index = 0; index < Math.min(inventory.length, columns * maxRows); index++) {
			const slot = this._slot(index);
			if (x >= slot.x && x < slot.x + slotWidth - 2 && y >= slot.y && y < slot.y + slotHeight - 2)
				return inventory[index];
		}
		return null;
	}
}
