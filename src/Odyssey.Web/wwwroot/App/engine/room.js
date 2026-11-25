import { logicalHeight, logicalWidth } from './config.js';
import { pointInPolygon, rectContains, toPoints } from './geometry.js';
import { WalkArea } from './pathfinding.js';

//a loaded room: its definition plus the pictures and walk area built from it.
//rooms hold no game state; everything that changes lives in the game state (flags, inventory, actors).
export class Room {
	constructor(id, definition) {
		this.id = id;
		this.definition = definition;
		this.name = definition.name ?? id;
		this.isMap = !!definition.map; //a map has no player: its objects are destinations that act at once
		this.width = definition.width ?? logicalWidth;
		this.height = definition.height ?? logicalHeight;
		this.walkArea = WalkArea.fromDefinition(definition.walkArea, this.width, this.height);
		this.background = null;
		this.objects = (definition.objects ?? []).map(object => new RoomObject(object, id));
	}

	static async load(id, definition, assets) {
		const room = new Room(id, definition);
		room.background = await assets.picture(definition.background, room.width, room.height);
		await Promise.all(room.objects.map(async object => {
			object.picture = await assets.picture(object.definition.picture, object.width, object.height);
		}));
		return room;
	}

	//scale of actors standing at y, interpolated between the top and bottom of the scaling definition
	scaleAt(y) {
		const scaling = this.definition.scaling;
		if (!scaling)
			return 1;

		const t = Math.min(1, Math.max(0, (y - scaling.top) / (scaling.bottom - scaling.top)));
		return scaling.topScale + (scaling.bottomScale - scaling.topScale) * t;
	}

	entry(name) {
		const entries = this.definition.entries ?? {};
		return entries[name] ?? Object.values(entries)[0] ?? { x: this.width / 2, y: this.height - 10, dir: 'S' };
	}

	//topmost visible interactive object at the room coordinates
	objectAt(x, y, api) {
		for (let i = this.objects.length - 1; i >= 0; i--) {
			const object = this.objects[i];
			if (object.interactive && object.isVisible(api) && object.contains(x, y))
				return object;
		}
		return null;
	}
}

export class RoomObject {
	constructor(definition, roomId) {
		this.definition = definition;
		this.id = definition.id;
		this.key = `${roomId}.${definition.id}`; //identifies the object in the game state
		this.name = definition.name ?? null;
		this.x = definition.x ?? 0;
		this.y = definition.y ?? 0;
		this.width = definition.width ?? 0;
		this.height = definition.height ?? 0;
		this.polygon = definition.polygon ? toPoints(definition.polygon) : null;
		this.baseline = definition.baseline ?? -1;
		this.picture = null;
	}

	get interactive() {
		return !!this.name;
	}

	get hasVisual() {
		return !!(this.picture || this.definition.draw);
	}

	//an object with an item disappears once it is picked up
	isVisible(api) {
		if (this.definition.item && api.state.taken[this.key])
			return false;

		return !this.definition.visible || this.definition.visible(api);
	}

	contains(x, y) {
		if (this.polygon)
			return pointInPolygon({ x, y }, this.polygon);

		return rectContains(this, x, y);
	}

	draw(context, time, api) {
		if (this.picture)
			context.drawImage(this.picture.source, this.x, this.y, this.picture.width, this.picture.height);

		this.definition.draw?.(context, time, api);
	}
}
