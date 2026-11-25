# Authoring game content

Everything that makes up the story lives in `src/Odyssey.Web/wwwroot/App/game`. The engine reads it as plain JavaScript objects,
and anything that happens in the game is an `async` script that receives the script api as `g`.

All coordinates are logical pixels: the screen is 320x200, rooms may be wider (or taller) and scroll.
Polygons are flat coordinate lists `[x1, y1, x2, y2, ...]`.

References between content (rooms, entries, items, object ids, dialog nodes) are checked by `engine/validate.js`.
Problems are logged as warnings in the browser console when the game starts, and the `game content` spec in the test runner fails on them.

## Game definition (`index.js`)

```js
export default {
	id: 'odyssey',              //also the name of the IndexedDB database with save games
	name: 'Odyssey',            //drawn on the title screen
	player: 'hero',             //actor id of the player
	start: { room: 'beach', entry: 'start' },
	narratorColor: '#ffe070',   //color of g.narrate() text
	titleScreen: painter,       //title backdrop, a painter function or an image path
	actors, items,
	dialogs: { hermit },        //keys are dialog ids for g.dialog('hermit')
	rooms: { beach, cave },     //keys are room ids
	messages: {}                //optional overrides of default replies, see engine/game.js
};
```

## Rooms (`rooms/*.js`)

```js
export default {
	name: 'Beach',                         //shown in save slots
	width: 480,                            //default 320; wider rooms scroll with the player
	background: 'rooms/beach/bg.png',      //image path under wwwroot/Assets, or a painter (context, width, height) => {}
	walkArea: { outer: [...], holes: [[...], [...]] },   //or just a flat polygon; omitted = the whole room
	scaling: { top: 148, topScale: 0.8, bottom: 199, bottomScale: 1.05 },   //actors get smaller towards the top
	entries: { start: { x: 60, y: 176, dir: 'E' } },     //where the player appears; g.goTo(room, entry)
	onEnter: async (g, { firstVisit, entry }) => {},
	onLeave: async g => {},
	objects: [...]
};
```

### Objects

Objects are everything in a room that can be seen or used. An object with a `name` is interactive.

```js
{
	id: 'campfire',                        //needed by objects with an item and by useOn of items
	name: 'Campfire',                      //hover label; omit for scenery such as walk-behind layers
	x: 186, y: 148, width: 28, height: 22, //hit rectangle and picture position
	polygon: [...],                        //hit area instead of the rectangle
	picture: 'rooms/beach/fire.png',       //static picture drawn at x, y (painter or image path)
	draw: (context, time, g) => {},        //animated drawing every frame, in room coordinates
	baseline: 168,                         //actors standing above this y are drawn behind the object
	visible: g => !g.flag('fireOut'),      //hidden objects are neither drawn nor interactive
	walkTo: { x: 176, y: 176, dir: 'E' },  //where the player stands to use it; default is the clicked point
	look: async g => {},                   //right click
	interact: async g => {},               //left click
	useItem: { torch: async g => {}, default: async g => {} },   //left click while holding an item
	exit: { room: 'cave', entry: 'fromBeach' }                    //left click goes to another room when there is no interact
}
```

An object that is picked up names its item. Left click (when there is no `interact`) puts the item in the inventory,
removes the object from the room for good and says `pickUpText`. A custom `interact` can still pick it up with `await g.pickUp('driftwood')`,
for example only after a condition is met.

```js
{
	id: 'driftwood',
	name: 'Driftwood',
	x: 116, y: 182, width: 26, height: 8,
	picture: paintDriftwood,
	item: 'driftwood',
	pickUpText: 'Might come in handy.'      //optional; text or an array of lines
}
```

Without a handler the player answers with a random default reply (`look`, `interact`, `useItem` in `engine/game.js`).

## Actors (`actors.js`)

```js
hermit: {
	name: 'Old hermit',          //makes the actor interactive; the player has no name
	talkColor: '#a0e8ff',
	room: 'beach', x: 238, y: 172, dir: 'W',
	speed: 64,                   //pixels per second at scale 1
	costume: { colors: { hair: '#e0e0e0', shirt: '#6a7a3a' } },   //placeholder figure
	look, interact, useItem      //same as objects
}
```

A sprite sheet costume replaces the placeholder once art exists:

```js
costume: {
	sheet: 'actors/hermit.png', frameWidth: 24, frameHeight: 52,
	animations: {
		'idle-S': { frames: [0] }, 'walk-S': { frames: [1, 2, 3, 4], fps: 8 },
		'idle-E': { frames: [5] }, 'walk-E': { frames: [6, 7, 8, 9], fps: 8 },
		'idle-N': { frames: [10] }, 'walk-N': { frames: [11, 12, 13, 14], fps: 8 },
		'talk-S': { frames: [0, 15], fps: 6 }, 'talk-E': { frames: [5, 16], fps: 6 }
	}
}
```

West uses east mirrored unless `-W` animations exist. Frames are numbered left to right, top to bottom.

## Items (`items.js`)

```js
rag: {
	name: 'Oily rag',
	icon: 'items/rag.png',              //24x16 picture or painter
	look: async g => {},                //right click in the inventory
	combine: { driftwood: async g => {} },   //either item of the pair may define it
	useOn: { campfire: async g => {} }       //fallback when the object has no useItem handler for this item
}
```

## Dialogs (`dialogs/*.js`)

```js
export default {
	id: 'hermit',                 //progress is saved under this id
	start: 'root',                //default 'root'
	nodes: {
		root: {
			options: [
				{
					id: 'who',
					text: 'Who are you?',               //the player says it unless say: false
					once: true,                          //disappears after being chosen
					when: g => g.flag('metHermit'),      //shown only when true
					run: async g => g.say('hermit', 'Nobody.'),
					goto: 'other',                       //switch to another node
					end: true                            //leave the dialog
				}
			]
		}
	}
};
```

Register dialogs under `dialogs` in `index.js` and start one from a script with `await g.dialog('hermit')`.
Option ids must be unique within a dialog, because the progress of `once` options is saved by id.

## Script api (`g`)

| Call | Meaning |
| --- | --- |
| `await g.say(text)` / `await g.say('hermit', text)` | speech above the actor's head; text may be an array of lines |
| `await g.narrate(text)` | narration at the top of the screen |
| `await g.walk(x, y, actorId)` | walk along the walk area; actor defaults to the player |
| `g.face('N' \| 'E' \| 'S' \| 'W' \| actor, actorId)` | turn an actor |
| `await g.wait(ms)` | pause the script (stops while the game is paused) |
| `g.flag(name)`, `g.setFlag(name, value = true)` | saved story state |
| `g.has(item)`, `g.give(item)`, `g.take(item)` | inventory; a new item drops into the inventory bag |
| `await g.pickUp(objectId)` | pick up an object of the current room that has an `item` |
| `await g.goTo(roomId, entry)` | fade to another room |
| `await g.dialog('hermit')`, `await g.choose(texts)` | dialog tree by id, or a single choice returning the index |
| `await g.cutscene(async g => {})` | hides the cursor and inventory button while it runs |
| `g.actor(id)`, `g.player`, `g.room`, `g.state` | direct access when needed |
| `g.random(list)` | random element |

The player cannot click while a script runs; a click or the space bar skips the current line of speech.

## Painting placeholder art

`engine/paint.js` has crisp, dithered primitives for placeholder art: `rect`, `dither`, `gradient`, `polygon`, `ellipse`, `speckle`.
Painters receive a context that draws in logical pixels. Use whole numbers for coordinates.
