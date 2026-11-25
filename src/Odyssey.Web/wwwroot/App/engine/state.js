export const stateVersion = 1;

//everything that is saved: the current room, flags set by scripts, the inventory, actor positions and dialog progress
export class GameState {
	constructor(data = {}) {
		const copy = JSON.parse(JSON.stringify(data));
		this.room = copy.room ?? null;
		this.flags = copy.flags ?? {};
		this.inventory = copy.inventory ?? [];
		this.actors = copy.actors ?? {};
		this.dialogs = copy.dialogs ?? {};
		this.visited = copy.visited ?? {};
		this.playTime = copy.playTime ?? 0;
	}

	toJSON() {
		return {
			version: stateVersion,
			room: this.room,
			flags: this.flags,
			inventory: this.inventory,
			actors: this.actors,
			dialogs: this.dialogs,
			visited: this.visited,
			playTime: Math.round(this.playTime)
		};
	}
}
