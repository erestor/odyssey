import { Translator } from '../App/engine/i18n.js';

describe('Translator', () => {
	const languages = {
			en: { name: 'English' },
			cs: {
				name: 'Čeština',
				strings: {
					'Sign': { text: 'Cedule', acc: 'Ceduli' },
					'Rag': 'Hadr',
					'Look at {item}': 'Prohlédni {item.acc}'
				}
			}
		},
		translator = language => {
			const result = new Translator('en', languages);
			result.use(language);
			return result;
		};

	beforeEach(() => spyOn(console, 'warn'));

	it('translate returns the translation of the current language', () => {
		expect(translator('cs').translate('Rag')).toBe('Hadr');
		expect(translator('en').translate('Rag')).toBe('Rag');
	});

	it('translate uses the text of an entry with forms', () => {
		expect(translator('cs').translate('Sign')).toBe('Cedule');
	});

	it('translate fills placeholders with translated values in the requested form', () => {
		expect(translator('cs').translate('Look at {item}', { item: 'Sign' })).toBe('Prohlédni Ceduli');
		expect(translator('cs').translate('Look at {item}', { item: 'Rag' })).toBe('Prohlédni Hadr');
		expect(translator('en').translate('Look at {item}', { item: 'Sign' })).toBe('Look at Sign');
	});

	it('translate includes the engine translations', () => {
		expect(translator('cs').translate('New game')).toBe('Nová hra');
	});

	it('translate keeps a missing text and reports it once', () => {
		const cs = translator('cs');
		expect(cs.translate('Sea')).toBe('Sea');
		cs.translate('Sea');
		expect(console.warn).toHaveBeenCalledTimes(1);
	});

	it('translate does not report texts in the source language', () => {
		translator('en').translate('Sea');
		expect(console.warn).not.toHaveBeenCalled();
	});

	it('preferred picks the first browser language the game has', () => {
		expect(translator('en').preferred(['de-DE', 'cs-CZ', 'en'])).toBe('cs');
		expect(translator('en').preferred(['de-DE'])).toBe('en');
	});
});
