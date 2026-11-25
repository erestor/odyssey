const longPressMs = 450,
	preventedKeys = [' ', 'Escape', 'ArrowUp', 'ArrowDown', 'Enter', 'Tab'];

//collects mouse, touch and keyboard input as a queue of events the game consumes once per update;
//a touch tap is a left click and a long press is a right click
export class Input {
	constructor(display) {
		this.display = display;
		this.pointer = { x: 0, y: 0, inside: false };
		this._events = [];
		this._touchStart = null;

		const canvas = display.canvas;
		canvas.addEventListener('pointermove', event => this._move(event));
		canvas.addEventListener('pointerdown', event => this._down(event));
		canvas.addEventListener('pointerup', event => this._up(event));
		canvas.addEventListener('pointerleave', () => {
			this.pointer.inside = false;
		});
		canvas.addEventListener('contextmenu', event => event.preventDefault());
		window.addEventListener('keydown', event => this._key(event));
	}

	poll() {
		const events = this._events;
		this._events = [];
		return events;
	}

	_move(event) {
		const point = this.display.toLogical(event.clientX, event.clientY);
		this.pointer.x = point.x;
		this.pointer.y = point.y;
		this.pointer.inside = true;
	}

	_down(event) {
		event.preventDefault();
		this._move(event);
		if (event.pointerType === 'touch')
			this._touchStart = event.timeStamp;
		else if (event.button === 0 || event.button === 2)
			this._click(event.button);
	}

	_up(event) {
		if (event.pointerType !== 'touch' || this._touchStart === null)
			return;

		const pressed = event.timeStamp - this._touchStart;
		this._touchStart = null;
		this._move(event);
		this._click(pressed >= longPressMs ? 2 : 0);
	}

	_click(button) {
		this._events.push({ type: 'click', button, x: this.pointer.x, y: this.pointer.y });
	}

	_key(event) {
		if (event.ctrlKey || event.metaKey || event.altKey)
			return;

		if (preventedKeys.includes(event.key))
			event.preventDefault();

		this._events.push({ type: 'key', key: event.key });
	}
}
