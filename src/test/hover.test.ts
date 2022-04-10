'use strict';

import * as assert from 'assert';
import { Hover, MarkupContent, TextDocument, getLanguageService } from '../rcasmLanguageService';

export function assertHover(value: string, expectedHoverContent: MarkupContent | null, expectedHoverOffset: number | null): void {
	const offset = value.indexOf('|');
	value = value.slice(0, offset) + value.slice(offset + 1);

	const document = TextDocument.create('test://test/test.rcasm', 'rcasm', 0, value);

	const position = document.positionAt(offset);
	const ls = getLanguageService();
	const program = ls.parseProgram(document);

	const hover = ls.doHover(document, position, program);
	assert.deepStrictEqual(hover && hover.contents, expectedHoverContent);
	assert.strictEqual(hover && document.offsetAt(hover.range!.start), expectedHoverOffset);
}

suite('Instruction Hover', () => {
	test('Simple Position', () => {
		const addContent: MarkupContent = {
			kind: 'markdown',
			value: 'Arithmetic Add [ALU]\n\n`A = B + C`'
		};

		assertHover('| add', null, null);
		assertHover('|add', addContent, 0);
		assertHover('a|dd', addContent, 0);
		assertHover('add|', addContent, 0);
		assertHover('add \n ad|d', addContent, 6);
		assertHover('lab|el: add', null, null);
		assertHover('add ;comm|ent', null, null);
	});

	test('ALU', function (): any {
		assertHover('inc|', { kind: 'markdown', value: 'Increment [ALU]\n\n`A = B + 1`' }, 0);
		assertHover('inc| a', { kind: 'markdown', value: 'Increment [ALU]\n\n`A = B + 1`' }, 0);
		assertHover('inc| d', { kind: 'markdown', value: 'Increment [ALU]\n\n`D = B + 1`' }, 0);
		assertHover('cmp|', { kind: 'markdown', value: 'Compare (Logic Xor) [ALU]\n\n`A = B != C`' }, 0);
		assertHover('cmp| d', { kind: 'markdown', value: 'Compare (Logic Xor) [ALU]\n\n`D = B != C`' }, 0);
	});

	test('Bad Params', function (): any {
		assertHover('mov|', { kind: 'markdown', value: 'Copy Register to Register [MOV8]\n\n`? = ?`' }, 0);
		assertHover('mov| ,b', null, null);
		assertHover('mov| a,', null, null);
		assertHover('mov| q,', null, null);
		assertHover('mov| q,c', { kind: 'markdown', value: 'Copy Register to Register [MOV8]\n\n`(q) = C`' }, 0);
	});

	test('MOV', function (): any {
		assertHover('mov| b,c', { kind: 'markdown', value: 'Copy Register to Register [MOV8]\n\n`B = C`' }, 0);
		assertHover('mov a|,d', { kind: 'markdown', value: 'Copy Register to Register [MOV8]\n\n`A = D`' }, 0);
	});

	test('LDI', function (): any {
		assertHover('ldi| a,0', { kind: 'markdown', value: 'Load Immediate [SETAB]\n\n`A = 0`' }, 0);
		assertHover('ldi| b,-5', { kind: 'markdown', value: 'Load Immediate [SETAB]\n\n`B = -5`' }, 0);
		assertHover('ldi| a,11', { kind: 'markdown', value: 'Load Immediate [SETAB]\n\n`A = 11`' }, 0);
		assertHover('ldi| m,0xFEDC', { kind: 'markdown', value: 'Load Immediate [SETAB]\n\n`M = 0xFEDC`' }, 0);
		assertHover('ldi| j,label', { kind: 'markdown', value: 'Load Immediate [SETAB]\n\n`J = (label)`' }, 0);
	});

	test('Branching', function (): any {
		assertHover('jm|p label1', { kind: 'markdown', value: 'Jump to Label [GOTO]\n\n`PC = (label1)`' }, 0);
		assertHover('jsr |label2', { kind: 'markdown', value: 'Call Subroutine (Jump and Link) [GOTO]\n\n`XY = PC, PC = (label2)`' }, 0);
		assertHover('bne lab|el3', { kind: 'markdown', value: 'Branch if Not Equal/Zero [GOTO]\n\n`PC = (label3) [if not Z]`' }, 0);
		assertHover('beq label4|', { kind: 'markdown', value: 'Branch if Equal/Zero [GOTO]\n\n`PC = (label4) [if Z]`' }, 0);
		assertHover('ble| label5', { kind: 'markdown', value: 'Branch if Less Than or Equal (Sign+Zero) [GOTO]\n\n`PC = (label5) [if S or Z]`' }, 0);
	});

});
