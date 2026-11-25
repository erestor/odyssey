//the game logic always works in 320x200 logical pixels (VGA mode 13h);
//render profiles only change how many buffer pixels back each logical pixel and which asset variants are loaded
export const logicalWidth = 320;
export const logicalHeight = 200;

export const renderProfiles = {
	vga: { id: 'vga', name: 'VGA 320x200', renderScale: 1, assetSuffixes: [''] },
	hires: { id: 'hires', name: 'High 640x400', renderScale: 2, assetSuffixes: ['@2x', ''] }
};

export const defaultSettings = {
	profile: 'vga',
	scaleMode: 'integer',
	aspectCorrection: false,
	textSpeed: 1
};

export const timing = {
	step: 1000 / 60,
	maxFrame: 250,
	fade: 300,
	cameraSpeed: 160,
	cameraMargin: 100
};

export const textTiming = {
	charMs: 65,
	minMs: 1500
};
