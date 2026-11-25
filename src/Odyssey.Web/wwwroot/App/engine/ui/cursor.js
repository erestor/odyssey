import { rect } from '../paint.js';

const activeColors = ['#ffffff', '#ffff60', '#ff9040', '#ffff60'],
	arms = [[1, 0], [-1, 0], [0, 1], [0, -1]];

//The Dig style crosshair that flashes over anything interactive; while an item is held, the item icon is the cursor
export class Cursor {
	constructor(game) {
		this.game = game;
	}

	draw(context) {
		const game = this.game,
			pointer = game.input.pointer,
			inWorld = game.mode === 'play' && !game.overlays.length,
			overlay = game.overlays.at(-1);

		if (!pointer.inside || (inWorld && game.cutscenes))
			return;

		const { x, y } = pointer,
			active = inWorld ? !!game.hover : !!overlay?.hovering,
			icon = (inWorld || overlay?.showsHeldItem) && game.heldItem ? game.itemIcons.get(game.heldItem) : null;

		if (icon) {
			context.drawImage(icon.source, Math.round(x - icon.width / 2), Math.round(y - icon.height / 2), icon.width, icon.height);
			if (!active)
				return;
		}

		const color = active ? activeColors[Math.floor(game.time / 120) % activeColors.length] : inWorld && game.busy ? '#808080' : '#ffffff';

		for (const [dx, dy] of arms) {
			for (let distance = 2; distance <= 5; distance++)
				rect(context, x + dx * distance + 1, y + dy * distance + 1, 1, 1, '#000');
		}
		for (const [dx, dy] of arms) {
			for (let distance = 2; distance <= 5; distance++)
				rect(context, x + dx * distance, y + dy * distance, 1, 1, color);
		}
	}
}
