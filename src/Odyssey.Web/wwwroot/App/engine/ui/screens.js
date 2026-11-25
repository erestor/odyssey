import { renderProfiles } from '../config.js';
import { Menu } from './menu.js';

const saveSlots = 8,
	textSpeeds = [{ value: 0.6, name: 'Slow' }, { value: 1, name: 'Normal' }, { value: 1.6, name: 'Fast' }];

export async function openTitleMenu(game) {
	const saves = await game.storage.list(),
		latest = saves.reduce((best, save) => !best || save.savedAt > best.savedAt ? save : best, null);

	game.openOverlay(new Menu(game, {
		top: 112,
		items: [
			{ label: 'New game', action: () => game.newGame() },
			{ label: 'Continue', action: () => game.loadGame(latest.slot), disabled: () => !latest },
			{ label: 'Load game', action: () => openLoadMenu(game, saves), disabled: () => !saves.length },
			{ label: 'Settings', action: () => openSettingsMenu(game) }
		]
	}));
}

export function openPauseMenu(game) {
	openSubmenu(game, 'Paused', [
		{ label: 'Save game', action: async () => openSaveMenu(game, await game.storage.list()) },
		{ label: 'Load game', action: async () => openLoadMenu(game, await game.storage.list()) },
		{ label: 'Settings', action: () => openSettingsMenu(game) },
		{ label: 'Quit to title', action: () => game.quitToTitle() }
	], 'Resume', true);
}

function openSaveMenu(game, saves) {
	openSubmenu(game, 'Save game', slotNumbers(1).map(slot => ({
		label: slotLabel(slot, saves),
		action: async () => {
			await game.saveGame(slot);
			game.closeAllOverlays();
			game.say(null, game.messages.saved);
		}
	})));
}

function openLoadMenu(game, saves) {
	openSubmenu(game, 'Load game', slotNumbers(0).map(slot => ({
		label: slotLabel(slot, saves),
		action: () => game.loadGame(slot),
		disabled: () => !saves.some(save => save.slot === slot)
	})));
}

function openSettingsMenu(game) {
	const settings = game.settings,
		change = async (name, value) => {
			settings[name] = value;
			await game.applySettings();
		},
		profiles = Object.values(renderProfiles);

	openSubmenu(game, 'Settings', [
		{
			label: () => `Text speed: ${textSpeeds.find(speed => speed.value === settings.textSpeed)?.name ?? 'Normal'}`,
			action: () => change('textSpeed', next(textSpeeds, speed => speed.value === settings.textSpeed).value)
		},
		{
			label: () => `Scaling: ${settings.scaleMode === 'integer' ? 'Sharp pixels' : 'Fill screen'}`,
			action: () => change('scaleMode', settings.scaleMode === 'integer' ? 'fit' : 'integer')
		},
		{
			label: () => `4:3 aspect: ${settings.aspectCorrection ? 'On' : 'Off'}`,
			action: () => change('aspectCorrection', !settings.aspectCorrection)
		},
		{
			label: () => `Graphics: ${renderProfiles[settings.profile]?.name ?? settings.profile}`,
			action: () => change('profile', next(profiles, profile => profile.id === settings.profile).id)
		},
		{ label: 'Fullscreen', action: () => game.display.toggleFullscreen() }
	]);
}

//a menu that closes on Escape or right click and has a closing item (Back) at the end or, with closeFirst, at the start
function openSubmenu(game, title, items, closeLabel = 'Back', closeFirst = false) {
	const close = { label: closeLabel, action: () => game.closeOverlay(menu) },
		menu = new Menu(game, { title, onCancel: close.action, items: closeFirst ? [close, ...items] : [...items, close] });

	game.openOverlay(menu);
}

function slotNumbers(first) {
	return Array.from({ length: saveSlots - first + 1 }, (_, index) => first + index);
}

function slotLabel(slot, saves) {
	const save = saves.find(record => record.slot === slot),
		name = slot === 0 ? 'Autosave' : `${slot}.`;

	return save ? `${name} ${save.label}  ${formatDate(save.savedAt)}` : `${name} ---`;
}

function formatDate(timestamp) {
	const date = new Date(timestamp),
		pad = value => String(value).padStart(2, '0');

	return `${date.getDate()}.${date.getMonth() + 1}. ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function next(list, isCurrent) {
	return list[(list.findIndex(isCurrent) + 1) % list.length];
}
