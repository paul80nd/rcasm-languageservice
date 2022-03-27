'use strict';

import * as assert from 'assert';
import * as nodes from '../parser/rcasmNodes';

import {
	TextDocument, DocumentHighlightKind, Range, Position,
	SymbolKind, SymbolInformation, Location,
	getLanguageService, LanguageService, RCASMProgram
} from '../rcasmLanguageService';

export function assertSymbols(ls: LanguageService, input: string, expected: SymbolInformation[], lang: string = 'rcasm') {
	let document = TextDocument.create(`test://test/test.${lang}`, lang, 0, input);

	let program = ls.parseProgram(document);

	let symbols = ls.findDocumentSymbols(document, program);
	assert.deepEqual(symbols, expected);
}

export function assertHighlights(ls: LanguageService, input: string, marker: string, expectedMatches: number, expectedWrites: number, elementName?: string) {
	let document = TextDocument.create('test://test/test.css', 'css', 0, input);

	let program = ls.parseProgram(document);
	assertNoErrors(program);

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

function assertNoErrors(program: RCASMProgram): void {
	const markers = nodes.ParseErrorCollector.entries(<nodes.Program>program);
	if (markers.length > 0) {
		assert.ok(false, 'node has errors: ' + markers[0].getMessage() + ', offset: ' + markers[0].getNode().offset);
	}
}

suite('RCASM - Navigation', () => {

	test('basic labels', () => {
		let ls = getLanguageService();
		assertSymbols(ls, 'label1: add', [{ name: 'label1', kind: SymbolKind.Variable, location: Location.create('test://test/test.rcasm', newRange(0, 6)) }]);
		assertSymbols(ls, 'label2: jmp label2', [{ name: 'label2', kind: SymbolKind.Variable, location: Location.create('test://test/test.rcasm', newRange(0, 6)) }]);
	});

	test('mark occurrences for label', () => {
		let ls = getLanguageService();
		assertHighlights(ls, 'label1: add', 'label1', 1, 1);
		assertHighlights(ls, 'label2: jmp label2', 'label2', 2, 1);
	});

});

export function newRange(start: number, end: number) {
	return Range.create(Position.create(0, start), Position.create(0, end));
}