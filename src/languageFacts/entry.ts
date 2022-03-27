'use strict';

import { MarkupContent, IMnemonicData } from '../rcasmLanguageTypes';


export function getEntryDescription(entry: IEntry2, doesSupportMarkdown: boolean): MarkupContent {
	if (doesSupportMarkdown) {
		return {
			kind: 'markdown',
			value: getEntryMarkdownDescription(entry)
		};
	} else {
		return {
			kind: 'plaintext',
			value: getEntryStringDescription(entry)
		};
	}
}

function getEntryStringDescription(entry: IEntry2): string {
	if (!entry.description || entry.description === '') {
		return '';
	}

	if (typeof entry.description !== 'string') {
		return entry.description.value;
	}

	let result: string = '';

	result += entry.description;

	if ('syntax' in entry) {
		result += `\n\nSyntax: ${entry.syntax}`;
	}

	return result;
}

function getEntryMarkdownDescription(entry: IEntry2): string {
	if (!entry.description || entry.description === '') {
		return '';
	}

	let result: string = '';

	if (typeof entry.description === 'string') {
		result += entry.description;
	} else {
		result = entry.description.value;
	}

	if ('syntax' in entry) {
		result += `\n\nSyntax: \`${entry.syntax}\``;
	}

	return result;
}

export function getEntrySpecificDescription(entry: IEntry2, paramNames: string[], doesSupportMarkdown: boolean): MarkupContent {
	if (doesSupportMarkdown) {
		return {
			kind: 'markdown',
			value: fillParamPlaceholders(getEntrySpecificMarkdownDescription(entry), paramNames)
		};
	} else {
		return {
			kind: 'plaintext',
			value: fillParamPlaceholders(getEntrySpecificStringDescription(entry), paramNames)
		};
	}
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

function getEntrySpecificStringDescription(entry: IEntry2): string {
	if (!entry.synopsis || entry.synopsis === '') {
		return '';
	}

	let result: string = '';

	if (entry.summary) {
		result += `${entry.summary}\n\n`;
	}

	result += entry.synopsis;

	return result;
}

function getEntrySpecificMarkdownDescription(entry: IEntry2): string {
	if (!entry.synopsis || entry.synopsis === '') {
		return '';
	}

	let result: string = '';

	if (entry.summary) {
		result += `${entry.summary}\n\n`;
	}

	result += '`' + entry.synopsis + '`';

	return result;
}

export type IEntry2 = IMnemonicData;
