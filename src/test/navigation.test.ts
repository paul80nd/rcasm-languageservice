'use strict';

import * as assert from 'assert';

import {
	TextDocument, DocumentHighlightKind, Range, Position,
	SymbolKind, SymbolInformation, Location,
	getLanguageService, LanguageService, DocumentSymbol
} from '../rcasmLanguageService';

export function assertSymbolInfos(ls: LanguageService, input: string, expected: SymbolInformation[], lang: string = 'rcasm') {
	let document = TextDocument.create(`test://test/test.${lang}`, lang, 0, input);

	let program = ls.parseProgram(document);

	let symbols = ls.findDocumentSymbols(document, program);
	assert.deepEqual(symbols, expected);
}

export function assertDocumentSymbols(ls: LanguageService, input: string, expected: DocumentSymbol[], lang: string = 'css') {
	let document = TextDocument.create(`test://test/test.${lang}`, lang, 0, input);
	let program = ls.parseProgram(document);
	let symbols = ls.findDocumentSymbols2(document, program);
	assert.deepEqual(symbols, expected);
}

export function assertHighlights(ls: LanguageService, input: string, marker: string, expectedMatches: number, expectedWrites: number, elementName?: string) {
	let document = TextDocument.create('test://test/test.css', 'css', 0, input);

	let program = ls.parseProgram(document);

	let index = input.indexOf(marker) + marker.length;
	let position = document.positionAt(index);

	let highlights = ls.findDocumentHighlights(document, position, program);
	assert.equal(highlights.length, expectedMatches, input);

	let nWrites = 0;
	for (let highlight of highlights) {
		if (highlight.kind === DocumentHighlightKind.Write) {
			nWrites++;
		}
		let range = highlight.range;
		let start = document.offsetAt(range.start), end = document.offsetAt(range.end);
		assert.equal(document.getText().substring(start, end), elementName || marker);
	}
	assert.equal(nWrites, expectedWrites, input);
}

suite('RCASM Symbols', () => {

	test('basic label symbols', () => {
		let ls = getLanguageService();
		assertSymbolInfos(ls, 'label1: add', [{ name: 'label1', kind: SymbolKind.Variable, location: Location.create('test://test/test.rcasm', newRange(0, 6)) }]);
		assertSymbolInfos(ls, 'label2: jmp label2', [{ name: 'label2', kind: SymbolKind.Variable, location: Location.create('test://test/test.rcasm', newRange(0, 6)) }]);
		assertSymbolInfos(ls, 'label3: jmp label3   ', [{ name: 'label3', kind: SymbolKind.Variable, location: Location.create('test://test/test.rcasm', newRange(0, 6)) }]);
	});

	test('basic document symbols', () => {
		let ls = getLanguageService();
		assertDocumentSymbols(ls, 'label1: add', [{ name: 'label1', kind: SymbolKind.Variable, range: newRange(0, 6), selectionRange: newRange(0, 6) }]);
		assertDocumentSymbols(ls, 'label2: jmp label2', [{ name: 'label2', kind: SymbolKind.Variable, range: newRange(0, 6), selectionRange: newRange(0, 6) }]);
		assertDocumentSymbols(ls, 'label3: jmp label3   ', [{ name: 'label3', kind: SymbolKind.Variable, range: newRange(0, 6), selectionRange: newRange(0, 6) }]);
	});
});

suite('RCASM Highlights', () => {

	test('mark occurrences for label', () => {
		let ls = getLanguageService();
		assertHighlights(ls, 'label1: add', 'label1', 1, 1);
		assertHighlights(ls, 'label2: jmp label2', 'label2', 2, 1);
		assertHighlights(ls, 'label3: jmp label3  ', 'label3', 2, 1);
	});
});

export function newRange(start: number, end: number) {
	return Range.create(Position.create(0, start), Position.create(0, end));
}