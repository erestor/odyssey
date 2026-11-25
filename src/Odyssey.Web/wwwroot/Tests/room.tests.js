import { Room } from '../App/engine/room.js';

describe('Room', () => {
	const api = { state: { taken: {} }, flag: () => false },
		room = new Room('hall', {
			scaling: { top: 100, topScale: 0.5, bottom: 200, bottomScale: 1 },
			entries: { door: { x: 10, y: 150 }, window: { x: 300, y: 150 } },
			objects: [
				{ id: 'wall', name: 'Wall', x: 0, y: 0, width: 320, height: 100 },
				{ id: 'painting', name: 'Painting', x: 100, y: 20, width: 40, height: 30 },
				{ id: 'ghost', name: 'Ghost', x: 200, y: 20, width: 40, height: 30, visible: g => g.flag('ghost') },
				{ id: 'key', name: 'Key', item: 'key', x: 50, y: 20, width: 10, height: 10 },
				{ id: 'lamp', x: 250, y: 20, width: 10, height: 10 }
			]
		});

	it('scaleAt interpolates between top and bottom', () => {
		expect(room.scaleAt(150)).toBe(0.75);
	});

	it('scaleAt clamps outside the scaling band', () => {
		expect(room.scaleAt(0)).toBe(0.5);
		expect(room.scaleAt(250)).toBe(1);
	});

	it('scaleAt without scaling is 1', () => {
		expect(new Room('empty', {}).scaleAt(50)).toBe(1);
	});

	it('constructor marks a map room', () => {
		expect(new Room('chart', { map: true }).isMap).toBeTrue();
		expect(room.isMap).toBeFalse();
	});

	it('entry falls back to the first entry and then to the bottom center', () => {
		expect(room.entry('window')).toEqual({ x: 300, y: 150 });
		expect(room.entry('chimney')).toEqual({ x: 10, y: 150 });
		expect(new Room('empty', {}).entry()).toEqual({ x: 160, y: 190, dir: 'S' });
	});

	it('objectAt returns the topmost interactive object', () => {
		expect(room.objectAt(110, 30, api).id).toBe('painting');
		expect(room.objectAt(10, 30, api).id).toBe('wall');
	});

	it('objectAt skips invisible and nameless objects', () => {
		expect(room.objectAt(210, 30, api).id).toBe('wall');
		expect(room.objectAt(255, 25, api).id).toBe('wall');
	});

	it('objectAt skips an object whose item was picked up', () => {
		expect(room.objectAt(55, 25, api).id).toBe('key');
		expect(room.objectAt(55, 25, { ...api, state: { taken: { 'hall.key': true } } }).id).toBe('wall');
	});
});
