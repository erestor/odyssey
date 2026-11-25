const storeName = 'saves';

//save games live in IndexedDB (one record per slot, slot 0 is the autosave), settings in localStorage
export class Storage {
	constructor(gameId) {
		this.databaseName = gameId;
		this.settingsKey = `${gameId}.settings`;
		this._database = null;
	}

	save(slot, record) {
		return this._run('readwrite', store => store.put({ ...record, slot }));
	}

	load(slot) {
		return this._run('readonly', store => store.get(slot));
	}

	list() {
		return this._run('readonly', store => store.getAll());
	}

	remove(slot) {
		return this._run('readwrite', store => store.delete(slot));
	}

	loadSettings(defaults) {
		try {
			return { ...defaults, ...JSON.parse(localStorage.getItem(this.settingsKey) ?? '{}') };
		}
		catch {
			return { ...defaults };
		}
	}

	saveSettings(settings) {
		localStorage.setItem(this.settingsKey, JSON.stringify(settings));
	}

	_open() {
		if (!this._database) {
			this._database = new Promise((resolve, reject) => {
				const request = indexedDB.open(this.databaseName, 1);
				request.onupgradeneeded = () => request.result.createObjectStore(storeName, { keyPath: 'slot' });
				request.onsuccess = () => resolve(request.result);
				request.onerror = () => reject(request.error);
			});
		}
		return this._database;
	}

	async _run(mode, action) {
		const database = await this._open();
		return new Promise((resolve, reject) => {
			const transaction = database.transaction(storeName, mode),
				request = action(transaction.objectStore(storeName));

			transaction.oncomplete = () => resolve(request.result);
			transaction.onerror = () => reject(transaction.error);
		});
	}
}
