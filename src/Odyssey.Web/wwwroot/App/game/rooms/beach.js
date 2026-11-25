import { ellipse, gradient, polygon, rect, seeded, speckle } from '../../engine/paint.js';

const enterCave = g => g.goTo('cave', 'fromBeach');

export default {
	name: 'Beach',
	width: 480,
	background: paintBackground,
	walkArea: {
		outer: [0, 152, 120, 148, 250, 150, 360, 152, 410, 160, 440, 178, 470, 182, 470, 199, 0, 199],
		holes: [
			[186, 160, 214, 160, 220, 167, 214, 173, 186, 173, 180, 167],
			[326, 183, 342, 183, 342, 189, 326, 189]
		]
	},
	scaling: { top: 148, topScale: 0.8, bottom: 199, bottomScale: 1.05 },
	entries: {
		start: { x: 60, y: 176, dir: 'E' },
		fromCave: { x: 444, y: 188, dir: 'W' }
	},
	onEnter: async (g, { firstVisit }) => {
		if (!firstVisit)
			return;

		await g.cutscene(async () => {
			await g.narrate('Left click to walk and interact. Right click to look. Your things are in the bag in the corner.');
			await g.walk(100, 178);
			await g.say('What a lovely evening for an adventure.');
		});
	},
	objects: [
		{
			id: 'sea',
			name: 'Sea',
			polygon: [0, 100, 480, 100, 480, 138, 0, 142],
			look: g => g.say('The sea. It goes on forever, or at least until the horizon.'),
			interact: g => g.say('I\'m not in the mood for a swim.')
		},
		{
			id: 'sign',
			name: 'Sign',
			x: 50,
			y: 106,
			width: 32,
			height: 18,
			walkTo: { x: 66, y: 166, dir: 'N' },
			look: g => g.say('It says: "BEWARE OF THE CAVE. ALSO OF THE HERMIT."'),
			interact: g => g.say('It\'s nailed down tight.')
		},
		{
			id: 'boat',
			name: 'Rowing boat',
			x: 2,
			y: 144,
			width: 38,
			height: 14,
			picture: paintBoat,
			walkTo: { x: 30, y: 170, dir: 'W' },
			look: g => g.say('My trusty rowing boat. It can take me anywhere on the chart.'),
			exit: { room: 'map' }
		},
		{
			id: 'driftwood',
			name: 'Driftwood',
			x: 116,
			y: 182,
			width: 26,
			height: 8,
			picture: paintDriftwood,
			item: 'driftwood',
			pickUpText: 'Might come in handy.',
			look: g => g.say('A piece of driftwood, bleached by the sun.')
		},
		{
			id: 'campfire',
			name: 'Campfire',
			x: 186,
			y: 148,
			width: 28,
			height: 22,
			baseline: 168,
			draw: drawFire,
			walkTo: { x: 176, y: 176, dir: 'E' },
			look: g => g.say('A small, cheerful campfire.'),
			interact: g => g.say('Ouch! Yes, it\'s hot. Who knew.'),
			useItem: {
				unlitTorch: async g => {
					g.take('unlitTorch');
					g.give('torch');
					await g.say('Now THAT is a proper torch.');
				},
				driftwood: g => g.say('It would just burn away. I need something to keep a flame on it.'),
				rag: g => g.say('Burning the rag on its own would be a waste.'),
				torch: g => g.say('It\'s already burning.')
			}
		},
		{
			id: 'palm',
			x: 300,
			y: 40,
			width: 70,
			height: 150,
			baseline: 186,
			picture: paintPalm
		},
		{
			id: 'cave',
			name: 'Cave entrance',
			polygon: [432, 124, 464, 124, 466, 176, 430, 176],
			walkTo: { x: 448, y: 184, dir: 'N' },
			look: g => g.say('A dark cave in the cliff. Something glints deep inside.'),
			interact: async g => {
				if (g.has('torch'))
					await enterCave(g);
				else
					await g.say('It\'s pitch black in there. I\'d need some light.');
			},
			useItem: {
				torch: enterCave,
				unlitTorch: g => g.say('A torch works better when it\'s burning.')
			}
		}
	]
};

