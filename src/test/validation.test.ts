'use strict';

import * as assert from 'assert';
import { DiagnosticSeverity } from 'vscode-languageserver-types';

import {
	TextDocument, DocumentHighlightKind, Range, Position,
	SymbolKind, SymbolInformation, Location,
	getLanguageService, LanguageService, RCASMProgram
} from '../rcasmLanguageService';

function assertDiagnostic(input: string, message: string,
	startLine: number, startChar: number, endLine: number, endChar: number,
	severity: DiagnosticSeverity = DiagnosticSeverity.Error, lang: string = 'rcasm') {
	let document = TextDocument.create(`test://test/test.${lang}`, lang, 0, input);
	let ls = getLanguageService();
	let result = ls.doValidation(document);
	assert.strictEqual(result.length, 1);
	assert.strictEqual(result[0].severity, severity);
	assert.strictEqual(result[0].message, message);
	assert.strictEqual(result[0].range.start.line, startLine);
	assert.strictEqual(result[0].range.start.character, startChar);
	assert.strictEqual(result[0].range.end.line, endLine);
	assert.strictEqual(result[0].range.end.character, endChar);
}

suite('RCASM - Validate', () => {

	test('parse fails', function () {
		assertDiagnostic('start: ldi a,', 'Syntax error: Expected identifier or literal but end of input found.', 0, 13, 0, 13);
	});

	test('unknown mnemonic', function () {
		assertDiagnostic('lxx a', "Unknown mnemonic 'lxx'", 0, 0, 0, 5);
	});

	test('alu mis-ops', function () {
		assertDiagnostic('add 45', 'Register required', 0, 4, 0, 6);
		assertDiagnostic('add g', 'Invalid register (must be one of [a,d])', 0, 4, 0, 5);
		assertDiagnostic('inc a,b', 'Parameter not required', 0, 6, 0, 7, DiagnosticSeverity.Warning);
	});

	test('clr mis-ops', function () {
		assertDiagnostic('clr', 'Parameter required', 0, 0, 0, 3);
		assertDiagnostic('clr 45', 'Register required', 0, 4, 0, 6);
		assertDiagnostic('clr g', 'Invalid register (must be one of [a,b,c,d])', 0, 4, 0, 5);
		assertDiagnostic('clr a,b', 'Parameter not required', 0, 6, 0, 7, DiagnosticSeverity.Warning);
	});

	test('mov mis-ops', function () {
		assertDiagnostic('mov', 'Two parameters required', 0, 0, 0, 3);
		assertDiagnostic('mov a', 'Two parameters required', 0, 0, 0, 5);
		assertDiagnostic('mov 45,a', 'Register required', 0, 4, 0, 6);
		assertDiagnostic('mov g,a', 'Invalid register (must be one of [a,b,c,d])', 0, 4, 0, 5);
		assertDiagnostic('mov a,45', 'Register required', 0, 6, 0, 8);
		assertDiagnostic('mov a,g', 'Invalid register (must be one of [a,b,c,d])', 0, 6, 0, 7);
	});

	test('opc mis-ops', function () {
		assertDiagnostic('opc', 'Parameter required', 0, 0, 0, 3);
		assertDiagnostic('opc a', 'Literal required', 0, 4, 0, 5);
		assertDiagnostic('opc 111111111b', 'Literal out of range (must be between 0 and 11111111)', 0, 4, 0, 14);
		assertDiagnostic('opc 1FFh', 'Literal out of range (must be between 0 and ff)', 0, 4, 0, 8);
		assertDiagnostic('opc 256', 'Literal out of range (must be between 0 and 255)', 0, 4, 0, 7);
	});

	test('ldi mis-ops', function () {
		assertDiagnostic('ldi', 'Two parameters required', 0, 0, 0, 3);
		assertDiagnostic('ldi 56,0', 'Register required', 0, 4, 0, 6);
		assertDiagnostic('ldi a,g', 'Literal required', 0, 6, 0, 7);
		assertDiagnostic('ldi g,3', 'Invalid register (must be one of [a,b,m,j])', 0, 4, 0, 5);
		assertDiagnostic('ldi a,16', 'Literal out of range (must be between -16 and 15)', 0, 6, 0, 8);
		assertDiagnostic('ldi a,-17', 'Literal out of range (must be between -16 and 15)', 0, 6, 0, 9);
	});

});
