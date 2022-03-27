/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from 'assert';
import * as rcasmLanguageService from '../rcasmLanguageService';

import { CompletionList, CompletionItemKind, MarkupContent, TextEdit } from 'vscode-languageserver-types';
import { TextDocument } from 'vscode-languageserver-textdocument';

interface ItemDescription {
	label: string;
	detail?: string;
	documentation?: string | MarkupContent;
	kind?: CompletionItemKind;
	resultText?: string;
	filterText?: string;
	notAvailable?: boolean;
}

function asPromise<T>(result: T): Promise<T> {
	return Promise.resolve(result);
}

export function assertCompletion(completions: CompletionList, expected: ItemDescription, document: TextDocument) {
	const matches = completions.items.filter(completion => {
		return completion.label === expected.label;
	});
	if (expected.notAvailable) {
		assert.equal(matches.length, 0, expected.label + " should not existing is results");
		return;
	}

	assert.equal(matches.length, 1, expected.label + " should only existing once: Actual: " + completions.items.map(c => c.label).join(', '));
	const match = matches[0];
	if (expected.detail) {
		assert.equal(match.detail, expected.detail);
	}
	if (expected.documentation) {
		assert.deepEqual(match.documentation, expected.documentation);
	}
	if (expected.kind) {
		assert.equal(match.kind, expected.kind);
	}
	if (expected.resultText && match.textEdit) {
		const edit = TextEdit.is(match.textEdit) ? match.textEdit : TextEdit.replace(match.textEdit.replace, match.textEdit.newText);
		assert.equal(TextDocument.applyEdits(document, [edit]), expected.resultText);
	}
	if (expected.filterText) {
		assert.equal(match.filterText, expected.filterText);
	}
}

export function testCompletionFor(value: string, expected: { count?: number, items?: ItemDescription[] }): void {
	const offset = value.indexOf('|');
	value = value.substr(0, offset) + value.substr(offset + 1);

	const ls = rcasmLanguageService.getLanguageService();

	const document = TextDocument.create('test://test/test.rcasm', 'rcasm', 0, value);
	const position = document.positionAt(offset);
	const program = ls.parseProgram(document);
	const list = ls.doComplete(document, position, program);

	// no duplicate labels
	const labels = list.items.map(i => i.label).sort();
	let previous = null;
	for (const label of labels) {
		assert.ok(previous !== label, `Duplicate label ${label} in ${labels.join(',')}`);
		previous = label;
	}
	if (expected.count) {
		assert.equal(list.items, expected.count);
	}
	if (expected.items) {
		for (const item of expected.items) {
			assertCompletion(list, item, document);
		}
	}
}
