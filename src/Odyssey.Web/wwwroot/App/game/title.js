import { ellipse, gradient, polygon, speckle } from '../engine/paint.js';

export function paintTitle(context, width, height) {
	gradient(context, 0, 0, width, 130, ['#08041c', '#1c0c3c', '#4a1650', '#a03a50', '#f08840']);
	speckle(context, 0, 0, width, 60, '#c0c0ff', 60, 3);
	ellipse(context, 160, 128, 30, 30, '#ffd070', '#fff0b0', 0.3);
	gradient(context, 0, 128, width, height - 128, ['#d07048', '#3a2a6a', '#101838', '#050510']);
	polygon(context, [0, 150, 40, 120, 70, 132, 110, 110, 140, 140, 0, 160], '#0a0612');
	polygon(context, [width, 140, 280, 104, 250, 126, 220, 118, 190, 146, width, 156], '#0a0612');
}
