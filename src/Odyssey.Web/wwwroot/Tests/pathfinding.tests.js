import { toPoints } from '../App/engine/geometry.js';
import { WalkArea } from '../App/engine/pathfinding.js';

describe('WalkArea', () => {
	//U shape: two legs joined at the bottom, the gap between them is not walkable
	const uShape = new WalkArea(toPoints([0, 0, 40, 0, 40, 80, 60, 80, 60, 0, 100, 0, 100, 100, 0, 100])),
		withHole = new WalkArea(toPoints([0, 0, 100, 0, 100, 100, 0, 100]), [toPoints([40, 40, 60, 40, 60, 60, 40, 60])]);

	const expectWalkable = (area, from, path) => {
		let previous = from;
		for (const point of path) {
			expect(area.canSee(previous, point)).withContext(`${previous.x},${previous.y} -> ${point.x},${point.y}`).toBeTrue();
			previous = point;
		}
	};

	it('findPath goes straight when the target is visible', () => {
		expect(uShape.findPath({ x: 10, y: 10 }, { x: 10, y: 90 })).toEqual([{ x: 10, y: 90 }]);
	});

	it('findPath walks around the inner corners of a concave area', () => {
		const from = { x: 20, y: 10 },
			path = uShape.findPath(from, { x: 80, y: 10 });

		expect(path).toEqual([{ x: 40, y: 80 }, { x: 60, y: 80 }, { x: 80, y: 10 }]);
		expectWalkable(uShape, from, path);
	});

	it('findPath walks around a hole', () => {
		const from = { x: 50, y: 20 },
			path = withHole.findPath(from, { x: 50, y: 80 });

		expect(path.length).toBe(3);
		expect(path.at(-1)).toEqual({ x: 50, y: 80 });
		expectWalkable(withHole, from, path);
	});

	it('findPath clamps an unwalkable target to the nearest boundary point', () => {
		const path = uShape.findPath({ x: 20, y: 90 }, { x: 50, y: 40 });
		expect(path.at(-1)).toEqual({ x: 40, y: 40 });
	});

	it('contains excludes holes and includes boundaries', () => {
		expect(withHole.contains({ x: 50, y: 50 })).toBeFalse();
		expect(withHole.contains({ x: 40, y: 50 })).toBeTrue();
		expect(withHole.contains({ x: 20, y: 20 })).toBeTrue();
	});

	it('fromDefinition without a definition covers the whole room', () => {
		const area = WalkArea.fromDefinition(null, 320, 200);
		expect(area.contains({ x: 319, y: 199 })).toBeTrue();
		expect(area.contains({ x: 330, y: 100 })).toBeFalse();
	});
});
