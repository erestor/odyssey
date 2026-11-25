import { GameState, stateVersion } from '../App/engine/state.js';

describe('GameState', () => {
	it('constructor without data starts empty', () => {
		const state = new GameState();
		expect(state.room).toBeNull();
		expect(state.inventory).toEqual([]);
		expect(state.flags).toEqual({});
	});

	it('constructor copies data so the saved record is not modified', () => {
		const data = { room: 'beach', flags: { door: { open: true } }, inventory: ['rag'] },
			state = new GameState(data);

		state.flags.door.open = false;
		state.inventory.push('torch');
		expect(data.flags.door.open).toBeTrue();
		expect(data.inventory).toEqual(['rag']);
	});

	it('toJSON round trips through the constructor', () => {
		const state = new GameState({ room: 'cave', flags: { a: 1 }, inventory: ['torch'], visited: { cave: true }, playTime: 1234.4 }),
			json = state.toJSON();

		expect(json.version).toBe(stateVersion);
		expect(json.playTime).toBe(1234);
		expect(new GameState(json).toJSON()).toEqual(json);
	});
});
