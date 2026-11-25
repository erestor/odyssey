import { closestPointOnPolygon, pointInPolygon, rectContains, segmentsCross, signedArea, toPoints } from '../App/engine/geometry.js';

describe('geometry', () => {
	const square = toPoints([0, 0, 10, 0, 10, 10, 0, 10]);

	it('toPoints converts a flat list to points', () => {
		expect(toPoints([1, 2, 3, 4])).toEqual([{ x: 1, y: 2 }, { x: 3, y: 4 }]);
	});

	it('pointInPolygon is true inside and false outside', () => {
		expect(pointInPolygon({ x: 5, y: 5 }, square)).toBeTrue();
		expect(pointInPolygon({ x: 15, y: 5 }, square)).toBeFalse();
	});

	it('rectContains includes the top left edge and excludes the bottom right edge', () => {
		const rect = { x: 10, y: 20, width: 5, height: 5 };
		expect(rectContains(rect, 10, 20)).toBeTrue();
		expect(rectContains(rect, 14, 24)).toBeTrue();
		expect(rectContains(rect, 15, 22)).toBeFalse();
		expect(rectContains(rect, 12, 25)).toBeFalse();
	});

	it('segmentsCross detects a proper crossing', () => {
		expect(segmentsCross({ x: 0, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }, { x: 10, y: 0 })).toBeTrue();
	});

	it('segmentsCross ignores segments touching at an endpoint', () => {
		expect(segmentsCross({ x: 0, y: 0 }, { x: 5, y: 5 }, { x: 5, y: 5 }, { x: 10, y: 0 })).toBeFalse();
	});

	it('segmentsCross ignores collinear segments', () => {
		expect(segmentsCross({ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: 0 }, { x: 15, y: 0 })).toBeFalse();
	});

	it('closestPointOnPolygon projects onto the nearest edge', () => {
		const result = closestPointOnPolygon({ x: 5, y: -4 }, square);
		expect(result.point).toEqual({ x: 5, y: 0 });
		expect(result.distance).toBe(4);
	});

	it('signedArea has opposite signs for opposite windings', () => {
		expect(signedArea(square)).toBe(100);
		expect(signedArea([...square].reverse())).toBe(-100);
	});
});
