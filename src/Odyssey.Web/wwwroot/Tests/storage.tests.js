import { Storage } from '../App/engine/storage.js';

describe('Storage', () => {
	const storage = new Storage('odyssey-tests');

	afterEach(async () => {
		await Promise.all((await storage.list()).map(save => storage.remove(save.slot)));
		localStorage.removeItem(storage.settingsKey);
	});

	it('save and load round trip a record by slot', async () => {
		await storage.save(3, { label: 'Beach', state: { room: 'beach' } });
		expect(await storage.load(3)).toEqual({ label: 'Beach', state: { room: 'beach' }, slot: 3 });
		expect(await storage.load(4)).toBeUndefined();
	});

	it('save replaces the record in the same slot', async () => {
		await storage.save(1, { label: 'Beach' });
		await storage.save(1, { label: 'Cave' });
		expect((await storage.list()).map(save => save.label)).toEqual(['Cave']);
	});

	it('remove deletes only the given slot', async () => {
		await storage.save(0, { label: 'Autosave' });
		await storage.save(2, { label: 'Manual' });
		await storage.remove(0);
		expect((await storage.list()).map(save => save.slot)).toEqual([2]);
	});

	it('loadSettings merges saved settings over the defaults', () => {
		storage.saveSettings({ textSpeed: 2 });
		expect(storage.loadSettings({ textSpeed: 1, profile: 'vga' })).toEqual({ textSpeed: 2, profile: 'vga' });
	});

	it('loadSettings falls back to the defaults when the stored value is broken', () => {
		localStorage.setItem(storage.settingsKey, '{broken');
		expect(storage.loadSettings({ textSpeed: 1 })).toEqual({ textSpeed: 1 });
	});
});
