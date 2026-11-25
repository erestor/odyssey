import { availableOptions, findCombination, resolveInteraction } from '../App/engine/rules.js';

describe('rules', () => {
	const look = () => {},
		interact = () => {},
		useKey = () => {},
		useAny = () => {},
		keyOnDoor = () => {};

	it('resolveInteraction uses the look script or the default reply', () => {
		expect(resolveInteraction({ look }, 'look')).toEqual({ script: look });
		expect(resolveInteraction({}, 'look')).toEqual({ reply: 'look' });
	});

	it('resolveInteraction prefers interact to picking up and exits', () => {
		const exit = { room: 'cave' };
		expect(resolveInteraction({ interact, item: 'key', exit }, 'interact')).toEqual({ script: interact });
		expect(resolveInteraction({ item: 'key', exit }, 'interact')).toEqual({ pickUp: 'key' });
		expect(resolveInteraction({ exit }, 'interact')).toEqual({ exit });
		expect(resolveInteraction({}, 'interact')).toEqual({ reply: 'interact' });
	});

	it('resolveInteraction tries the target useItem, its default, the item useOn and then the default reply', () => {
		const items = { key: { useOn: { door: keyOnDoor } } };
		expect(resolveInteraction({ useItem: { key: useKey, default: useAny } }, 'useItem', 'key', items, 'door')).toEqual({ script: useKey });
		expect(resolveInteraction({ useItem: { default: useAny } }, 'useItem', 'key', items, 'door')).toEqual({ script: useAny });
		expect(resolveInteraction({}, 'useItem', 'key', items, 'door')).toEqual({ script: keyOnDoor });
		expect(resolveInteraction({}, 'useItem', 'key', items, 'window')).toEqual({ reply: 'useItem' });
	});

	it('findCombination finds the script on either item', () => {
		const combine = () => {}, items = { rag: {}, stick: { combine: { rag: combine } } };
		expect(findCombination(items, 'rag', 'stick')).toBe(combine);
		expect(findCombination(items, 'stick', 'rag')).toBe(combine);
		expect(findCombination(items, 'rag', 'rope')).toBeNull();
	});

	it('availableOptions hides chosen once options and options whose condition fails', () => {
		const node = {
				options: [
					{ id: 'who', once: true },
					{ id: 'again' },
					{ id: 'secret', when: api => api.flag },
					{ id: 'bye' }
				]
			},
			ids = (chosen, api) => availableOptions(node, chosen, api).map(option => option.id);

		expect(ids([], { flag: false })).toEqual(['who', 'again', 'bye']);
		expect(ids(['who', 'again'], { flag: true })).toEqual(['again', 'secret', 'bye']);
	});
});
