import { logicalHeight, logicalWidth } from '../config.js';
import { rectContains } from '../geometry.js';
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
		this.showsHeldItem = true;
		this.width = columns * slotWidth + padding * 2;
		this.height = rows * slotHeight + padding * 2 + lineHeight;
		this.x = Math.floor((logicalWidth - this.width) / 2);
		this.y = Math.floor((logicalHeight - this.height) / 2) - 20;
		this.hovered = null;
	}

	static buttonContains(x, y) {
		return rectContains(button, x, y);
	}

	//pickup is a newly added item ({icon, progress} from 0 to 1): it pops up above the bag, then drops in and the bag bounces
	static drawButton(context, hovered, pickup) {
		const progress = pickup?.progress ?? 0,
			landed = progress > 0.8,
			x = button.x,
			y = button.y - (landed ? 1 : 0),
			edge = hovered || landed ? colors.highlight : colors.bag;

		if (pickup?.icon && !landed) {
			const icon = pickup.icon,
				mouth = button.y + 3,
				top = button.y - icon.height - 8,
				iconY = progress < 0.3 ? mouth + (top - mouth) * (1 - (1 - progress / 0.3) ** 2) :
					progress < 0.6 ? top : top + (mouth - top) * ((progress - 0.6) / 0.2) ** 2;

			//the icon disappears into the mouth of the bag
			context.save();
			context.beginPath();
			context.rect(0, 0, logicalWidth, mouth);
			context.clip();
			//framed like an inventory slot so the icon stands out against any background
			const iconX = Math.max(2, Math.round(x + (button.width - icon.width) / 2));
			rect(context, iconX - 2, Math.round(iconY) - 2, icon.width + 4, icon.height + 4, '#000');
			rect(context, iconX - 1, Math.round(iconY) - 1, icon.width + 2, icon.height + 2, colors.slot);
			context.drawImage(icon.source, iconX, Math.round(iconY), icon.width, icon.height);
			context.restore();
		}

		rect(context, x + 2, y + 3, 14, 10, '#000');
		rect(context, x + 1, y + 2, 14, 10, edge);
		rect(context, x + 2, y + 3, 12, 8, colors.bagInside);
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
			if (!rectContains(this, event.x, event.y))
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
			rect(context, slot.x, slot.y, slot.width, slot.height, item === this.hovered ? colors.slotHover : colors.slot);
			if (item === game.heldItem)
				rect(context, slot.x, slot.y + slot.height - 1, slot.width, 1, colors.highlight);

			if (icon)
				context.drawImage(icon.source, slot.x + (slot.width - icon.width) / 2, slot.y + (slot.height - icon.height) / 2, icon.width, icon.height);
		});

		const held = game.heldItem,
			hovered = this.hovered,
			label = held ? game.messages.useLabel(game.itemName(held), hovered && hovered !== held ? game.itemName(hovered) : null) :
				hovered ? game.itemName(hovered) : game.state.inventory.length ? '' : game.messages.emptyInventory;

		if (label)
			game.text.draw(context, label, this.x + this.width / 2, this.y + this.height - lineHeight - 3, { color: colors.label });
	}

	_slot(index) {
		return {
			x: this.x + padding + (index % columns) * slotWidth + 1,
			y: this.y + padding + Math.floor(index / columns) * slotHeight + 1,
			width: slotWidth - 2,
			height: slotHeight - 2
		};
	}

	_itemAt(x, y) {
		const inventory = this.game.state.inventory;
		for (let index = 0; index < Math.min(inventory.length, columns * maxRows); index++) {
			if (rectContains(this._slot(index), x, y))
				return inventory[index];
		}
		return null;
	}
}
