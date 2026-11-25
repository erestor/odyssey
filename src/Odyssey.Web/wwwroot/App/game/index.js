import actors from './actors.js';
import hermit from './dialogs/hermit.js';
import items from './items.js';
import beach from './rooms/beach.js';
import cave from './rooms/cave.js';
import map from './rooms/map.js';
import { paintTitle } from './title.js';

//the game definition: everything the engine needs to know about the story.
//the beach and cave are placeholder rooms that exercise the engine until the real story is in.
export default {
	id: 'odyssey',
	name: 'Odyssey',
	player: 'hero',
	start: { room: 'beach', entry: 'start' },
	narratorColor: '#ffe070',
	titleScreen: paintTitle,
	actors,
	items,
	dialogs: {
		hermit
	},
	rooms: {
		beach,
		cave,
		map
	}
};
