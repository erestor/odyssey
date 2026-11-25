import { validateGame } from '../App/engine/validate.js';
import definition from '../App/game/index.js';

describe('game content', () => {
	it('validateGame finds no problems in the game definition', () => {
		expect(validateGame(definition)).toEqual([]);
	});
});

describe('validateGame', () => {
	const roomWith = (objects, entries = { door: { x: 20, y: 150 } }) => ({
			hall: { walkArea: [0, 100, 320, 100, 320, 199, 0, 199], entries, objects }
		}),
		game = overrides => ({
			player: 'hero',
			start: { room: 'hall', entry: 'door' },
			actors: { hero: {} },
			items: { key: {} },
			rooms: roomWith([]),
			...overrides
		});

	it('validateGame accepts a consistent definition', () => {
		expect(validateGame(game())).toEqual([]);
	});

	it('validateGame reports an unknown start room and player', () => {
		const problems = validateGame(game({ player: 'nobody', start: { room: 'attic' } }));
		expect(problems).toContain('game: unknown player actor \'nobody\'');
		expect(problems).toContain('game start: unknown room \'attic\'');
	});

	it('validateGame reports an exit to an unknown entry', () => {
		const problems = validateGame(game({ rooms: roomWith([{ id: 'door', name: 'Door', exit: { room: 'hall', entry: 'window' } }]) }));
		expect(problems).toEqual(['room \'hall\' object \'door\' exit: unknown entry \'window\' in room \'hall\'']);
	});

	it('validateGame reports unknown items in pick ups, useItem and combine', () => {
		const definition = game({
			rooms: roomWith([{ id: 'box', name: 'Box', item: 'kye', useItem: { lamp: () => {}, default: () => {} } }]),
			items: { key: { combine: { rope: () => {} } } }
		});

		expect(validateGame(definition)).toEqual([
			'room \'hall\' object \'box\': unknown item \'kye\'',
			'room \'hall\' object \'box\' useItem: unknown item \'lamp\'',
			'item \'key\' combine: unknown item \'rope\''
		]);
	});

	it('validateGame reports an object with an item but no id and duplicate ids', () => {
		const problems = validateGame(game({ rooms: roomWith([{ name: 'Key', item: 'key' }, { id: 'a' }, { id: 'a' }]) }));
		expect(problems).toEqual(['room \'hall\' object \'Key\': an object with an item needs an id', 'room \'hall\': duplicate object id \'a\'']);
	});

	it('validateGame reports entries and walkTo points outside the walk area', () => {
		const problems = validateGame(game({ rooms: roomWith([{ id: 'sign', walkTo: { x: 50, y: 20 } }], { door: { x: 20, y: 50 } }) }));
		expect(problems).toEqual([
			'room \'hall\': entry \'door\' (20, 50) is outside the walk area',
			'room \'hall\': object \'sign\' walkTo (50, 20) is outside the walk area'
		]);
	});

	it('validateGame reports useOn targets that do not exist', () => {
		const problems = validateGame(game({ items: { key: { useOn: { hero: () => {}, chest: () => {} } } } }));
		expect(problems).toEqual(['item \'key\' useOn: unknown object or actor \'chest\'']);
	});

	it('validateGame reports broken dialog nodes and option ids', () => {
		const dialog = {
			nodes: {
				root: { options: [{ id: 'hi', text: 'Hi', goto: 'wether' }, { text: 'Bye' }] },
				other: { options: [{ id: 'hi', text: 'Hi again' }] }
			}
		};

		expect(validateGame(game({ dialogs: { guard: dialog } }))).toEqual([
			'dialog \'guard\' option \'hi\': unknown node \'wether\'',
			'dialog \'guard\' node \'root\': option \'Bye\' needs an id',
			'dialog \'guard\': duplicate option id \'hi\''
		]);
	});

	it('validateGame reports a missing start node', () => {
		const dialog = { start: 'hello', nodes: { root: { options: [] } } };
		expect(validateGame(game({ dialogs: { guard: dialog } }))).toEqual(['dialog \'guard\': missing start node \'hello\'']);
	});
});
