import { assertHover } from './hoverUtil';
import { MarkupContent } from 'vscode-languageserver-types';

suite('Instruction Hover', () => {
	test('Simple Position', function (): any {
		const addContent: MarkupContent = {
			kind: 'markdown',
			value: 'Arithmetic Add [ALU]\n\n`A = B + C`'
		};

		assertHover('| add', void 0, void 0);
		assertHover('|add', addContent, 0);
		assertHover('a|dd', addContent, 0);
		assertHover('add|', addContent, 0);
		assertHover('add \n ad|d', addContent, 6);
		assertHover('lab|el: add', void 0, void 0);
		assertHover('add ;comm|ent', void 0, void 0);
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
		assertHover('mov| ,b', { kind: 'markdown', value: 'Copy Register to Register [MOV8]\n\n`? = ?`' }, 0);
		assertHover('mov| a,', { kind: 'markdown', value: 'Copy Register to Register [MOV8]\n\n`A = ?`' }, 0);
		assertHover('mov| q,', { kind: 'markdown', value: 'Copy Register to Register [MOV8]\n\n`? = ?`' }, 0);
		assertHover('mov| q,c', { kind: 'markdown', value: 'Copy Register to Register [MOV8]\n\n`? = C`' }, 0);
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
