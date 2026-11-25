import { closestPointOnPolygon, distance, distanceToSegment, pointInPolygon, segmentsCross, signedArea, toPoints } from './geometry.js';

const boundaryTolerance = 0.75,
	samples = [0.25, 0.5, 0.75];

//walkable area of a room: an outer polygon with optional holes (obstacles);
//paths are found with A* over a visibility graph of the corners an actor can walk around
export class WalkArea {
	constructor(outer, holes = []) {
		this.outer = outer;
		this.holes = holes;
		this.polygons = [outer, ...holes];
		this._edges = this.polygons.flatMap(polygon => polygon.map((point, index) => [point, polygon[(index + 1) % polygon.length]]));
		this._nodes = [...corners(outer, false), ...holes.flatMap(hole => corners(hole, true))];
		this._links = this._nodes.map(a => this._nodes.map(b => a !== b && this.canSee(a, b)));
	}

	//definition is a flat polygon, { outer, holes } with flat polygons, or nothing for the whole room
	static fromDefinition(definition, width, height) {
		if (!definition)
			return new WalkArea(toPoints([0, 0, width, 0, width, height, 0, height]));

		if (Array.isArray(definition))
			return new WalkArea(toPoints(definition));

		return new WalkArea(toPoints(definition.outer), (definition.holes ?? []).map(toPoints));
	}

	contains(point) {
		if (this._edges.some(([a, b]) => distanceToSegment(point, a, b) <= boundaryTolerance))
			return true;

		return pointInPolygon(point, this.outer) && !this.holes.some(hole => pointInPolygon(point, hole));
	}

	//returns the point itself when walkable, otherwise the nearest point on the boundary
	clamp(point) {
		if (this.contains(point))
			return { x: point.x, y: point.y };

		return this.polygons
			.map(polygon => closestPointOnPolygon(point, polygon))
			.reduce((best, candidate) => candidate.distance < best.distance ? candidate : best)
			.point;
	}

	canSee(a, b) {
		if (this._edges.some(([c, d]) => segmentsCross(a, b, c, d)))
			return false;

		return samples.every(t => this.contains({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }));
	}

	//returns the waypoints to walk through, excluding the starting point; empty when the target cannot be reached
	findPath(from, to) {
		const start = this.clamp(from),
			goal = this.clamp(to);

		if (this.canSee(start, goal))
			return [goal];

		const nodes = [start, goal, ...this._nodes],
			count = nodes.length,
			visible = (i, j) => i >= 2 && j >= 2 ? this._links[i - 2][j - 2] : this.canSee(nodes[i], nodes[j]),
			cost = new Array(count).fill(Infinity),
			estimate = new Array(count).fill(Infinity),
			previous = new Array(count).fill(-1),
			open = new Set([0]),
			closed = new Set();

		cost[0] = 0;
		estimate[0] = distance(start, goal);
		while (open.size) {
			let current = -1;
			for (const index of open) {
				if (current < 0 || estimate[index] < estimate[current])
					current = index;
			}

			if (current === 1)
				return reconstruct(previous, nodes);

			open.delete(current);
			closed.add(current);
			for (let next = 1; next < count; next++) {
				if (next === current || closed.has(next) || !visible(current, next))
					continue;

				const tentative = cost[current] + distance(nodes[current], nodes[next]);
				if (tentative < cost[next]) {
					previous[next] = current;
					cost[next] = tentative;
					estimate[next] = tentative + distance(nodes[next], goal);
					open.add(next);
				}
			}
		}
		return [];
	}
}

//concave corners of the outer polygon and convex corners of holes are the only places a shortest path turns
function corners(polygon, convex) {
	const winding = Math.sign(signedArea(polygon));
	return polygon.filter((point, index) => {
		const previous = polygon[(index + polygon.length - 1) % polygon.length],
			next = polygon[(index + 1) % polygon.length],
			cross = (point.x - previous.x) * (next.y - point.y) - (point.y - previous.y) * (next.x - point.x);

		return convex ? cross * winding > 0 : cross * winding < 0;
	});
}

function reconstruct(previous, nodes) {
	const path = [];
	for (let index = 1; index > 0; index = previous[index])
		path.unshift({ x: nodes[index].x, y: nodes[index].y });

	return path;
}
