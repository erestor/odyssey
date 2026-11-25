import { Actor } from './actor.js';
import { createApi } from './api.js';
import { Assets } from './assets.js';
import { clamp } from './canvas.js';
import { defaultSettings, logicalHeight, logicalWidth, renderProfiles, textTiming, timing } from './config.js';
import { createCostume } from './costumes.js';
import { Display } from './display.js';
import { Input } from './input.js';
import { Room } from './room.js';
import { GameState } from './state.js';
import { Storage } from './storage.js';
import { TextRenderer } from './text.js';
import { Cursor } from './ui/cursor.js';
import { DialogChoices } from './ui/dialog-choices.js';
import { iconHeight, iconWidth, InventoryPanel } from './ui/inventory.js';
import { openPauseMenu, openTitleMenu } from './ui/screens.js';
import { colors } from './ui/theme.js';

const defaultMessages = {
	look: ['Nothing special about it.', 'Just what it looks like.', 'Hmm. Interesting. Not really.'],
	interact: ['I can\'t do anything with that.', 'That won\'t work.', 'Nope.'],
	useItem: ['That doesn\'t work.', 'I don\'t think so.', 'Why would I do that?'],
	combine: ['Those don\'t go together.', 'That doesn\'t work.'],
	useLabel: (item, target) => target ? `Use ${item} with ${target}` : `Use ${item} with...`,
	emptyInventory: 'Your pockets are empty.',
	saved: 'Game saved.'
};

//runs the game: the main loop, routing of input, rooms, actors, speech, scripts, saving and loading
export class Game {
	constructor(container, definition) {
		this.definition = definition;
		this.messages = { ...defaultMessages, ...definition.messages };
		this.storage = new Storage(definition.id);
		this.settings = this.storage.loadSettings(defaultSettings);
		this.display = new Display(container);
		this.input = new Input(this.display);
		this.assets = new Assets(definition.assetsUrl ?? 'Assets/');
		this.api = createApi(this);
		this.cursor = new Cursor(this);
		this.text = null;
		this.mode = 'loading';
		this.state = null;
		this.room = null;
		this.actors = new Map(Object.entries(definition.actors ?? {}).map(([id, actor]) => [id, new Actor(id, actor)]));
		this.itemIcons = new Map();
		this.titlePicture = null;
		this.overlays = [];
		this.texts = [];
		this.busy = 0;
		this.cutscenes = 0;
		this.heldItem = null;
		this.hover = null;
		this.cameraX = 0;
		this.time = 0;
		this.fade = { level: 0, target: 0, resolve: null };
		this._renderScale = 0;
		this._rooms = new Map();
		this._timers = [];
		this._last = 0;
		this._accumulator = 0;
	}

	get player() {
		return this.actors.get(this.definition.player);
	}

	async start() {
		await this.applySettings();
		this.mode = 'title';
		await openTitleMenu(this);
		requestAnimationFrame(now => this._frame(now));
	}

	async applySettings() {
		const settings = this.settings,
			profile = renderProfiles[settings.profile] ?? renderProfiles.vga;

		this.display.configure({ renderScale: profile.renderScale, scaleMode: settings.scaleMode, aspectCorrection: settings.aspectCorrection });
		if (profile.renderScale !== this._renderScale) {
			this._renderScale = profile.renderScale;
			this.assets.configure({ renderScale: profile.renderScale, suffixes: profile.assetSuffixes });
			this.text = new TextRenderer(profile.renderScale);
			await this._loadResources();
		}
		this.storage.saveSettings(settings);
	}

	//game flow

	async newGame() {
		this.closeAllOverlays();
		this._reset(new GameState());
		const start = this.definition.start;
		await this.enterRoom(start.room, start.entry);
	}

	async loadGame(slot) {
		const record = await this.storage.load(slot);
		if (!record)
			return;

		this.closeAllOverlays();
		this._reset(new GameState(record.state));
		for (const [id, data] of Object.entries(this.state.actors))
			this.actors.get(id)?.restore(data);

		this._showRoom(await this._getRoom(this.state.room));
		await this._fadeTo(0);
	}

