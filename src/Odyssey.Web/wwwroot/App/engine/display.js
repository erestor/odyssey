import { createCanvas } from './canvas.js';
import { logicalHeight, logicalWidth } from './config.js';

//VGA pixels were 20% taller than wide: 320x200 filled a 4:3 monitor. The default is square pixels (16:10),
//aspect correction shows the game in the 4:3 shape of the original monitors
const vgaPixelAspect = 1.2;

//owns the visible canvas and the low resolution back buffer that the game draws into
export class Display {
	constructor(container) {
		this.container = container;
		this.width = logicalWidth;
		this.height = logicalHeight;
		this.renderScale = 1;
		this.scaleMode = 'integer';
		this.aspectCorrection = false;
		this.canvas = createCanvas(this.width, this.height);
		this.canvas.className = 'screen';
		this.context = this.canvas.getContext('2d');
		this.buffer = createCanvas(this.width, this.height);
		this.bufferContext = this.buffer.getContext('2d');
		container.appendChild(this.canvas);
		new ResizeObserver(() => this.resize()).observe(container);
	}

	configure({ renderScale, scaleMode, aspectCorrection }) {
		this.renderScale = renderScale;
		this.scaleMode = scaleMode;
		this.aspectCorrection = aspectCorrection;
		this.buffer.width = this.width * renderScale;
		this.buffer.height = this.height * renderScale;
		this.resize();
	}

	resize() {
		const ratio = window.devicePixelRatio || 1,
			availableWidth = this.container.clientWidth * ratio,
			availableHeight = this.container.clientHeight * ratio,
			aspect = this.aspectCorrection ? vgaPixelAspect : 1;

		let scale = Math.min(availableWidth / this.width, availableHeight / (this.height * aspect));
		if (this.scaleMode === 'none')
			scale = Math.min(scale, 1); //one game pixel per screen pixel, smaller only when the window is too small
		else if (this.scaleMode === 'integer' && scale >= 1)
			scale = Math.floor(scale);

		const width = Math.max(1, Math.round(this.width * scale)),
			height = Math.max(1, Math.round(this.height * aspect * scale));

		this.canvas.width = width;
		this.canvas.height = height;
		this.canvas.style.width = `${width / ratio}px`;
		this.canvas.style.height = `${height / ratio}px`;
	}

	//returns the buffer context prepared for drawing in logical pixels
	begin() {
		const context = this.bufferContext;
		context.setTransform(this.renderScale, 0, 0, this.renderScale, 0, 0);
		context.imageSmoothingEnabled = false;
		context.globalAlpha = 1;
		context.fillStyle = '#000';
		context.fillRect(0, 0, this.width, this.height);
		return context;
	}

	present() {
		this.context.imageSmoothingEnabled = false;
		this.context.drawImage(this.buffer, 0, 0, this.canvas.width, this.canvas.height);
	}

	toLogical(clientX, clientY) {
		const rect = this.canvas.getBoundingClientRect();
		return {
			x: Math.floor((clientX - rect.left) / rect.width * this.width),
			y: Math.floor((clientY - rect.top) / rect.height * this.height)
		};
	}

	toggleFullscreen() {
		if (document.fullscreenElement)
			document.exitFullscreen();
		else
			this.container.requestFullscreen?.();
	}
}
