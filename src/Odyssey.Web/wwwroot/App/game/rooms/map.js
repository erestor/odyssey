import { ellipse, gradient, polygon, rect, speckle } from '../../engine/paint.js';

const island = [40, 120, 70, 92, 112, 86, 140, 104, 132, 138, 92, 150, 52, 144],
	rock = [212, 52, 236, 30, 262, 40, 270, 70, 240, 82, 214, 74];

//the sea chart: every location of the game is reached from here
export default {
	name: 'Sea chart',
	map: true,
	background: paintBackground,
	objects: [
		{
			id: 'island',
			name: 'Hermit\'s island',
			polygon: island,
			look: g => g.say('The island with the hermit and the cave.'),
			exit: { room: 'beach', entry: 'start' }
		},
		{
			id: 'lighthouse',
			name: 'Lighthouse rock',
			polygon: rock,
			look: g => g.say('A lonely lighthouse on a rock.'),
			interact: g => g.say('The sea around the rock is too rough for my little boat.')
		}
	]
};

function paintBackground(context, width, height) {
	//open sea with a chart border
	gradient(context, 0, 0, width, height, ['#1c3c6c', '#20487c', '#24508a', '#20487c']);
	speckle(context, 0, 0, width, height, '#3a68a0', 300, 3);
	rect(context, 0, 0, width, 2, '#c8a868');
	rect(context, 0, height - 2, width, 2, '#c8a868');
	rect(context, 0, 0, 2, height, '#c8a868');
	rect(context, width - 2, 0, 2, height, '#c8a868');

	//hermit's island with a palm and the cliff
	polygon(context, island, '#d8b070', '#c09858', 0.35);
	polygon(context, [100, 88, 112, 86, 140, 104, 134, 120, 112, 110], '#5c4860', '#3c2c44', 0.4);
	rect(context, 78, 104, 2, 14, '#7a5430');
	ellipse(context, 79, 103, 7, 3, '#2a6a30');

	//lighthouse rock
	polygon(context, rock, '#6a6070', '#4a4050', 0.4);
	rect(context, 236, 32, 8, 26, '#e8e0d0');
	rect(context, 236, 38, 8, 4, '#c03030');
	rect(context, 236, 48, 8, 4, '#c03030');
	rect(context, 235, 28, 10, 4, '#ffe070');

	//compass rose
	polygon(context, [280, 150, 284, 166, 280, 182, 276, 166], '#e8d8b0');
	polygon(context, [264, 166, 280, 162, 296, 166, 280, 170], '#c8a868');
}