	async saveGame(slot) {
		this.state.actors = Object.fromEntries([...this.actors].map(([id, actor]) => [id, actor.toJSON()]));
		await this.storage.save(slot, { label: this.room.name, savedAt: Date.now(), state: this.state.toJSON() });
	}

	quitToTitle() {
		this.closeAllOverlays();
		this._reset(null);
		this.mode = 'title';
		this.fade.level = 0;
		openTitleMenu(this);
	}

	async enterRoom(id, entryName) {
		this.busy++;
		try {
			if (this.room) {
				await this.room.definition.onLeave?.(this.api);
				await this._fadeTo(1);
			}

			this.skipTexts();
			const room = await this._getRoom(id),
				entry = room.entry(entryName),
				player = this.player,
				firstVisit = !this.state.visited[id];

			player.restore({ room: id, x: entry.x, y: entry.y, dir: entry.dir ?? 'S' });
			this.state.visited[id] = true;
			this._showRoom(room);
			await this._fadeTo(0);
			await room.definition.onEnter?.(this.api, { firstVisit, entry: entryName });
		}
		finally {
			this.busy--;
		}
		this._autosave();
	}

	//scripting services used by the api

	say(actorId, text) {
		if (Array.isArray(text))
			return this._sayLines(actorId, text);

		const actor = actorId ? this.actors.get(actorId) : null;
		this.texts.filter(line => line.actor === actor).forEach(line => this._finishText(line));
		return new Promise(resolve => {
			const duration = Math.max(textTiming.minMs, String(text).length * textTiming.charMs) / this.settings.textSpeed;
			this.texts.push({ actor, text, color: actor?.talkColor ?? this.definition.narratorColor ?? '#ffff80', remaining: duration, resolve });
			if (actor)
				actor.talking = true;
		});
	}

	skipTexts() {
		[...this.texts].forEach(line => this._finishText(line));
	}

	wait(ms) {
		return new Promise(resolve => this._timers.push({ remaining: ms, resolve }));
	}

	walkActor(actor, point) {
		if (!this.room || actor.room !== this.room.id) {
			actor.x = point.x;
			actor.y = point.y;
			return Promise.resolve(true);
		}
		return actor.walk(this.room.walkArea.findPath(actor, point));
	}

	async cutscene(script) {
		this.cutscenes++;
		this.busy++;
		try {
			await script(this.api);
		}
		finally {
			this.cutscenes--;
			this.busy--;
		}
	}

	//runs a script as a blocking interaction; errors are logged so a broken script does not freeze the game
	async run(script, ...args) {
		this.busy++;
		try {
			await script(this.api, ...args);
		}
		catch (error) {
			console.error(error);
		}
		finally {
			this.busy--;
		}
	}

	choose(texts) {
		return new Promise(resolve => this.openOverlay(new DialogChoices(this, texts, resolve)));
	}

	//dialog = { id, start, nodes: { name: { options: [{ id, text, once, when, say, run, goto, end }] } } }
	async runDialog(dialog) {
		const dialogs = this.state.dialogs;
		if (!dialogs[dialog.id])
			dialogs[dialog.id] = { chosen: [] };

		const chosen = dialogs[dialog.id].chosen;
		let node = dialog.nodes[dialog.start ?? 'root'];
		while (node) {
			const options = node.options.filter(option => !(option.once && chosen.includes(option.id)) && (!option.when || option.when(this.api)));
			if (!options.length)
				return;

			const option = options[await this.choose(options.map(item => item.text))];
			if (!chosen.includes(option.id))
				chosen.push(option.id);

			if (option.say !== false)
				await this.say(this.definition.player, option.text);

			await option.run?.(this.api);
			if (option.end)
				return;

			if (option.goto)
				node = dialog.nodes[option.goto];
		}
	}

	addItem(id) {
		if (!this.state.inventory.includes(id))
			this.state.inventory.push(id);
	}

	removeItem(id) {
		this.state.inventory = this.state.inventory.filter(item => item !== id);
		if (this.heldItem === id)
			this.heldItem = null;
	}

	itemName(id) {
		return this.definition.items?.[id]?.name ?? id;
	}

