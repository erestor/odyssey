import { distance, rectContains } from './geometry.js';

const directions = ['N', 'E', 'S', 'W'];

//a character in the world; position is the point between the feet, in room coordinates
export class Actor {
	constructor(id, definition) {
		this.id = id;
		this.definition = definition;
		this.name = definition.name ?? null;
		this.talkColor = definition.talkColor ?? '#fff';
		this.speed = definition.speed ?? 64;
		this.costume = null;
		this.scale = 1;
		this.talking = false;
		this._path = [];
		this._arrived = null;
		this._time = 0;
		this.reset();
	}

	get walking() {
		return this._path.length > 0;
	}

	get interactive() {
		return this.visible && !!this.name;
	}

	reset() {
		this.restore(this.definition);
	}

	restore(data) {
		this.room = data.room ?? null;
		this.x = data.x ?? 0;
		this.y = data.y ?? 0;
		this.dir = data.dir ?? 'S';
		this.visible = data.visible ?? true;
		this.talking = false;
		this.stop();
	}

	toJSON() {
		return { room: this.room, x: Math.round(this.x), y: Math.round(this.y), dir: this.dir, visible: this.visible };
	}

	//resolves true on arrival, false when the walk was interrupted
	walk(path) {
		this._settle(false);
		this._path = [...path];
		if (!this._path.length)
			return Promise.resolve(true);

		return new Promise(resolve => {
			this._arrived = resolve;
		});
	}

	stop() {
		this._path = [];
		this._settle(false);
	}

	//target is a direction ('N', 'E', 'S', 'W') or anything with x and y
	face(target) {
		if (typeof target === 'string') {
			if (directions.includes(target))
				this.dir = target;

			return;
		}

		const dx = target.x - this.x, dy = target.y - this.y;
		if (dx || dy)
			this.dir = Math.abs(dx) >= Math.abs(dy) ? (dx < 0 ? 'W' : 'E') : (dy < 0 ? 'N' : 'S');
	}

	update(dt) {
		this._time += dt;
		let step = this.speed * this.scale * dt / 1000;
		while (step > 0 && this._path.length) {
			const target = this._path[0],
				remaining = distance(this, target);

			this.face(target);
			if (remaining <= step) {
				this.x = target.x;
				this.y = target.y;
				this._path.shift();
				step -= remaining;
			}
			else {
				this.x += (target.x - this.x) / remaining * step;
				this.y += (target.y - this.y) / remaining * step;
				step = 0;
			}
		}

		if (!this._path.length && this._arrived)
			this._settle(true);
	}

	bounds() {
		const width = (this.costume?.width ?? 16) * this.scale,
			height = (this.costume?.height ?? 48) * this.scale;

		return { x: this.x - width / 2, y: this.y - height, width, height };
	}

	contains(x, y) {
		return rectContains(this.bounds(), x, y);
	}

	draw(context) {
		if (!this.costume || !this.visible)
			return;

		const animation = this.walking ? 'walk' : this.talking ? 'talk' : 'idle',
			frame = this.costume.frame(animation, this.dir, this._time),
			width = Math.round(frame.width * this.scale),
			height = Math.round(frame.height * this.scale),
			anchorX = (frame.flip ? frame.width - frame.anchorX : frame.anchorX) * this.scale,
			left = Math.round(this.x - anchorX),
			top = Math.round(this.y - frame.anchorY * this.scale);

		context.save();
		if (frame.flip) {
			context.translate(left + width, top);
			context.scale(-1, 1);
			context.drawImage(frame.source, frame.sx, frame.sy, frame.sw, frame.sh, 0, 0, width, height);
		}
		else
			context.drawImage(frame.source, frame.sx, frame.sy, frame.sw, frame.sh, left, top, width, height);

		context.restore();
	}

	_settle(arrived) {
		const resolve = this._arrived;
		this._arrived = null;
		resolve?.(arrived);
	}
}
