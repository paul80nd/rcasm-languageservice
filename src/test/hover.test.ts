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

	const load16Content = '__16-bit Load Immediate__ GOTO 24  \nLoads a 16-bit constant value into dst (register m or j), value can be between 0x0000 and 0xFFFF.  \nSynopsis: ';
	const move8Content = '__8-bit Register to Register Copy__ MOV8 8  \nCopies a value from src to dst between any of the eight general purpose 8-bit registers. If dst and src are the same then dst will be set to 0.  \nSynopsis: ';
	const move16Content = '__16-bit Register to Register Copy__ MOV16 10  \nCopies a value between the 16-bit src registers (m, xy or j) and dst (xy or the program counter pc). If dst and src are the same then dst will be set to 0.  \nSynopsis: ';
	const jmpContent = '__Unconditional Jump__ GOTO 24  \nUnconditionally jumps to label (via register j).  \nSynopsis: ';
	const jsrContent = '__Jump Subroutine__ GOTO 24  \nSaves the address of the next instruction into register xy and then unconditionally jumps to label (via register j). Notionally behaves as a \'call subroutine\' operation.  \nSynopsis: ';

	test('Simple Position', () => {
		const addContent: string = '__Arithmetic Add__ ALU 8  \nAdds the contents of register b and c placing the result in dst (a or d). If dst is not specified then register a is assumed. Affects Z (zero), S (sign) and C (carry) flags.  \nSynopsis: `A = B + C`';
		assertHoverMkdn('| add', null);
		assertHoverMkdn('|add', addContent);
		assertHoverMkdn('a|dd', addContent);
		assertHoverMkdn('add|', addContent);
		assertHoverMkdn('lab|el: add', null);
		assertHoverMkdn('add ;comm|ent', null);
		assertHover('add \n ad|d', { contents: { kind: 'markdown', value: addContent }, range: testRange(1, 4, 1) });
	});

	test('ALU', () => {
		const incContent = '__Increment__ ALU 8  \nAdds one to the contents of register b (register c is ignored) placing the result in dst (a or d). If dst is not specified then register a is assumed. Affects Z (zero), S (sign) and C (carry) flags.  \nSynopsis: ';
		const xorContent = '__Compare (Logic Xor)__ ALU 8  \nCompares the values in register b and c setting condition flag Z (zero) if the values are the same. Overwrites dst (a or d). If dst is not specified then register a is assumed. Affects Z (zero) and S (sign) flags. Synonym of `eor`.  \nSynopsis: ';
		assertHoverMkdn('inc|', incContent + '`A = B + 1`');
		assertHoverMkdn('inc| a', incContent + '`A = B + 1`');
		assertHoverMkdn('inc| d', incContent + '`D = B + 1`');
		assertHoverMkdn('cmp|', xorContent + '`A = B ^ C`');
		assertHoverMkdn('cmp| d', xorContent + '`D = B ^ C`');
	});

	test('Bad Params', () => {
		assertHoverMkdn('mov|', move8Content + '`? = ?`');
		assertHoverMkdn('mov| ,b', null);
		assertHoverMkdn('mov| a,', null);
		assertHoverMkdn('mov| q,', null);
		assertHoverMkdn('mov| q,c', move8Content + '`(q) = C`');
	});

	test('CLR', () => {
		const clr8Content = '__8-bit Register Clear__ MOV8 8  \nClears (sets to 0) general purpose 8-bit register dst. This is the equivalent of `mov dst,dst`.  \nSynopsis: ';
		const clr16Content = '__16-bit Register Clear__ MOV16 10  \nClears (sets to 0) 16-bit register xy. This is the equivalent of `mov xy,xy`.  \nSynopsis: ';
		assertHoverMkdn('clr| c', clr8Content + '`C = 0`');
		assertHoverMkdn('clr y|', clr8Content + '`Y = 0`');
		assertHoverMkdn('clr x|y', clr16Content + '`XY = 0`');
	});

	test('MOV', () => {
		assertHoverMkdn('mov| b,c', move8Content + '`B = C`');
		assertHoverMkdn('mov a|,d', move8Content + '`A = D`');
		assertHoverMkdn('mov m1,|x', move8Content + '`M1 = X`');
		assertHoverMkdn('mov xy,|j', move16Content + '`XY = J`');
		assertHoverMkdn('mov xy,a|s', move16Content + '`XY = AS`');
	});

	test('HLT', () => {
		assertHoverMkdn('hlt|', '__Halt__ MISC 10  \nHalts execution of the program.  \nSynopsis: `HALT (PC = PC + 1)`');
		assertHoverMkdn('hlr|', '__Halt and Reload__ MISC 10  \nHalts execution of the program and sets the program counter to the value on the primary switches.  \nSynopsis: `HALT (PC = AS)`');
	});

	test('IXY', () => {
		assertHoverMkdn('ixy|', '__XY Increment__ INCXY 14  \nIncrements the 16-bit value in the xy register by 1.  \nSynopsis: `XY = XY + 1`');
	});

	test('LDI', () => {
		const load8 = '__8-bit Load Immediate__ SETAB 8  \nLoads an 8-bit constant value into dst (register a or b), value must be between -16 and 15.  \nSynopsis: ';
		assertHoverMkdn('ldi| a,0', load8 + '`A = 0`');
		assertHoverMkdn('ldi| b,-5', load8 + '`B = -5`');
		assertHoverMkdn('ldi| a,11', load8 + '`A = 11`');
		assertHoverMkdn('ldi| b,0xe', load8 + '`B = 14`');
		assertHoverMkdn('ldi| m,0xFEDC', load16Content + '`M = 0xFEDC`');
		assertHoverMkdn('ldi| j,label', load16Content + '`J = (label)`');
	});

	test('LDS', () => {
		const loadContent = '__Load Register from Switches__ MISC 10  \nLoads register dst (a or d) from the front panel switches  \nSynopsis: '
		assertHoverMkdn('lds|', loadContent + '`? = DS`');
		assertHoverMkdn('lds| a', loadContent + '`A = DS`');
		assertHoverMkdn('lds| d', loadContent + '`D = DS`');
	});

	test('LDR', () => {
		const loadContent = '__Load Register from Memory__ LOAD 12  \nLoads register dst (a, b, c or d) with the byte in memory currently referenced by register m.  \nSynopsis: '
		assertHoverMkdn('ldr|', loadContent + '`? = (M)`');
		assertHoverMkdn('ldr| a', loadContent + '`A = (M)`');
		assertHoverMkdn('ldr| c', loadContent + '`C = (M)`');
	});

	test('STR', () => {
		const storeContent = '__Store Register into Memory__ STORE 12  \nStores register src (a, b, c or d) into the byte of memory currently referenced by register m.  \nSynopsis: '
		assertHoverMkdn('str|', storeContent + '`(M) = ?`');
		assertHoverMkdn('str| a', storeContent + '`(M) = A`');
		assertHoverMkdn('str| c', storeContent + '`(M) = C`');
	});


	//	test('ORG', () => {
	//		assertHoverMkdn('org| 0xFEDC', '__Set Program Counter__ PSEUDO\n`PC = 0xFEDC`');
	//	});

	test('Byte Directive', () => {
		const byteContent = '__Define Byte Data__  \nWrites the given 8-bit values directly into the output starting from current location.  \nSyntax: `<value>{0x00,0xFF} [ ,...n ]`';
		assertHoverMkdn('!byte| 0xFE', byteContent);
		assertHoverMkdn('!byte| 0xFE, 123', byteContent);
		assertHoverMkdn('!byte| "test"', byteContent);
	});

	test('Word Directive', () => {
		const wordContent = '__Define Word Data__  \nWrites the given 16-bit values directly into the output starting from current location.  \nSyntax: `<value>{0x0000,0xFFFF} [ ,...n ]`';
		assertHoverMkdn('!word| 0xFEDC', wordContent);
		assertHoverMkdn('!word| 0xFEDC, 213123', wordContent);
		assertHoverMkdn('!word| "test"', wordContent);
	});

	test('Fill Directive', () => {
		const fillContent = '__Define Fill Space__  \nWrites the given 8-bit value n times directly into the output starting from current location.  \nSyntax: `<count>{0,255}, <value>{0x00,0xFF}`';
		assertHoverMkdn('!fill| 3,0', fillContent);
		assertHoverMkdn('!fill| 4, 0x11', fillContent);
		assertHoverMkdn('!fill| 6, "t"', fillContent);
	});

	test('For Directive', () => {
		const forContent = '__Define For Loop__  \nDefines a loop that will be expanded at assembly time. The loop will be expanded n times.  \nSyntax: `<variable> in range([<start> ,] <end>)`';
		assertHoverMkdn('!for| i in range(10) {\nadd\n}', forContent);
		assertHoverMkdn('!for i i|n range(2, 10) {\ninc\n}', forContent);
		assertHoverMkdn('!for i in ran|ge(4, 6) {\norr\n}', forContent);
		assertHoverMkdn('!for i in range(4, 6) {\nmo|v a,b\n}', move8Content + '`A = B`');
	});

	test('Align Directive', () => {
		assertHoverMkdn('!align| 4', '__Define Align__  \nWrites 8-bit zeros into the output until the current location is a multiple of the given value.  \nSyntax: `<value>{2,4,8,16...}`');
	});

	test('Branching', () => {
		assertHoverMkdn('jm|p label1', jmpContent + '`PC = (label1)`');
		assertHoverMkdn('jsr |label2 ', jsrContent + '`XY = PC, PC = (label2)`');
		assertHoverMkdn('bne lab|el3', '__Branch if Not Equal (not zero)__ GOTO 24  \nJumps to label if Z is not set (last ALU operation result was not 0).  \nSynopsis: `PC = (label3) [if not Z]`');
		assertHoverMkdn('beq label4|', '__Branch if Equal (zero)__ GOTO 24  \nJumps to label if Z flag is set (last ALU operation result was 0).  \nSynopsis: `PC = (label4) [if Z]`');
		assertHoverMkdn('ble| label5 ', '__Branch if Less Than or Equal (sign or zero)__ GOTO 24  \nJumps to label if S or Z is set (last ALU operation resulted in a zero or negative value).  \nSynopsis: `PC = (label5) [if S or Z]`');
		assertHoverMkdn('bcs |0x12aB', '__Branch if Carry Set__ GOTO 24  \nJumps to label if C is set (last ALU operation resulted in a carry).  \nSynopsis: `PC = 0x12AB [if CY]`');
		assertHoverMkdn('blt 2345|3', '__Branch if Less Than (sign set)__ GOTO 24  \nJumps to label if S is set (last ALU operation has most significant bit set / is negative). Synonym of `bmi`.  \nSynopsis: `PC = 0x5B9D [if S]`');
		assertHoverMkdn('bmi label4|', '__Branch if Minus/Sign__ GOTO 24  \nJumps to label if S is set (last ALU operation has most significant bit set / is negative). Synonym of `blt`.  \nSynopsis: `PC = (label4) [if S]`');
		assertHoverMkdn('rt|s', '__Return from Subroutine__ MOV16 10  \nCopies the value in register xy to the program counter pc. Notionally behaves as a \'return\' operation to a previous jsr call.  \nSynopsis: `PC = XY`');
	});

	test('Scopes', () => {
		assertHoverMkdn('label1: { \n jm|p label1 \n }', jmpContent + '`PC = (label1)`');
	});

	test('§ Operator', () => {
		assertHoverMkdn('Ldi| m,5§ra', load16Content + '`M = 5§ra`');
	});

});

export function testRange(start: number, end: number, line: number = 0) {
	return Range.create(Position.create(line, start), Position.create(line, end));
}
