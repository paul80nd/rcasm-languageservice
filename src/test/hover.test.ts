'use strict';

import * as assert from 'assert';
import { Hover, Position, Range, TextDocument, getLanguageService } from '../rcasmLanguageService';

function assertHoverMkdn(value: string, expected: string | null) {
	if (expected) {
		assertHover(value, { contents: { kind: 'markdown', value: expected } });
	} else {
		assertHover(value, null);
	}
}

function assertHover(value: string, expected: Hover | null): void {
	const offset = value.indexOf('|');
	value = value.slice(0, offset) + value.slice(offset + 1);

	const document = TextDocument.create('test://test/test.rcasm', 'rcasm', 1, value);
	let ls = getLanguageService();
	let program = ls.parseProgram(document);
	const position = document.positionAt(offset);

	const hoverResult = ls.doHover(document, position, program);
	if (expected) {
		assert(hoverResult);

		if (hoverResult!.range && expected.range) {
			assert.deepEqual(hoverResult!.range, expected.range);
		}
		assert.deepEqual(hoverResult!.contents, expected.contents);
	}
	else {
		assert.equal(hoverResult, null);
	}
}

suite('RCASM Hover', () => {
	test('Simple Position', () => {
		const addContent: string = 'Arithmetic Add [ALU]\n\n`A = B + C`';

		assertHoverMkdn('| add', null);
		assertHoverMkdn('|add', addContent);
		assertHoverMkdn('a|dd', addContent);
		assertHoverMkdn('add|', addContent);
		assertHoverMkdn('lab|el: add', null);
		assertHoverMkdn('add ;comm|ent', null);
		assertHover('add \n ad|d', { contents: { kind: 'markdown', value: addContent }, range: testRange(1, 4, 1) });
	});

	test('ALU', () => {
		assertHoverMkdn('inc|', 'Increment [ALU]\n\n`A = B + 1`');
		assertHoverMkdn('inc| a', 'Increment [ALU]\n\n`A = B + 1`');
		assertHoverMkdn('inc| d', 'Increment [ALU]\n\n`D = B + 1`');
		assertHoverMkdn('cmp|', 'Compare (Logic Xor) [ALU]\n\n`A = B ^ C`');
		assertHoverMkdn('cmp| d', 'Compare (Logic Xor) [ALU]\n\n`D = B ^ C`');
	});

	test('Bad Params', () => {
		assertHoverMkdn('mov|', 'Copy Register to Register [MOV8|MOV16]\n\n`? = ?`');
		assertHoverMkdn('mov| ,b', null);
		assertHoverMkdn('mov| a,', null);
		assertHoverMkdn('mov| q,', null);
		assertHoverMkdn('mov| q,c', 'Copy Register to Register [MOV8|MOV16]\n\n`(q) = C`');
	});

	test('CLR', () => {
		assertHoverMkdn('clr| c', 'Zero Value [MOV8|MOV16]\n\n`C = 0`');
		assertHoverMkdn('clr y|', 'Zero Value [MOV8|MOV16]\n\n`Y = 0`');
	});

	test('MOV', () => {
		assertHoverMkdn('mov| b,c', 'Copy Register to Register [MOV8|MOV16]\n\n`B = C`');
		assertHoverMkdn('mov a|,d', 'Copy Register to Register [MOV8|MOV16]\n\n`A = D`');
		assertHoverMkdn('mov m1,|x', 'Copy Register to Register [MOV8|MOV16]\n\n`M1 = X`');
		assertHoverMkdn('mov xy,|j', 'Copy Register to Register [MOV8|MOV16]\n\n`XY = J`');
		assertHoverMkdn('mov xy,a|s', 'Copy Register to Register [MOV8|MOV16]\n\n`XY = AS`');
	});

	test('HLT', () => {
		assertHoverMkdn('hlt|', 'Halt [MISC]\n\n`HALT (PC = PC + 1)`');
		assertHoverMkdn('hlr|', 'Halt and Reload [MISC]\n\n`HALT (PC = AS)`');
	});

	test('IXY', () => {
		assertHoverMkdn('ixy|', 'Increments contents of 16-bit register XY [INCXY]\n\n`XY = XY + 1`');
	});

	test('LDI', () => {
		assertHoverMkdn('ldi| a,0', 'Load Immediate [SETAB|GOTO]\n\n`A = 0`');
		assertHoverMkdn('ldi| b,-5', 'Load Immediate [SETAB|GOTO]\n\n`B = -5`');
		assertHoverMkdn('ldi| a,11', 'Load Immediate [SETAB|GOTO]\n\n`A = 11`');
		assertHoverMkdn('ldi| b,0xe', 'Load Immediate [SETAB|GOTO]\n\n`B = 14`');
		assertHoverMkdn('ldi| m,0xFEDC', 'Load Immediate [SETAB|GOTO]\n\n`M = 0xFEDC`');
		assertHoverMkdn('ldi| j,label', 'Load Immediate [SETAB|GOTO]\n\n`J = (label)`');
	});

	test('LDS', () => {
		assertHoverMkdn('lds|', 'Load Switches [MISC]\n\n`? = DS`');
		assertHoverMkdn('lds| a', 'Load Switches [MISC]\n\n`A = DS`');
		assertHoverMkdn('lds| d', 'Load Switches [MISC]\n\n`D = DS`');
	});

	test('LDR', () => {
		assertHoverMkdn('ldr|', 'Load Register from Memory [LOAD]\n\n`? = (M)`');
		assertHoverMkdn('ldr| a', 'Load Register from Memory [LOAD]\n\n`A = (M)`');
		assertHoverMkdn('ldr| c', 'Load Register from Memory [LOAD]\n\n`C = (M)`');
	});

	test('STR', () => {
		assertHoverMkdn('str|', 'Store Register into Memory [STORE]\n\n`(M) = ?`');
		assertHoverMkdn('str| a', 'Store Register into Memory [STORE]\n\n`(M) = A`');
		assertHoverMkdn('str| c', 'Store Register into Memory [STORE]\n\n`(M) = C`');
	});


	test('ORG', () => {
		assertHoverMkdn('org| 0xFEDC', 'Set Program Counter [PSEUDO]\n\n`PC = 0xFEDC`');
	});

	test('Byte Directive', () => {
		assertHoverMkdn('!byte| 0xFE', 'Writes the given 8-bit values directly into the output starting from current location.\n\nSyntax: `<value>{0x00,0xFF} [ ,...n ]`');
		assertHoverMkdn('!byte| 0xFE, 123', 'Writes the given 8-bit values directly into the output starting from current location.\n\nSyntax: `<value>{0x00,0xFF} [ ,...n ]`');
		assertHoverMkdn('!byte| "test"', 'Writes the given 8-bit values directly into the output starting from current location.\n\nSyntax: `<value>{0x00,0xFF} [ ,...n ]`');
	});

	test('Word Directive', () => {
		assertHoverMkdn('!word| 0xFEDC', 'Writes the given 16-bit values directly into the output starting from current location.\n\nSyntax: `<value>{0x0000,0xFFFF} [ ,...n ]`');
		assertHoverMkdn('!word| 0xFEDC, 213123', 'Writes the given 16-bit values directly into the output starting from current location.\n\nSyntax: `<value>{0x0000,0xFFFF} [ ,...n ]`');
		assertHoverMkdn('!word| "test"', 'Writes the given 16-bit values directly into the output starting from current location.\n\nSyntax: `<value>{0x0000,0xFFFF} [ ,...n ]`');
	});

	test('Fill Directive', () => {
		assertHoverMkdn('!fill| 3,0', 'Writes the given 8-bit value n times directly into the output starting from current location.\n\nSyntax: `<count>{0,255}, <value>{0x00,0xFF}`');
		assertHoverMkdn('!fill| 4, 0x11', 'Writes the given 8-bit value n times directly into the output starting from current location.\n\nSyntax: `<count>{0,255}, <value>{0x00,0xFF}`');
		assertHoverMkdn('!fill| 6, "t"', 'Writes the given 8-bit value n times directly into the output starting from current location.\n\nSyntax: `<count>{0,255}, <value>{0x00,0xFF}`');
	});

	test('Align Directive', () => {
		assertHoverMkdn('!align| 4', 'Writes 8-bit zeros into the output until the current location is a multiple of the given value.\n\nSyntax: `<value>{2,4,8,16...}`');
	});

	test('Branching', () => {
		assertHoverMkdn('jm|p label1', 'Jump to Label [GOTO]\n\n`PC = (label1)`');
		assertHoverMkdn('jsr |label2 ', 'Call Subroutine (Jump and Link) [GOTO]\n\n`XY = PC, PC = (label2)`');
		assertHoverMkdn('bne lab|el3', 'Branch if Not Equal/Zero [GOTO]\n\n`PC = (label3) [if not Z]`');
		assertHoverMkdn('beq label4|', 'Branch if Equal/Zero [GOTO]\n\n`PC = (label4) [if Z]`');
		assertHoverMkdn('ble| label5 ', 'Branch if Less Than or Equal (Sign+Zero) [GOTO]\n\n`PC = (label5) [if S or Z]`');
		assertHoverMkdn('bcs |0x12aB', 'Branch if Carry Set [GOTO]\n\n`PC = 0x12AB [if CY]`');
		assertHoverMkdn('blt 2345|3', 'Branch if Less Than (Sign) [GOTO]\n\n`PC = 0x5B9D [if S]`');
		assertHoverMkdn('bmi label4|', 'Branch if Minus/Sign [GOTO]\n\n`PC = (label4) [if S]`');
		assertHoverMkdn('rt|s', 'Return from Subroutine [MOV16]\n\n`PC = XY`');
	});

	test('Scopes', () => {
		assertHoverMkdn('label1: { \n jm|p label1 \n }', 'Jump to Label [GOTO]\n\n`PC = (label1)`');
	});

	test('§ Operator', () => {
		assertHoverMkdn('Ldi| m,5§ra', 'Load Immediate [SETAB|GOTO]\n\n`M = 5§ra`');
	});

});

export function testRange(start: number, end: number, line: number = 0) {
	return Range.create(Position.create(line, start), Position.create(line, end));
}
