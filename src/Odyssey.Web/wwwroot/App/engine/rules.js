//rules of the interface that do not need a screen, kept apart from game.js so they can be tested

//decides what happens when the player uses a verb ('look', 'interact' or 'useItem' with item) on a target.
//returns { script }, { pickUp: item }, { exit } or { reply } naming the list of default messages to pick from.
export function resolveInteraction(definition, verb, item = null, items = {}, targetId = null) {
	if (verb === 'look')
		return definition.look ? { script: definition.look } : { reply: 'look' };

	if (verb === 'interact') {
		if (definition.interact)
			return { script: definition.interact };

		if (definition.item)
			return { pickUp: definition.item };

		if (definition.exit)
			return { exit: definition.exit };

		return { reply: 'interact' };
	}

	const script = definition.useItem?.[item] ?? definition.useItem?.default ?? items[item]?.useOn?.[targetId];
	return script ? { script } : { reply: 'useItem' };
}

//the script that combines two items, defined on either of them
export function findCombination(items, first, second) {
	return items[first]?.combine?.[second] ?? items[second]?.combine?.[first] ?? null;
}

//options of a dialog node the player can choose now: once options disappear after being chosen, when options need their condition
export function availableOptions(node, chosen, api) {
	return node.options.filter(option => !(option.once && chosen.includes(option.id)) && (!option.when || option.when(api)));
}
