import { renderProfiles } from '../config.js';
import { Menu } from './menu.js';

const saveSlots = 8,
	textSpeeds = [{ value: 0.6, name: 'Slow' }, { value: 1, name: 'Normal' }, { value: 1.6, name: 'Fast' }],
	scaleModes = [{ value: 'integer', name: 'Sharp pixels' }, { value: 'fit', name: 'Fit window' }, { value: 'none', name: 'None' }];

export async function openTitleMenu(game) {
	const saves = await game.storage.list(),
		latest = saves.reduce((best, save) => !best || save.savedAt > best.savedAt ? save : best, null),
		t = text => game.t(text);

	game.openOverlay(new Menu(game, {
		top: 112,
		items: [
			{ label: t('New game'), action: () => game.newGame() },
			{ label: t('Continue'), action: () => game.loadGame(latest.slot), disabled: () => !latest },
			{ label: t('Load game'), action: () => openLoadMenu(game, saves), disabled: () => !saves.length },
			{ label: t('Settings'), action: () => openSettingsMenu(game) }
		]
	}));
}

//switches to the next language and rebuilds the title and settings menus in it
async function changeLanguage(game) {
	game.settings.language = next(Object.keys(game.translator.languages), id => id === game.settings.language);
	await game.applySettings();
	game.closeAllOverlays();
	await openTitleMenu(game);
	openSettingsMenu(game);
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
		label: () => slotLabel(game, slot, saves),
		action: async () => {
			await game.saveGame(slot);
			game.closeAllOverlays();
			game.say(null, game.messages.saved);
		}
	})));
}

function openLoadMenu(game, saves) {
	openSubmenu(game, 'Load game', slotNumbers(0).map(slot => ({
		label: () => slotLabel(game, slot, saves),
		action: () => game.loadGame(slot),
		disabled: () => !saves.some(save => save.slot === slot)
	})));
}

//the language is offered only when the settings are opened from the title menu, so a game in progress never mixes languages
function openSettingsMenu(game) {
	const settings = game.settings,
		t = text => game.t(text),
		change = async (name, value) => {
			settings[name] = value;
			await game.applySettings();
		},
		profiles = Object.values(renderProfiles),
		languages = game.translator.languages,
		languageItems = game.mode === 'title' && Object.keys(languages).length > 1 ?
			[{ label: () => `${t('Language')}: ${languages[settings.language].name}`, action: () => changeLanguage(game) }] :
			[];

	openSubmenu(game, 'Settings', [
		...languageItems,
		{
			label: () => `${t('Text speed')}: ${t(textSpeeds.find(speed => speed.value === settings.textSpeed)?.name ?? 'Normal')}`,
			action: () => change('textSpeed', next(textSpeeds, speed => speed.value === settings.textSpeed).value)
		},
		{
			label: () => `${t('Scaling')}: ${t(scaleModes.find(mode => mode.value === settings.scaleMode)?.name ?? 'Sharp pixels')}`,
			action: () => change('scaleMode', next(scaleModes, mode => mode.value === settings.scaleMode).value)
		},
		{
			label: () => `${t('Aspect')}: ${settings.aspectCorrection ? '4:3' : '16:10'}`,
			action: () => change('aspectCorrection', !settings.aspectCorrection)
		},
		{
			label: () => `${t('Graphics')}: ${renderProfiles[settings.profile]?.name ?? settings.profile}`,
			action: () => change('profile', next(profiles, profile => profile.id === settings.profile).id)
		},
		{ label: 'Fullscreen', action: () => game.display.toggleFullscreen() }
	]);
}

//a menu that closes on Escape or right click and has a closing item (Back) at the end or, with closeFirst, at the start.
//the title and plain string labels are translated here; function labels translate their own texts
function openSubmenu(game, title, items, closeLabel = 'Back', closeFirst = false) {
	const close = { label: closeLabel, action: () => game.closeOverlay(menu) },
		translated = (closeFirst ? [close, ...items] : [...items, close])
			.map(item => typeof item.label === 'string' ? { ...item, label: game.t(item.label) } : item),
		menu = new Menu(game, { title: game.t(title), onCancel: close.action, items: translated });

	game.openOverlay(menu);
}

function slotNumbers(first) {
	return Array.from({ length: saveSlots - first + 1 }, (_, index) => first + index);
}

//save labels are room names in the source language, so they are shown in the current one
function slotLabel(game, slot, saves) {
	const save = saves.find(record => record.slot === slot),
		name = slot === 0 ? game.t('Autosave') : `${slot}.`;

	return save ? `${name} ${game.t(save.label)}  ${formatDate(save.savedAt)}` : `${name} ---`;
}

function formatDate(timestamp) {
	const date = new Date(timestamp),
		pad = value => String(value).padStart(2, '0');

	return `${date.getDate()}.${date.getMonth() + 1}. ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function next(list, isCurrent) {
	return list[(list.findIndex(isCurrent) + 1) % list.length];
}
