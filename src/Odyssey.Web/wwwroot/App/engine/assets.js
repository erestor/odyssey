import { createSurface } from './canvas.js';

//loads pictures for the current render profile; a picture is an image source together with its size in logical pixels,
//so a 640x400 '@2x' background and a 320x200 one are both drawn as 320x200
export class Assets {
	constructor(baseUrl) {
		this.baseUrl = new URL(baseUrl, document.baseURI);
		this.renderScale = 1;
		this.suffixes = [''];
		this._images = new Map();
	}

	configure({ renderScale, suffixes }) {
		this.renderScale = renderScale;
		this.suffixes = suffixes;
		this._images.clear();
	}

	//spec is either a path relative to the assets folder or a painter function (context, width, height) => {}
	async picture(spec, width, height) {
		if (!spec)
			return null;

		if (typeof spec === 'function')
			return this.paint(width, height, spec);

		return this.image(spec);
	}

	paint(width, height, painter) {
		const { canvas, context } = createSurface(width, height, this.renderScale);
		painter(context, width, height);
		return { source: canvas, width, height };
	}

	image(path) {
		let promise = this._images.get(path);
		if (!promise) {
			promise = this._loadImage(path);
			this._images.set(path, promise);
		}
		return promise;
	}

	async _loadImage(path) {
		for (const suffix of this.suffixes) {
			const resolution = parseInt(suffix.slice(1)) || 1;
			try {
				const image = await loadImage(new URL(withSuffix(path, suffix), this.baseUrl));
				return { source: image, width: image.naturalWidth / resolution, height: image.naturalHeight / resolution };
			}
			catch {
				//fall back to the next resolution variant
			}
		}
		throw new Error(`Image not found: ${path}`);
	}
}

function withSuffix(path, suffix) {
	const dot = path.lastIndexOf('.');
	return dot < 0 ? path + suffix : path.slice(0, dot) + suffix + path.slice(dot);
}

function loadImage(url) {
	return new Promise((resolve, reject) => {
		const image = new Image();
		image.onload = () => resolve(image);
		image.onerror = () => reject(new Error(`Cannot load ${url}`));
		image.src = url;
	});
}
