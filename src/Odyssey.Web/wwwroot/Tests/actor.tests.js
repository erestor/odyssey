import { Actor } from '../App/engine/actor.js';

describe('Actor', () => {
	const create = () => new Actor('hero', { room: 'hall', x: 0, y: 100, speed: 60 });

	it('walk resolves true on arrival', async () => {
		const actor = create(), arrived = actor.walk([{ x: 30, y: 100 }]);
		actor.update(1000);
		expect(await arrived).toBeTrue();
		expect(actor.x).toBe(30);
		expect(actor.walking).toBeFalse();
	});

	it('walk resolves false when interrupted by stop or another walk', async () => {
		const actor = create(),
			first = actor.walk([{ x: 300, y: 100 }]),
			second = actor.walk([{ x: 0, y: 150 }]);

		expect(await first).toBeFalse();
		actor.stop();
		expect(await second).toBeFalse();
	});

	it('walk with an empty path resolves true at once', async () => {
		expect(await create().walk([])).toBeTrue();
	});

	it('update moves by speed times scale and follows all waypoints', () => {
		const actor = create();
		actor.scale = 0.5;
		actor.walk([{ x: 20, y: 100 }, { x: 20, y: 140 }]);
		actor.update(1000);
		expect(actor.x).toBe(20);
		expect(actor.y).toBe(110);
		expect(actor.dir).toBe('S');
	});

	it('face turns towards the larger difference of a point', () => {
		const actor = create();
		actor.face({ x: -10, y: 105 });
		expect(actor.dir).toBe('W');
		actor.face({ x: 2, y: 50 });
		expect(actor.dir).toBe('N');
	});

	it('face ignores unknown directions', () => {
		const actor = create();
		actor.face('E');
		actor.face('up');
		expect(actor.dir).toBe('E');
	});

	it('toJSON round trips through restore with whole pixel positions', () => {
		const actor = create();
		actor.restore({ room: 'cave', x: 10.6, y: 20.2, dir: 'W', visible: false });
		expect(actor.toJSON()).toEqual({ room: 'cave', x: 11, y: 20, dir: 'W', visible: false });
	});

	it('contains uses the costume size and scale above the feet', () => {
		const actor = create();
		actor.restore({ x: 100, y: 100 });
		actor.scale = 0.5;
		expect(actor.contains(100, 90)).toBeTrue();
		expect(actor.contains(100, 70)).toBeFalse();
		expect(actor.contains(105, 90)).toBeFalse();
	});
});
