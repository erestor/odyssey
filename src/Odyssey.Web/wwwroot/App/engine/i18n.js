import cs from './translations/cs.js';

//translations of the engine's own texts (menus, default replies), merged under the game's translations
export const engineTranslations = { cs };

const placeholder = /\{(\w+)(?:\.(\w+))?\}/g;

//translates texts written in the game's source language. A catalog maps a source text to its translation,
//or to { text, [form]: translation } when a name needs other grammatical forms (Czech cases) in templates such as 'Use {item.acc}'.
//texts without a translation stay as they are and are reported once in the console (the engine's own texts are English).
//languages are { id: { name, strings: catalog } } from the game definition; the source language needs no strings.
export class Translator {
	constructor(sourceLanguage = 'en', languages = null) {
		this.sourceLanguage = sourceLanguage;
		this.languages = languages ?? { [sourceLanguage]: { name: sourceLanguage } };
		this.language = sourceLanguage;
		this._catalog = {};
		this._engineTexts = new Set(Object.values(engineTranslations).flatMap(Object.keys));
		this._reported = new Set();
	}

	//the first browser language the game has, otherwise the source language
	preferred(browserLanguages) {
		const codes = browserLanguages.map(language => language.slice(0, 2).toLowerCase());
		return codes.find(code => this.languages[code]) ?? this.sourceLanguage;
	}

	use(language) {
		this.language = language;
		this._catalog = { ...engineTranslations[language], ...this.languages[language]?.strings };
	}

	//translates the text and fills its placeholders;
	//placeholder values are source texts too and are translated in the form the placeholder names
	translate(text, values = null) {
		const result = this._lookup(text);
		return values ? result.replace(placeholder, (match, key, form) => key in values ? this._lookup(values[key], form) : match) : result;
	}

	_lookup(text, form = null) {
		const entry = this._catalog?.[text];
		if (entry === undefined) {
			this._reportMissing(text);
			return text;
		}
		return typeof entry === 'string' ? entry : entry[form] ?? entry.text;
	}

	_reportMissing(text) {
		const key = `${this.language}:${text}`;
		if (this.language === this.sourceLanguage || this.language === 'en' && this._engineTexts.has(text) || this._reported.has(key))
			return;

		this._reported.add(key);
		console.warn(`missing ${this.language} translation: '${text}'`);
	}
}