function paintBackground(context, width, height) {
	//sky, sun and clouds
	gradient(context, 0, 0, width, 104, ['#1c0c3c', '#3c1450', '#7c2450', '#c04848', '#f08840', '#f8c868']);
	speckle(context, 0, 0, width, 30, '#a0a0e0', 40, 5);
	ellipse(context, 300, 96, 20, 20, '#ffe890', '#fff8d0', 0.3);
	polygon(context, [30, 34, 80, 28, 150, 32, 120, 38, 50, 39], '#8a2a58', '#c04060', 0.3);
	polygon(context, [200, 56, 260, 50, 330, 55, 280, 60], '#b03a50', '#e06048', 0.3);
	polygon(context, [380, 22, 430, 18, 470, 24, 420, 27], '#6a2058', '#8a2a58', 0.4);

	//sea with the sun's reflection
	gradient(context, 0, 100, width, 42, ['#c86048', '#5a3070', '#283c78', '#1c2c60']);
	const random = seeded(42);
	for (let row = 102; row < 140; row += 2) {
		const spread = (row - 100) * 0.6, length = 4 + Math.floor(random() * 10);
		rect(context, Math.round(300 - spread + random() * spread * 2 - length / 2), row, length, 1, row < 118 ? '#f8d070' : '#e08850');
	}
	speckle(context, 0, 112, width, 28, '#4a5ca0', 160, 9);

	//sand with a wet shoreline
	const shore = [0, 140, 60, 134, 140, 138, 220, 134, 320, 138, 400, 140, width, 136];
	polygon(context, [...shore, width, height, 0, height], '#d8b070', '#c09858', 0.35);
	polygon(context, [...shore, width, 141, 400, 145, 320, 143, 220, 139, 140, 143, 60, 139, 0, 145], '#a08050');
	speckle(context, 0, 144, width, 56, '#f0d090', 600, 7);
	speckle(context, 0, 144, width, 56, '#a07848', 500, 11);

	//cliff with the cave
	polygon(context, [395, 145, 405, 95, 425, 45, 452, 22, width, 10, width, height, 472, height, 462, 178, 420, 170], '#5c4860', '#3c2c44', 0.4);
	polygon(context, [418, 80, 438, 40, 452, 30, 446, 70, 432, 110], '#7a6478', '#5c4860', 0.5);
	ellipse(context, 448, 150, 16, 26, '#0c0610');
	ellipse(context, 450, 154, 9, 18, '#05020a');

	//sign post
	rect(context, 64, 120, 3, 42, '#6a4020');
	rect(context, 50, 108, 32, 14, '#a07040');
	rect(context, 50, 108, 32, 1, '#c89060');
	rect(context, 50, 121, 32, 1, '#6a4020');
	rect(context, 54, 112, 22, 1, '#4a2810');
	rect(context, 54, 116, 16, 1, '#4a2810');

	//campfire stones and logs
	rect(context, 191, 163, 18, 3, '#5a3418');
	rect(context, 194, 161, 12, 2, '#6a4020');
	[[186, 165], [190, 168], [196, 169], [203, 169], [209, 167], [212, 164]].forEach(([x, y]) => {
		rect(context, x, y, 5, 3, '#787068');
		rect(context, x, y, 5, 1, '#a09890');
	});
}

function paintDriftwood(context) {
	polygon(context, [0, 5, 22, 1, 26, 3, 24, 6, 2, 8], '#c8b090', '#8a7050', 0.4);
	rect(context, 6, 4, 4, 1, '#6a5030');
}

function paintBoat(context) {
	polygon(context, [0, 4, 38, 4, 32, 13, 6, 13], '#7a4a28', '#5a3418', 0.3);
	rect(context, 0, 4, 38, 2, '#a06a3a');
	rect(context, 10, 6, 2, 6, '#4a2810');
	rect(context, 26, 6, 2, 6, '#4a2810');
	rect(context, 14, 0, 2, 5, '#c89060');
}

function paintPalm(context) {
	for (let y = 18; y < 146; y += 3) {
		const x = 28 + Math.round(Math.sin(y / 30) * 5 + (146 - y) * 0.06);
		rect(context, x, y, 9, 3, '#7a5430');
		rect(context, x, y, 9, 1, '#5a3a20');
		rect(context, x + 6, y + 1, 3, 2, '#9a7048');
	}
	const crown = [36, 18];
	[[-34, 20], [-28, 4], [-10, -16], [12, -14], [30, 6], [34, 24], [4, 30]].forEach(([dx, dy]) => {
		const [cx, cy] = crown;
		polygon(context, [cx, cy - 2, cx + dx, cy + dy, cx + dx * 0.8, cy + dy + 6, cx, cy + 3], '#2a6a30', '#1a4a20', 0.4);
	});
	ellipse(context, 34, 22, 4, 3, '#5a3a20');
}

function drawFire(context, time) {
	const frame = Math.floor(time / 110) % 4,
		heights = [[8, 12, 9], [11, 9, 12], [9, 13, 8], [12, 10, 10]][frame];

	heights.forEach((height, index) => {
		const x = 194 + index * 4;
		rect(context, x, 163 - height, 4, height, '#e04010');
		rect(context, x + 1, 166 - height, 2, height - 3, '#f8a020');
	});
	rect(context, 198, 157, 4, 4, '#fff0a0');
}
