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

suite('RCASM Completion', () => {

	test('Basic Completion', function (): any {

		testCompletionFor('|', {
			items: [{ label: 'ldi', resultText: 'ldi ${1:a},${2:0}' }, { label: 'add', resultText: 'add' }]
		});

		testCompletionFor(' |', {
			items: [{ label: 'ldi', resultText: ' ldi ${1:a},${2:0}' }, { label: 'add', resultText: ' add' }]
		});

		testCompletionFor(' l|', {
			items: [{ label: 'ldi', resultText: ' ldi ${1:a},${2:0}' }]
		});

		testCompletionFor('label: |', {
			items: [{ label: 'ldi', resultText: 'label: ldi ${1:a},${2:0}' }, { label: 'add', resultText: 'label: add' }]
		});
		
		testCompletionFor('label: l|', {
			items: [{ label: 'ldi', resultText: 'label: ldi ${1:a},${2:0}' }]
		});

		testCompletionFor(' ld| a,5', {
			items: [{ label: 'ldi', resultText: ' ldi ${1:a},${2:0} a,5' }]
		});

		testCompletionFor('label: l| ; comment', {
			items: [{ label: 'ldi', resultText: 'label: ldi ${1:a},${2:0} ; comment' }]
		});

	});
	
	test('Completion includes detail', () => {
		testCompletionFor('bc|', {
			items: [
				{ label: 'bcs', detail: 'Branch if Carry Set [GOTO]' }
			]
		});
	});

	test('Completion includes documentation', () => {
		testCompletionFor('ad|', {
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
