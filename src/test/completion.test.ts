'use strict';

import * as assert from 'assert';
import {
	getLanguageService,
	TextDocument, CompletionList, CompletionItemKind, InsertTextFormat, Command, MarkupContent
} from '../rcasmLanguageService';
import { TextEdit } from 'vscode-languageserver-types';

interface ItemDescription {
	label: string;
	detail?: string;
	documentation?: string | MarkupContent | null;
	/**
	 * Only test that the documentation includes the substring
	 */
	documentationIncludes?: string;
	kind?: CompletionItemKind;
	insertTextFormat?: InsertTextFormat;
	resultText?: string;
	notAvailable?: boolean;
	command?: Command;
	sortText?: string;
}

export function assertCompletion(completions: CompletionList, expected: ItemDescription, document: TextDocument) {
	const matches = completions.items.filter(completion => {
		return completion.label === expected.label;
	});
	if (expected.notAvailable) {
		assert.equal(matches.length, 0, expected.label + " should not be present");
	} else {
		assert.equal(matches.length, 1, expected.label + " should only existing once: Actual: " + completions.items.map(c => c.label).join(', '));
	}

	const match = matches[0];
	if (expected.detail) {
		assert.equal(match.detail, expected.detail);
	}
	if (expected.documentation) {
		assert.deepEqual(match.documentation, expected.documentation);
	}
	if (expected.documentationIncludes) {
		assert.ok(match.documentation !== undefined);
		if (typeof match.documentation === 'string') {
			assert.ok(match.documentation.indexOf(expected.documentationIncludes) !== -1);
		} else {
			assert.ok(match.documentation!.value.indexOf(expected.documentationIncludes) !== -1);
		}
	}
	if (expected.kind) {
		assert.equal(match.kind, expected.kind);
	}
	if (expected.resultText && match.textEdit) {
		const edit = TextEdit.is(match.textEdit) ? match.textEdit : TextEdit.replace(match.textEdit.replace, match.textEdit.newText);
		assert.equal(TextDocument.applyEdits(document, [edit]), expected.resultText);
	}
	if (expected.insertTextFormat) {
		assert.equal(match.insertTextFormat, expected.insertTextFormat);
	}
	if (expected.command) {
		assert.deepEqual(match.command, expected.command);
	}
	if (expected.sortText) {
		assert.equal(match.sortText, expected.sortText);
	}
};

export type ExpectedCompetions = {
	count?: number;
	items?: ItemDescription[];
};

export async function testCompletionFor(value: string, expected: ExpectedCompetions) {
	const offset = value.indexOf('|');
	assert.ok(offset !== -1, '| missing in ' + value);
	value = value.substr(0, offset) + value.substr(offset + 1);

	const ls = getLanguageService();

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

	if (typeof expected.count === 'number') {
		assert.equal(list.items.length, expected.count);
	}
	if (expected.items) {
		for (const item of expected.items) {
			assertCompletion(list, item, document);
		}
	}
};

suite('RCASM Completion', () => {

	test('Basic Completion', async function () {
		await testCompletionFor('|', {
			items: [
				{ label: 'ldi', resultText: 'ldi ${1:a},${2:0}' },
				{ label: 'add', resultText: 'add' }
			]
		});
		await testCompletionFor(' |', {
			items: [
				{ label: 'ldi', resultText: ' ldi ${1:a},${2:0}' },
				{ label: 'add', resultText: ' add' }
			]
		});
		await testCompletionFor(' l|', {
			items: [{ label: 'ldi', resultText: ' ldi ${1:a},${2:0}' }]
		});

		await testCompletionFor('label: |', {
			items: [
				{ label: 'ldi', resultText: 'label: ldi ${1:a},${2:0}' },
				{ label: 'add', resultText: 'label: add' }
			]
		});

		await testCompletionFor('label: l|', {
			items: [{ label: 'ldi', resultText: 'label: ldi ${1:a},${2:0}' }]
		});

		await testCompletionFor(' ld| a,5', {
			items: [{ label: 'ldi', resultText: ' ldi ${1:a},${2:0} a,5' }]
		});
		await testCompletionFor('label: l| ; comment', {
			items: [{ label: 'ldi', resultText: 'label: ldi ${1:a},${2:0} ; comment' }]
		});

	});

	test('Completion includes detail', async function () {
		await testCompletionFor('bc|', {
			items: [
				{ label: 'bcs', detail: 'Branch if Carry Set [GOTO]' }
			]
		});
	});

	test('Completion includes documentation', async function () {
		await testCompletionFor('ad|', {
			items: [
				{
					label: 'add',
					documentation: {
						kind: 'markdown',
						value:
							'Adds the contents of register B and C (B+C) placing the result in register A or D.\n\nSyntax: `[ a | d ]`'
					}
				}
			]
		});
	});
});
