//the object passed as 'g' to every script in the game content (room, object, item and dialog handlers)
export function createApi(game) {
	const playerId = () => game.definition.player,
		actor = id => game.actors.get(id ?? playerId());

	return {
		get state() {
			return game.state;
		},
		get room() {
			return game.room;
		},
		get player() {
			return game.player;
		},
		actor,

		flag: name => game.state.flags[name],
		setFlag: (name, value = true) => {
			game.state.flags[name] = value;
		},

		has: item => game.state.inventory.includes(item),
		give: item => game.addItem(item),
		take: item => game.removeItem(item),
		pickUp: objectId => game.pickUp(objectId),

		//say(text) for the player, say(actorId, text) for anyone else; text may be an array of lines
		say: (...args) => args.length > 1 ? game.say(args[0], args[1]) : game.say(playerId(), args[0]),
		narrate: text => game.say(null, text),

		walk: (x, y, actorId) => game.walkActor(actor(actorId), { x, y }),
		face: (target, actorId) => actor(actorId).face(target),
		wait: ms => game.wait(ms),
		goTo: (room, entry) => game.enterRoom(room, entry),

		dialog: dialog => game.runDialog(dialog),
		choose: options => game.choose(options),
		cutscene: script => game.cutscene(script),
		random: list => list[Math.floor(Math.random() * list.length)]
	};
}
