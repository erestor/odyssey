import { ellipse, polygon, rect } from '../engine/paint.js';

const makeTorch = async g => {
	g.take('driftwood');
	g.take('rag');
	g.give('unlitTorch');
	await g.say('I wrap the rag around the driftwood. A torch! Well, almost.');
};

//icons are painted at 24x16 logical pixels; replace the painter with a path such as 'items/rag.png' once art exists
export default {
	driftwood: {
		name: 'Driftwood',
		icon: context => {
			polygon(context, [2, 11, 20, 3, 22, 6, 4, 14], '#a07848', '#6a4a28', 0.4);
			rect(context, 8, 9, 3, 1, '#5a3a18');
		},
		look: g => g.say('A dry piece of driftwood. It would burn nicely, I bet.'),
		combine: {
			rag: makeTorch
		}
	},
	rag: {
		name: 'Oily rag',
		icon: context => {
			polygon(context, [4, 4, 18, 2, 21, 12, 6, 14], '#c8c0a0', '#8a8060', 0.3);
			ellipse(context, 12, 8, 4, 3, '#5a5040');
		},
		look: g => g.say('It smells of fish and lamp oil. Lovely.')
	},
	unlitTorch: {
		name: 'Unlit torch',
		icon: context => {
			polygon(context, [2, 14, 16, 6, 18, 9, 4, 16], '#a07848', '#6a4a28', 0.4);
			polygon(context, [14, 3, 21, 1, 23, 8, 17, 10], '#c8c0a0', '#8a8060', 0.3);
		},
		look: g => g.say('Driftwood with an oily rag wrapped around one end. It just needs a flame.')
	},
	torch: {
		name: 'Burning torch',
		icon: context => {
			polygon(context, [2, 14, 16, 6, 18, 9, 4, 16], '#a07848', '#6a4a28', 0.4);
			polygon(context, [14, 6, 21, 4, 23, 9, 17, 11], '#5a5040');
			ellipse(context, 19, 4, 4, 4, '#f08020');
			ellipse(context, 19, 5, 2, 2, '#fff0a0');
		},
		look: g => g.say('A burning torch. Let\'s not set my hair on fire.')
	}
};
