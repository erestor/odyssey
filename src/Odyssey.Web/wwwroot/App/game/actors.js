import hermitDialog from './dialogs/hermit.js';

export default {
	hero: {
		talkColor: '#ffffff',
		costume: {
			colors: { shirt: '#e8e8e8', shirtShade: '#b0b0b0', pants: '#384870', hair: '#a06020' }
		}
	},
	hermit: {
		name: 'Old hermit',
		talkColor: '#a0e8ff',
		room: 'beach',
		x: 238,
		y: 172,
		dir: 'W',
		costume: {
			colors: { hair: '#e0e0e0', shirt: '#6a7a3a', shirtShade: '#4a5a2a', pants: '#5a4a3a', skin: '#d0986c' }
		},
		look: g => g.say('An old hermit, warming his hands by the fire.'),
		interact: async g => {
			g.actor('hermit').face(g.player);
			await g.dialog(hermitDialog);
		},
		useItem: {
			default: g => g.say('hermit', 'Keep your junk, youngster.')
		}
	}
};
