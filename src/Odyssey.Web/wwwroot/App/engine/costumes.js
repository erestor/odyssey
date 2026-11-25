import { createCanvas } from './canvas.js';
import { rect } from './paint.js';

//a costume provides animation frames for an actor: frame(animation, dir, time) where animation is 'idle', 'walk' or 'talk'.
//definition { sheet: 'actors/hero.png', frameWidth, frameHeight, animations } uses a sprite sheet,
//anything else draws a placeholder figure in the given colors.
export async function createCostume(definition, assets) {
	if (definition?.sheet)
		return new SheetCostume(await assets.image(definition.sheet), definition);

	return new PlaceholderCostume(definition?.colors);
}

//sprite sheet laid out in a grid of equally sized frames, numbered left to right and top to bottom.
//animations are keyed 'walk-E', 'idle-S' etc.; west falls back to mirrored east.
export class SheetCostume {
	constructor(picture, definition) {
		this.picture = picture;
		this.width = definition.frameWidth;
		this.height = definition.frameHeight;
		this.anchorX = definition.anchorX ?? this.width / 2;
		this.anchorY = definition.anchorY ?? this.height;
		this.animations = definition.animations ?? {};
		this.columns = Math.max(1, Math.floor(picture.width / this.width));
		this.resolution = picture.source.width / picture.width;
	}

	frame(animation, dir, time) {
		let sequence = this.animations[`${animation}-${dir}`], flip = false;
		if (!sequence && dir === 'W') {
			sequence = this.animations[`${animation}-E`];
			flip = !!sequence;
		}

		sequence = sequence ?? this.animations[`${animation}-S`] ?? this.animations[animation] ?? this.animations.idle ?? { frames: [0] };
		const index = sequence.frames[Math.floor(time / 1000 * (sequence.fps ?? 8)) % sequence.frames.length],
			resolution = this.resolution;

		return {
			source: this.picture.source,
			sx: (index % this.columns) * this.width * resolution,
			sy: Math.floor(index / this.columns) * this.height * resolution,
			sw: this.width * resolution,
			sh: this.height * resolution,
			width: this.width,
			height: this.height,
			anchorX: this.anchorX,
			anchorY: this.anchorY,
			flip
		};
	}
}

const placeholderColors = {
	skin: '#e8b080',
	skinShade: '#c08860',
	hair: '#603818',
	shirt: '#d04040',
	shirtShade: '#a02828',
	pants: '#3048a0',
	shoes: '#402818',
	eyes: '#202020',
	mouth: '#802020'
};

//a 16x48 figure drawn in code, so the game is playable before any art exists
export class PlaceholderCostume {
	constructor(colors = {}) {
		this.colors = { ...placeholderColors, ...colors };
		this.width = 16;
		this.height = 48;
		this._frames = new Map();
	}

	frame(animation, dir, time) {
		const count = animation === 'walk' ? 4 : animation === 'talk' ? 2 : 1,
			fps = animation === 'walk' ? 8 : 6,
			index = Math.floor(time / 1000 * fps) % count,
			flip = dir === 'W',
			facing = flip ? 'E' : dir,
			key = `${animation}-${facing}-${index}`;

		let canvas = this._frames.get(key);
		if (!canvas) {
			canvas = this._draw(animation, facing, index);
			this._frames.set(key, canvas);
		}

		return {
			source: canvas,
			sx: 0,
			sy: 0,
			sw: this.width,
			sh: this.height,
			width: this.width,
			height: this.height,
			anchorX: this.width / 2,
			anchorY: this.height,
			flip
		};
	}

	_draw(animation, facing, index) {
		const canvas = createCanvas(this.width, this.height),
			context = canvas.getContext('2d'),
			c = this.colors,
			side = facing === 'E',
			walking = animation === 'walk',
			talking = animation === 'talk' && index === 1;

		//legs
		if (side) {
			const stride = walking ? [0, 3, 0, -3][index] : 0;
			rect(context, 6, 30, 4, 8, c.pants);
			rect(context, 6 - stride, 38, 4, 8, c.pants);
			rect(context, 6 + stride, 38, 4, 8, c.pants);
			rect(context, 6 - stride, 46, 6, 2, c.shoes);
			rect(context, 6 + stride, 46, 6, 2, c.shoes);
		}
		else {
			const lift = walking ? [0, 2, 0, -2][index] : 0,
				leftLift = Math.max(0, lift),
				rightLift = Math.max(0, -lift);

			rect(context, 4, 30, 4, 16 - leftLift, c.pants);
			rect(context, 4, 46 - leftLift, 4, 2, c.shoes);
			rect(context, 8, 30, 4, 16 - rightLift, c.pants);
			rect(context, 8, 46 - rightLift, 4, 2, c.shoes);
		}

		//torso and arms
		if (side) {
			const swing = walking ? [0, 2, 0, -2][index] : 0;
			rect(context, 5, 13, 6, 18, c.shirt);
			rect(context, 7 + swing, 15, 3, 11, c.shirtShade);
			rect(context, 7 + swing, 26, 3, 3, c.skin);
		}
		else {
			const swing = walking ? [0, 1, 0, -1][index] : 0;
			rect(context, 3, 13, 10, 18, c.shirt);
			rect(context, 1, 14 + swing, 2, 12, c.shirt);
			rect(context, 1, 26 + swing, 2, 3, c.skin);
			rect(context, 13, 14 - swing, 2, 12, c.shirt);
			rect(context, 13, 26 - swing, 2, 3, c.skin);
		}
		rect(context, 7, 12, 2, 1, c.skinShade);

		//head
		if (facing === 'N')
			rect(context, 4, 1, 8, 11, c.hair);
		else if (side) {
			rect(context, 5, 2, 7, 10, c.skin);
			rect(context, 4, 0, 7, 3, c.hair);
			rect(context, 4, 3, 3, 6, c.hair);
			rect(context, 9, 5, 1, 2, c.eyes);
			rect(context, 12, 6, 1, 2, c.skin);
			rect(context, 10, 9, 2, 1, talking ? c.mouth : c.skinShade);
		}
		else {
			rect(context, 4, 2, 8, 10, c.skin);
			rect(context, 4, 0, 8, 3, c.hair);
			rect(context, 4, 3, 1, 4, c.hair);
			rect(context, 11, 3, 1, 4, c.hair);
			rect(context, 6, 6, 1, 2, c.eyes);
			rect(context, 9, 6, 1, 2, c.eyes);
			rect(context, 7, 10, 2, 1, talking ? c.mouth : c.skinShade);
		}
		return canvas;
	}
}