	lookAtItem(id) {
		this.run(this.definition.items?.[id]?.look ?? this._defaultReply('look'));
	}

	combineItems(held, other) {
		const items = this.definition.items ?? {},
			handler = items[held]?.combine?.[other] ?? items[other]?.combine?.[held];

		this.heldItem = null;
		this.run(handler ?? this._defaultReply('combine'));
	}

	//overlays (menus, inventory, dialog choices) receive input before the world

	openOverlay(overlay) {
		this.overlays.push(overlay);
	}

	closeOverlay(overlay) {
		this.overlays = this.overlays.filter(item => item !== overlay);
	}

	closeAllOverlays() {
		this.overlays = [];
	}

	openInventory() {
		this.openOverlay(new InventoryPanel(this));
	}

	//main loop

	_frame(now) {
		const elapsed = Math.min(now - (this._last || now), timing.maxFrame);
		this._last = now;
		this._accumulator += elapsed;
		while (this._accumulator >= timing.step) {
			this._update(timing.step);
			this._accumulator -= timing.step;
		}
		this._render();
		requestAnimationFrame(next => this._frame(next));
	}

	_update(dt) {
		this.time += dt;
		for (const event of this.input.poll())
			this._handleEvent(event);

		this._updateFade(dt);
		this.overlays.forEach(overlay => overlay.update?.(dt));
		if (this.mode !== 'play' || !this.room || this.overlays.some(overlay => overlay.pauses))
			return;

		this.state.playTime += dt;
		this._updateTimers(dt);
		this._updateTexts(dt);
		for (const actor of this._actorsInRoom()) {
			actor.scale = this.room.scaleAt(actor.y);
			actor.update(dt);
		}
		this._updateCamera(dt);

		const pointer = this.input.pointer;
		this.hover = !this.busy && !this.overlays.length && pointer.inside ? this._targetAt(pointer.x, pointer.y) : null;
	}

	_handleEvent(event) {
		const overlay = this.overlays.at(-1);
		if (overlay)
			overlay.handle(event);
		else if (this.mode === 'play' && this.room) {
			if (event.type === 'key')
				this._handleKey(event.key);
			else if (event.type === 'click')
				this._handleClick(event);
		}
	}

	_handleKey(key) {
		if (key === '.' || key === ' ')
			this.skipTexts();
		else if (key === 'Escape') {
			if (this.heldItem)
				this.heldItem = null;
			else if (this.busy)
				this.skipTexts();
			else
				openPauseMenu(this);
		}
		else if ((key === 'i' || key === 'I') && !this.busy)
			this.openInventory();
		else if (key === 'f' || key === 'F')
			this.display.toggleFullscreen();
	}

	_handleClick({ x, y, button }) {
		if (this.busy) {
			this.skipTexts();
			return;
		}

		if (InventoryPanel.buttonContains(x, y)) {
			this.openInventory();
			return;
		}

		const target = this._targetAt(x, y),
			point = { x: x + Math.round(this.cameraX), y };

		if (button === 2) {
			if (this.heldItem)
				this.heldItem = null;
			else if (target)
				this._interact(target, 'look', point);
		}
		else if (target)
			this._interact(target, this.heldItem ? 'useItem' : 'interact', point);
		else
			this.walkActor(this.player, point);
	}

	//walks the player to the target (except when just looking) and runs the matching handler of its definition
	async _interact(target, verb, point) {
		const player = this.player,
			definition = target.definition,
			item = this.heldItem;

		if (verb === 'useItem')
			this.heldItem = null;

		if (verb === 'look')
			player.face(target.point);
		else {
			const arrived = await this.walkActor(player, this._walkDestination(target, point));
			if (!arrived)
				return;

			player.face(definition.walkTo?.dir ?? target.point);
		}
		await this.run(this._handler(target, verb, item), definition);
	}

	_handler(target, verb, item) {
		const definition = target.definition;
		if (verb === 'look')
			return definition.look ?? this._defaultReply('look');

		if (verb === 'interact') {
			if (definition.interact)
				return definition.interact;

			if (definition.exit)
				return () => this.enterRoom(definition.exit.room, definition.exit.entry);

			return this._defaultReply('interact');
		}

		return definition.useItem?.[item] ??
			definition.useItem?.default ??
			this.definition.items?.[item]?.useOn?.[definition.id ?? target.actor?.id] ??
			this._defaultReply('useItem');
	}

