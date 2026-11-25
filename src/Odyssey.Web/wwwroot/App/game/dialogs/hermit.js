export default {
	id: 'hermit',
	nodes: {
		root: {
			options: [
				{
					id: 'who',
					text: 'Who are you?',
					once: true,
					run: g => g.say('hermit', ['Just an old man who watches the tide.', 'And the fools who walk into that cave.'])
				},
				{
					id: 'cave',
					text: 'What\'s in that cave?',
					run: async g => {
						await g.say('hermit', 'Old things. Dark things.');
						await g.say('hermit', 'You won\'t see your own nose in there without a light.');
						g.setFlag('askedCave');
					}
				},
				{
					id: 'rag',
					text: 'Got anything I could make a torch with?',
					when: g => g.flag('askedCave') && !g.flag('gotRag'),
					run: async g => {
						await g.say('hermit', 'Hmm. Here, take this oily rag. Wrap it around a stick.');
						g.give('rag');
						g.setFlag('gotRag');
					}
				},
				{
					id: 'weather',
					text: 'Nice weather today.',
					goto: 'weather',
					run: g => g.say('hermit', 'Is it?')
				},
				{
					id: 'bye',
					text: 'Goodbye.',
					end: true,
					run: g => g.say('hermit', 'Mind the tide.')
				}
			]
		},
		weather: {
			options: [
				{
					id: 'sunset',
					text: 'Well, the sunset is pretty.',
					goto: 'root',
					run: g => g.say('hermit', 'It has been setting for a very long time. I stopped counting.')
				},
				{
					id: 'never',
					text: 'Never mind.',
					goto: 'root'
				}
			]
		}
	}
};
