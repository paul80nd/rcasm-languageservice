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

	test('Mnemonic Completion', async function () {
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

	test('Directive Completion', async function () {
		await testCompletionFor('|', {
			items: [
				{ label: '!align', resultText: '!align ${1:8}' },
				{ label: 'add', resultText: 'add' }
			]
		});
		await testCompletionFor(' |', {
			items: [
				{ label: '!word', resultText: ' !word ${1:0x0000}' },
				{ label: 'add', resultText: ' add' }
			]
		});

		await testCompletionFor(' !|', {
			items: [{ label: '!align' }, { label: '!byte' }, { label: '!fill' }, { label: '!for' }, { label: '!word' }]
		});

		await testCompletionFor('label: |', {
			items: [
				{ label: '!fill', resultText: 'label: !fill ${1:8},${2:0x00}' },
				{ label: 'add', resultText: 'label: add' }
			]
		});

		await testCompletionFor('label: l|', { items: [{ label: 'ldi', resultText: 'label: ldi ${1:a},${2:0}' }] });

		await testCompletionFor('label: !f| ; comment', {
			items: [
				{ label: '!fill', resultText: 'label: !fill ${1:8},${2:0x00} ; comment' },
				{ label: '!for', resultText: 'label: !for ${1:i} in range(${2:5}) {\n        ${3:add}\n} ; comment' }
			]
		});

	});

	test('Mnemonic Completion includes detail', async function () {
		await testCompletionFor('bc|', { items: [{ label: 'bcs', detail: 'Branch if Carry Set' }] });
	});

	test('Mnemonic Completion includes documentation', async function () {
		await testCompletionFor('ad|', {
			items: [{
				label: 'add',
				documentation: {
					kind: 'markdown',
					value: '__Arithmetic Add__  \nAdds the contents of register b and c placing the result in dst (a or d). If dst is not specified then register a is assumed. Affects Z (zero), S (sign) and C (carry) flags.  \nSyntax: `add [<dest>{a|d}]`'
				}
			}
			]
		});
	});

	test('Directive Completion includes documentation', async function () {
		await testCompletionFor('!al|', {
			items: [{
				label: '!align',
				documentation: {
					kind: 'markdown',
					value: '__Define Align__  \nWrites 8-bit zeros into the output until the current location is a multiple of the given value.  \nSyntax: `<value>{2,4,8,16...}`'
				}
			}
			]
		});
	});

	test('Completions in order', async () => {
		await testCompletionFor('|', {
			items: [
				{ label: 'add', sortText: undefined },
				{ label: '!align', sortText: 'align' },
				{ label: 'bcs', sortText: undefined },
				{ label: '!byte', sortText: 'byte' }
			]
		});
	});
});
