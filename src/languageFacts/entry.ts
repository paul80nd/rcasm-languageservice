'use strict';

import { MarkupContent, IMnemonicData, IDirectiveData, MarkupKind, IMnemonicVariant } from '../rcasmLanguageTypes';


export function getEntryDescription(entry: IEntry2, doesSupportMarkdown: boolean): MarkupContent | undefined {
	let result: MarkupContent;

	if (doesSupportMarkdown) {
		result = {
			kind: 'markdown',
			value: getEntryMarkdownDescription(entry)
		};
	} else {
		result = {
			kind: 'plaintext',
			value: getEntryStringDescription(entry)
		};
	}

	if (result.value === '') {
		return undefined;
	}

	return result;
}

function getEntryStringDescription(entry: IEntry2): string {
	if (!entry.description || entry.description === '') {
		return '';
	}

	let result: string = `${entry.summary}\n\n${entry.description}`;

	if ('syntax' in entry) {
		result += `\n\nSyntax: ${entry.syntax}`;
	}

	if ('variants' in entry && entry.variants) {
		entry.variants.forEach(variant => {
			result +=  `\n\n\n${entry.summary}\n\n${variant.description}`;
			if ('syntax' in variant) {
				result += `\n\nSyntax: ${variant.syntax}`;
			}
		});
	}

	return result;
}

function getEntryMarkdownDescription(entry: IEntry2): string {
	if (!entry.description || entry.description === '') {
		return '';
	}

	let result: string = `__${entry.summary}__  \n${entry.description}`;

	if ('syntax' in entry) {
		result += `  \nSyntax: \`${entry.syntax}\``;
	}

	if ('variants' in entry && entry.variants) {
		entry.variants.forEach(variant => {
			result +=  `\n___\n__${variant.summary}__  \n${variant.description}`;
			if ('syntax' in variant) {
				result += `  \nSyntax: \`${variant.syntax}\``;
			}
		});
	}

	return result;
}

export function getEntrySpecificDescription(entry: IMnemonicData, paramNames: string[], doesSupportMarkdown: boolean): MarkupContent | undefined {
	let result: MarkupContent;

	if (doesSupportMarkdown) {
		result = {
			kind: 'markdown',
			value: fillParamPlaceholders(getEntrySpecificMarkdownDescription(entry, paramNames), paramNames)
		};
	} else {
		result = {
			kind: 'plaintext',
			value: fillParamPlaceholders(getEntrySpecificStringDescription(entry, paramNames), paramNames)
		};
	}

	if (result.value === '') {
		return undefined;
	}

	return result;
}

function fillParamPlaceholders(value: string, paramNames: string[]): string {
	if (!paramNames || paramNames.length === 0) {
		return value;
	}

	for (let i = 0; i < paramNames.length; i++) {
		value = value.replace(`{${i}}`, paramNames[i]);
	}

	return value;
}

// Check if there is a variant match by first parameter
function findVariantMatch(entry: IMnemonicData, paramNames: string[]): IMnemonicVariant | undefined {
	if (!entry.variants || entry.variants.length === 0 || !paramNames || paramNames.length === 0) {
		return undefined;
	}

	for (let i = 0; i < entry.variants.length; i++) {
		var idx = entry.variants[i].whenFirstParamIs.indexOf(paramNames[0].toLowerCase());
		if (idx !== -1) {
			return entry.variants[i];
		}
	}

	return undefined;
}

function getEntrySpecificStringDescription(entry: IMnemonicData, paramNames: string[]): string {
	if (!('synopsis' in entry) || !entry.synopsis || entry.synopsis === '') {
		return '';
	}

	const variant = findVariantMatch(entry, paramNames);
	const summary = variant ? variant.summary : entry.summary;
	const cls = variant ? variant.class : entry.class;
	const cycles = variant ? variant.cycles : entry.cycles;
	const desc = variant ? variant.description : entry.description;

	return `${summary} ${cls} ${cycles}\n\n${desc}\n\nSynopsis: ${entry.synopsis}`;
}

function getEntrySpecificMarkdownDescription(entry: IMnemonicData, paramNames: string[]): string {
	if (!('synopsis' in entry) || !entry.synopsis || entry.synopsis === '') {
		return '';
	}

	const variant = findVariantMatch(entry, paramNames);
	const summary = variant ? variant.summary : entry.summary;
	const cls = variant ? variant.class : entry.class;
	const cycles = variant ? variant.cycles : entry.cycles;
	const desc = variant ? variant.description : entry.description;

	return `__${summary}__ ${cls} ${cycles}  \n${desc}  \nSynopsis: \`${entry.synopsis}\``;
}

export type IEntry2 = IMnemonicData | IDirectiveData;
