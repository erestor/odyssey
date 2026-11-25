import { rect } from '../paint.js';

export const colors = {
	panel: '#101038',
	border: '#6a6ad0',
	borderDark: '#2a2a70',
	title: '#ffd060',
	text: '#b0b0ff',
	highlight: '#ffff60',
	disabled: '#606080',
	label: '#e0e0e0',
	slot: '#181848',
	slotHover: '#30306a',
	bag: '#c89048',
	bagInside: '#7a4a20'
};

export function drawPanel(context, x, y, width, height) {
	rect(context, x, y, width, height, colors.borderDark);
	rect(context, x + 1, y + 1, width - 2, height - 2, colors.border);
	rect(context, x + 2, y + 2, width - 4, height - 4, colors.panel);
}
