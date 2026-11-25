import { Game } from './engine/game.js';
import definition from './game/index.js';

const game = new Game(document.getElementById('game'), definition);
game.start().catch(error => {
	console.error(error);
	document.getElementById('game').textContent = `The game failed to start: ${error.message}`;
});
