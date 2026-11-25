import { ellipse, gradient, polygon, rect, speckle } from '../../engine/paint.js';

export default {
	name: 'Cave',
	background: paintBackground,
	walkArea: [8, 158, 300, 150, 316, 199, 4, 199],
	scaling: { top: 150, topScale: 0.85, bottom: 199, bottomScale: 1.05 },
	entries: {
		fromBeach: { x: 30, y: 184, dir: 'E' }
	},
	onEnter: async (g, { firstVisit }) => {
		if (firstVisit)
			await g.say('Whoa. Somebody has been here before me.');
	},
	objects: [
		{
			id: 'exit',
			name: 'Way out',
			polygon: [0, 90, 26, 96, 26, 196, 0, 199],
			walkTo: { x: 14, y: 184, dir: 'W' },
			exit: { room: 'beach', entry: 'fromCave' }
		},
		{
			id: 'carvings',
			name: 'Carvings',
			x: 110,
			y: 40,
			width: 100,
			height: 44,
			walkTo: { x: 160, y: 160, dir: 'N' },
			look: g => g.say(['Carvings of ships, and of a great eye watching over them.', 'Somebody had a lot of time on their hands.']),
			interact: g => g.say('I trace the grooves with a finger. They are cold.')
		},
		{
			id: 'chest',
			name: 'Old chest',
			x: 232,
			y: 140,
			width: 34,
			height: 22,
			baseline: 162,
			picture: paintChest,
			walkTo: { x: 248, y: 172, dir: 'N' },
			look: g => g.say('An old chest, bound with iron.'),
			interact: async g => {
				if (g.flag('openedChest')) {
					await g.say('Still empty. Still disappointing.');
					return;
				}

				g.setFlag('openedChest');
				await g.cutscene(async () => {
					await g.say('Let\'s see what\'s inside...');
					await g.wait(600);
					await g.say('Empty! Except for a note.');
					await g.narrate('"Your story begins here." This is the end of the engine demo.');
				});
			}
		}
	]
};

function paintBackground(context, width, height) {
	gradient(context, 0, 0, width, height, ['#06040a', '#1a1222', '#2a2030', '#1a1420']);
	speckle(context, 0, 0, width, 150, '#3a2e44', 400, 21);

	//torch light falling on the back wall
	ellipse(context, 170, 90, 120, 70, '#2a2030', '#4a3848', 0.35);
	ellipse(context, 170, 90, 80, 50, '#4a3848', '#5a4858', 0.4);

	//carvings
	[[118, 60, 22], [146, 54, 26], [178, 62, 20]].forEach(([x, y, length]) => {
		rect(context, x, y, length, 1, '#8a7a6a');
		rect(context, x + 2, y - 6, 1, 6, '#8a7a6a');
		rect(context, x + 3, y - 6, length / 2, 4, '#6a5a4a');
	});
	ellipse(context, 160, 46, 10, 5, '#8a7a6a');
	ellipse(context, 160, 46, 3, 3, '#1a1420');

	//floor
	polygon(context, [0, 160, 120, 150, 300, 148, width, 158, width, height, 0, height], '#2c2420', '#3c3028', 0.4);
	speckle(context, 0, 152, width, 48, '#4a3c30', 300, 4);

	//cave mouth glow on the left
	polygon(context, [0, 90, 22, 98, 24, 196, 0, 199], '#3a3060', '#c08050', 0.2);
}

function paintChest(context) {
	rect(context, 1, 6, 32, 16, '#6a4020');
	rect(context, 0, 2, 34, 7, '#7a4a28');
	rect(context, 0, 2, 34, 1, '#9a6a40');
	rect(context, 5, 2, 3, 20, '#5a5a60');
	rect(context, 26, 2, 3, 20, '#5a5a60');
	rect(context, 15, 8, 4, 5, '#c8a040');
}
