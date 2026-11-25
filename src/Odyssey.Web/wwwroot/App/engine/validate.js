import { logicalHeight, logicalWidth } from './config.js';
import { toPoints } from './geometry.js';
import { WalkArea } from './pathfinding.js';

//checks the references in a game definition that the engine cannot check while playing:
//a typo in a room, entry, item, dialog node or object id would otherwise fail silently. Returns a list of problems.
export function validateGame(definition) {
	const problems = [],
		rooms = definition.rooms ?? {},
		items = definition.items ?? {},
		actors = definition.actors ?? {},
		report = (where, message) => problems.push(`${where}: ${message}`),
		checkItem = (where, id) => {
			if (!items[id])
				report(where, `unknown item '${id}'`);
		},
		checkUseItem = (where, useItem) => Object.keys(useItem ?? {}).filter(id => id !== 'default').forEach(id => checkItem(`${where} useItem`, id)),
		checkEntry = (where, room, entry) => {
			if (!rooms[room])
				report(where, `unknown room '${room}'`);
			else if (entry && !rooms[room].entries?.[entry])
				report(where, `unknown entry '${entry}' in room '${room}'`);
		};

	if (!actors[definition.player])
		report('game', `unknown player actor '${definition.player}'`);

	checkEntry('game start', definition.start?.room, definition.start?.entry);

	const targets = new Set(Object.keys(actors));
	for (const [roomId, room] of Object.entries(rooms)) {
		const where = `room '${roomId}'`,
			walkArea = WalkArea.fromDefinition(room.walkArea, room.width ?? logicalWidth, room.height ?? logicalHeight),
			ids = new Set(),
			checkWalkable = (place, point) => {
				if (!walkArea.contains(point))
					report(where, `${place} (${point.x}, ${point.y}) is outside the walk area`);
			};

		for (const [name, entry] of Object.entries(room.entries ?? {}))
			checkWalkable(`entry '${name}'`, entry);

		for (const object of room.objects ?? []) {
			const objectName = `object '${object.id ?? object.name}'`,
				objectWhere = `${where} ${objectName}`;

			if (object.id) {
				if (ids.has(object.id))
					report(where, `duplicate object id '${object.id}'`);

				ids.add(object.id);
				targets.add(object.id);
			}
			else if (object.item)
				report(objectWhere, 'an object with an item needs an id');

			if (object.polygon && toPoints(object.polygon).length < 3)
				report(objectWhere, 'polygon needs at least 3 points');

			if (object.item)
				checkItem(objectWhere, object.item);

			if (object.exit)
				checkEntry(`${objectWhere} exit`, object.exit.room, object.exit.entry);

			if (object.walkTo)
				checkWalkable(`${objectName} walkTo`, object.walkTo);

			checkUseItem(objectWhere, object.useItem);
		}
	}

	for (const [actorId, actor] of Object.entries(actors)) {
		if (actor.room && !rooms[actor.room])
			report(`actor '${actorId}'`, `unknown room '${actor.room}'`);

		checkUseItem(`actor '${actorId}'`, actor.useItem);
	}

	for (const [itemId, item] of Object.entries(items)) {
		Object.keys(item.combine ?? {}).forEach(id => checkItem(`item '${itemId}' combine`, id));
		Object.keys(item.useOn ?? {}).filter(id => !targets.has(id)).forEach(id => report(`item '${itemId}' useOn`, `unknown object or actor '${id}'`));
	}

	for (const [dialogId, dialog] of Object.entries(definition.dialogs ?? {}))
		validateDialog(dialog, `dialog '${dialogId}'`, report);

	return problems;
}

function validateDialog(dialog, where, report) {
	const nodes = dialog.nodes ?? {},
		ids = new Set();

	if (!nodes[dialog.start ?? 'root'])
		report(where, `missing start node '${dialog.start ?? 'root'}'`);

	for (const [nodeId, node] of Object.entries(nodes)) {
		for (const option of node.options ?? []) {
			if (!option.id)
				report(`${where} node '${nodeId}'`, `option '${option.text}' needs an id`);
			else if (ids.has(option.id))
				report(where, `duplicate option id '${option.id}'`);

			ids.add(option.id);
			if (option.goto && !nodes[option.goto])
				report(`${where} option '${option.id}'`, `unknown node '${option.goto}'`);
		}
	}
}