	_defaultReply(kind) {
		return g => g.say(g.random(this.messages[kind]));
	}

	_walkDestination(target, point) {
		const walkTo = target.definition.walkTo;
		if (walkTo)
			return walkTo;

		if (target.actor) {
			const actor = target.actor,
				side = this.player.x < actor.x ? -1 : 1;

			return { x: actor.x + side * 24 * actor.scale, y: actor.y };
		}
		return point;
	}

	_targetAt(x, y) {
		const roomX = x + Math.round(this.cameraX),
			actor = this._actorsInRoom()
				.filter(candidate => candidate !== this.player && candidate.interactive && candidate.contains(roomX, y))
				.sort((a, b) => b.y - a.y)[0];

		if (actor)
			return { name: actor.name, definition: actor.definition, actor, point: { x: actor.x, y: actor.y } };

		const object = this.room.objectAt(roomX, y, this.api);
		if (object)
			return { name: object.name, definition: object.definition, object, point: { x: roomX, y } };

		return null;
	}

	_actorsInRoom() {
		return [...this.actors.values()].filter(actor => actor.room === this.room?.id && actor.visible);
	}

	_updateTimers(dt) {
		const due = [];
		this._timers = this._timers.filter(timer => {
			timer.remaining -= dt;
			if (timer.remaining > 0)
				return true;

			due.push(timer);
			return false;
		});
		due.forEach(timer => timer.resolve());
	}

	_updateTexts(dt) {
		this.texts.forEach(line => {
			line.remaining -= dt;
		});
		this.texts.filter(line => line.remaining <= 0).forEach(line => this._finishText(line));
	}

	_finishText(line) {
		this.texts = this.texts.filter(item => item !== line);
		if (line.actor && !this.texts.some(item => item.actor === line.actor))
			line.actor.talking = false;

		line.resolve();
	}

	async _sayLines(actorId, lines) {
		for (const line of lines)
			await this.say(actorId, line);
	}

	_updateCamera(dt, snap = false) {
		const maxX = Math.max(0, this.room.width - logicalWidth),
			playerX = this.player.x;

		if (snap) {
			this.cameraX = clamp(playerX - logicalWidth / 2, 0, maxX);
			return;
		}

		let target = this.cameraX;
		if (playerX - target < timing.cameraMargin)
			target = playerX - timing.cameraMargin;
		else if (playerX - target > logicalWidth - timing.cameraMargin)
			target = playerX - logicalWidth + timing.cameraMargin;

		const step = timing.cameraSpeed * dt / 1000;
		this.cameraX = clamp(this.cameraX + clamp(clamp(target, 0, maxX) - this.cameraX, -step, step), 0, maxX);
	}

	_fadeTo(level) {
		if (this.fade.level === level)
			return Promise.resolve();

		this.fade.resolve?.();
		return new Promise(resolve => {
			this.fade.target = level;
			this.fade.resolve = resolve;
		});
	}

	_updateFade(dt) {
		const fade = this.fade;
		if (!fade.resolve)
			return;

		const step = dt / timing.fade;
		fade.level = fade.level < fade.target ? Math.min(fade.target, fade.level + step) : Math.max(fade.target, fade.level - step);
		if (fade.level === fade.target) {
			const resolve = fade.resolve;
			fade.resolve = null;
			resolve();
		}
	}

	_reset(state) {
		this.state = state;
		this.room = null;
		this.texts = [];
		this._timers = [];
		this.heldItem = null;
		this.hover = null;
		this.busy = 0;
		this.cutscenes = 0;
		this.fade.level = 1;
		this.fade.resolve = null;
		this.actors.forEach(actor => actor.reset());
		if (state)
			this.mode = 'play';
	}

	_showRoom(room) {
		this.room = room;
		this.state.room = room.id;
		this.hover = null;
		this._actorsInRoom().forEach(actor => {
			actor.scale = room.scaleAt(actor.y);
		});
		this._updateCamera(0, true);
	}

