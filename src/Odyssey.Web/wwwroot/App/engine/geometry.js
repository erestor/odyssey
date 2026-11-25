//points are { x, y }; polygons are arrays of points. Content files write polygons as flat coordinate lists [x1, y1, x2, y2, ...].
export function toPoints(flat) {
	const points = [];
	for (let i = 0; i + 1 < flat.length; i += 2)
		points.push({ x: flat[i], y: flat[i + 1] });

	return points;
}

export function distance(a, b) {
	return Math.hypot(a.x - b.x, a.y - b.y);
}

export function signedArea(polygon) {
	let area = 0;
	polygon.forEach((point, index) => {
		const next = polygon[(index + 1) % polygon.length];
		area += point.x * next.y - next.x * point.y;
	});
	return area / 2;
}

export function pointInPolygon(point, polygon) {
	let inside = false;
	for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
		const a = polygon[i], b = polygon[j];
		if ((a.y > point.y) !== (b.y > point.y) && point.x < (b.x - a.x) * (point.y - a.y) / (b.y - a.y) + a.x)
			inside = !inside;
	}
	return inside;
}

export function closestPointOnSegment(point, a, b) {
	const dx = b.x - a.x,
		dy = b.y - a.y,
		lengthSquared = dx * dx + dy * dy,
		t = lengthSquared ? Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared)) : 0;

	return { x: a.x + dx * t, y: a.y + dy * t };
}

export function distanceToSegment(point, a, b) {
	return distance(point, closestPointOnSegment(point, a, b));
}

export function closestPointOnPolygon(point, polygon) {
	let best = null;
	polygon.forEach((a, index) => {
		const candidate = closestPointOnSegment(point, a, polygon[(index + 1) % polygon.length]),
			candidateDistance = distance(point, candidate);

		if (!best || candidateDistance < best.distance)
			best = { point: candidate, distance: candidateDistance };
	});
	return best;
}

//true when the segments cross at a point inside both of them; touching at an endpoint or overlapping collinearly is not a crossing
export function segmentsCross(a, b, c, d) {
	return orientation(c, d, a) * orientation(c, d, b) < 0 && orientation(a, b, c) * orientation(a, b, d) < 0;
}

function orientation(a, b, c) {
	const value = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
	return Math.abs(value) < 1e-9 ? 0 : Math.sign(value);
}