	async _getRoom(id) {
		let room = this._rooms.get(id);
		if (!room) {
			const definition = this.definition.rooms[id];
			if (!definition)
				throw new Error(`Unknown room: ${id}`);

			room = await Room.load(id, definition, this.assets);
			this._rooms.set(id, room);
		}
		return room;
	}

	//(re)creates everything that depends on the render profile
	async _loadResources() {
		const items = Object.entries(this.definition.items ?? {}),
			icons = await Promise.all(items.map(async ([id, item]) => [id, await this.assets.picture(item.icon, iconWidth, iconHeight)]));

		this.itemIcons = new Map(icons);
		this.titlePicture = await this.assets.picture(this.definition.titleScreen, logicalWidth, logicalHeight);
		await Promise.all([...this.actors.values()].map(async actor => {
			actor.costume = await createCostume(actor.definition.costume, this.assets);
		}));

		this._rooms.clear();
		if (this.room)
			this.room = await this._getRoom(this.room.id);
	}

	_autosave() {
		if (this.mode === 'play' && this.room)
			this.saveGame(0).catch(error => console.error(error));
	}

	//rendering

	_render() {
		const context = this.display.begin();
		if (this.mode === 'title')
			this._renderTitle(context);
		else if (this.mode === 'play' && this.room) {
			this._renderWorld(context);
			if (!this.overlays.some(overlay => overlay.covers))
				this._renderHud(context);
		}

		this.overlays.forEach(overlay => overlay.draw(context));
		if (this.fade.level > 0) {
			context.globalAlpha = Math.round(this.fade.level * 8) / 8;
			context.fillStyle = '#000';
			context.fillRect(0, 0, logicalWidth, logicalHeight);
			context.globalAlpha = 1;
		}
		this.cursor.draw(context);
		this.display.present();
	}

	_renderTitle(context) {
		const picture = this.titlePicture;
		if (picture)
			context.drawImage(picture.source, 0, 0, picture.width, picture.height);

		this.text.draw(context, this.definition.name ?? '', logicalWidth / 2, 28, { color: colors.title, scale: 3 });
	}

	_renderWorld(context) {
		const room = this.room,
			camera = Math.round(this.cameraX),
			background = room.background;

		context.save();
		context.translate(-camera, 0);
		if (background)
			context.drawImage(background.source, 0, 0, background.width, background.height);

		const objects = room.objects
				.filter(object => object.hasVisual && object.isVisible(this.api))
				.map(object => ({ baseline: object.baseline, draw: () => object.draw(context, this.time, this.api) })),
			actors = this._actorsInRoom().map(actor => ({ baseline: actor.y, draw: () => actor.draw(context) }));

		[...objects, ...actors]
			.sort((a, b) => a.baseline - b.baseline)
			.forEach(drawable => drawable.draw());

		context.restore();
		this._renderTexts(context, camera);
	}

	_renderTexts(context, camera) {
		for (const line of this.texts) {
			const actor = line.actor,
				anchored = actor && actor.room === this.room.id && actor.visible,
				picture = this.text.render(line.text, { color: line.color, maxWidth: anchored ? 200 : 280 });

			let x = logicalWidth / 2, y = 8;
			if (anchored) {
				x = actor.x - camera;
				y = actor.bounds().y - picture.height - 2;
			}
			x = clamp(x, picture.width / 2 + 1, logicalWidth - picture.width / 2 - 1);
			y = clamp(y, 1, logicalHeight - picture.height - 1);
			context.drawImage(picture.source, Math.round(x - picture.width / 2), Math.round(y), picture.width, picture.height);
		}
	}

	_renderHud(context) {
		if (this.cutscenes)
			return;

		const pointer = this.input.pointer;
		InventoryPanel.drawButton(context, !this.busy && pointer.inside && InventoryPanel.buttonContains(pointer.x, pointer.y));
		if (this.busy)
			return;

		const label = this.heldItem ? this.messages.useLabel(this.itemName(this.heldItem), this.hover?.name) : this.hover?.name;
		if (label)
			this.text.draw(context, label, logicalWidth / 2, logicalHeight - 13, { color: colors.label });
	}
}
