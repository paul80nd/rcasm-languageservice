'use strict';

import * as assert from 'assert';
import { Parser } from '../parser/rcasmParser';
import { TokenType } from '../rcasmLanguageTypes';
import * as nodes from '../parser/rcasmNodes';
import { ParseError } from '../parser/rcasmErrors';

export function assertNode(text: string, parser: Parser, f: (...args: any[]) => nodes.Node | null): nodes.Node {
	let node = parser.internalParse(text, f)!;
	assert.ok(node !== null, 'no node returned');
	let markers = nodes.ParseErrorCollector.entries(node);
	if (markers.length > 0) {
		assert.ok(false, 'node has errors: ' + markers[0].getMessage() + ', offset: ' + markers[0].getNode().offset + ' when parsing ' + text);
	}
	assert.ok(parser.accept(TokenType.EOF), 'Expect scanner at EOF');
	return node;
}

export function assertNoNode(text: string, parser: Parser, f: () => nodes.Node | null): void {
	let node = parser.internalParse(text, f)!;
	assert.ok(node === null);
}

export function assertConstantNode(text: string, parser: Parser, f: (...args: any[]) => nodes.Node | null, value: number): void {
	let node = assertNode(text, parser, f);
	let constantNode = node as nodes.Constant;
	assert.ok(constantNode !== null, 'node not a constant');
	assert.equal(constantNode.value, value);
}

export function assertOpcodeNode(text: string, parser: Parser, f: (...args: any[]) => nodes.Node | null, opcode: nodes.OpcodeType): nodes.Opcode {
	let node = assertNode(text, parser, f);
	let opcodeNode = node as nodes.Opcode;
	assert.ok(opcodeNode !== null, 'node not an opcode');
	assert.equal(opcodeNode.opcode, opcode);
	return opcodeNode;
}

export function assertOpcodeNodeWithParam(text: string, parser: Parser, f: (...args: any[]) => nodes.Node | null, opcode: nodes.OpcodeType,
	param: string | number): void {
	let node = assertOpcodeNode(text, parser, f, opcode);

	if (param && node.secondaryParam?.type === nodes.NodeType.Constant) {
		let constParam = node.secondaryParam as nodes.Constant;
		assert.equal(constParam.value, param);
	} else {
		let paramLabel = node.primaryParam as nodes.Label;
		assert.ok(paramLabel !== null, 'primary param is not a label');
		assert.equal(paramLabel.getText(), param);
	}
}

export function assertOpcodeNodeWithParams(text: string, parser: Parser, f: (...args: any[]) => nodes.Node | null, opcode: nodes.OpcodeType,
	param1: nodes.RegisterType,
	param2: number | string | null = null): void {
	let node = assertOpcodeNode(text, parser, f, opcode);

	let regParam = node.primaryParam as nodes.Register;
	assert.ok(regParam !== null, 'primary param is not a register');
	assert.equal(regParam.register, param1);

	if (param2 && node.secondaryParam?.type === nodes.NodeType.Constant) {
		let constParam = node.secondaryParam as nodes.Constant;
		assert.equal(constParam.value, param2);
	}
	if (param2 && node.secondaryParam?.type === nodes.NodeType.Label) {
		let labelParam = node.secondaryParam as nodes.Label;
		assert.equal(labelParam.getText(), param2);
	}
	if (param2 && node.secondaryParam?.type === nodes.NodeType.Register) {
		let reg2Param = node.secondaryParam as nodes.Register;
		assert.equal(reg2Param.register, param2);
	}
}

export function assertRegisterNode(text: string, parser: Parser, f: (...args: any[]) => nodes.Node | null, register: nodes.RegisterType): void {
	let node = assertNode(text, parser, f);
	let registerNode = node as nodes.Register;
	assert.ok(registerNode !== null, 'node not a register');
	assert.equal(registerNode.register, register);
}

function assertError(text: string, parser: Parser, f: () => nodes.Node | null, error: nodes.IRule): void {
	let node = parser.internalParse(text, f)!;
	assert.ok(node !== null, 'no node returned');
	let markers = nodes.ParseErrorCollector.entries(node);
	if (markers.length === 0) {
		assert.ok(false, 'no errors but error expected: ' + error.message);
	} else {
		markers = markers.sort((a, b) => { return a.getOffset() - b.getOffset(); });
		assert.equal(markers[0].getRule().id, error.id, 'incorrect error returned from parsing: ' + text);
	}
}

suite('rcasm - Parser', () => {

	test('Regression Issues', function () {
		let parser = new Parser();
		// Single # was causing infinite loop
		assertError('#', parser, parser._parseProgram.bind(parser), ParseError.OpcodeLabelOrCommentExpected);
	});


	test('Empty Orchestra', function () {
		let parser = new Parser();
		assertNode('', parser, parser._parseProgram.bind(parser));
		assertNode('\n\n\n', parser, parser._parseProgram.bind(parser));
	});

	test('Comment', function () {
		let parser = new Parser();
		assertNode('; comment', parser, parser._parseProgram.bind(parser));
		assertNode('; comment\n; comment2', parser, parser._parseProgram.bind(parser));
	});

	test('Hexadecimal', function () {
		let parser = new Parser();
		assertConstantNode('0x00', parser, parser._parseHexadecimal.bind(parser), 0);
		assertConstantNode('0x0f', parser, parser._parseHexadecimal.bind(parser), 15);
		assertConstantNode('0XFFFF', parser, parser._parseHexadecimal.bind(parser), 65535);
	});

	test('Binary', function () {
		let parser = new Parser();
		assertConstantNode('0b0000', parser, parser._parseBinary.bind(parser), 0);
		assertConstantNode('0b0101', parser, parser._parseBinary.bind(parser), 5);
		assertConstantNode('0B1010', parser, parser._parseBinary.bind(parser), 10);
		assertConstantNode('0b1111', parser, parser._parseBinary.bind(parser), 15);
	});

	test('Integer', function () {
		let parser = new Parser();
		assertConstantNode('0', parser, parser._parseInteger.bind(parser), 0);
		assertConstantNode('456', parser, parser._parseInteger.bind(parser), 456);
		assertConstantNode('+123', parser, parser._parseInteger.bind(parser), 123);
		assertConstantNode('-345', parser, parser._parseInteger.bind(parser), -345);
		assertConstantNode('0023', parser, parser._parseInteger.bind(parser), 23);
		assertNoNode('+xyz', parser, parser._parseInteger.bind(parser));
	});

	test('Constant', function () {
		let parser = new Parser();
		assertConstantNode('0x0f', parser, parser._parseConstant.bind(parser), 15);
		assertConstantNode('0b0101', parser, parser._parseConstant.bind(parser), 5);
		assertConstantNode('456', parser, parser._parseConstant.bind(parser), 456);
		assertConstantNode('-312', parser, parser._parseConstant.bind(parser), -312);
	});

	test('Label Ref', function () {
		let parser = new Parser();
		assertNode('xyz:', parser, parser._parseLabel.bind(parser));
	});

	test('Label Ref', function () {
		let parser = new Parser();
		assertNode('xyz', parser, parser._parseLabelRef.bind(parser));
	});

	test('Register', function () {
		let parser = new Parser();
		assertRegisterNode('a', parser, parser._parseRegister.bind(parser), nodes.RegisterType.A);
		assertRegisterNode('D', parser, parser._parseRegister.bind(parser), nodes.RegisterType.D);
		assertNoNode('z', parser, parser._parseRegister.bind(parser));
	});

	test('Alu Register', function () {
		let parser = new Parser();
		assertRegisterNode('a', parser, parser._parseAluRegister.bind(parser), nodes.RegisterType.A);
		assertRegisterNode('D', parser, parser._parseAluRegister.bind(parser), nodes.RegisterType.D);
		assertRegisterNode('', parser, parser._parseAluRegister.bind(parser), nodes.RegisterType.A);
		assertError('b', parser, parser._parseAluRegister.bind(parser), ParseError.RegisterOutOfRange);
	});

	test('Move Register', function () {
		let parser = new Parser();
		assertRegisterNode('a', parser, parser._parseMoveRegister.bind(parser), nodes.RegisterType.A);
		assertRegisterNode('D', parser, parser._parseMoveRegister.bind(parser), nodes.RegisterType.D);
		assertError('J', parser, parser._parseMoveRegister.bind(parser), ParseError.RegisterOutOfRange);
	});

	test('Set Register', function () {
		let parser = new Parser();
		assertRegisterNode('a', parser, parser._parseSetRegister.bind(parser), nodes.RegisterType.A);
		assertRegisterNode('B', parser, parser._parseSetRegister.bind(parser), nodes.RegisterType.B);
		assertRegisterNode('J', parser, parser._parseSetRegister.bind(parser), nodes.RegisterType.J);
		assertRegisterNode('m', parser, parser._parseSetRegister.bind(parser), nodes.RegisterType.M);
		assertError('d', parser, parser._parseSetRegister.bind(parser), ParseError.RegisterOutOfRange);
	});

	test('Opcode', function () {
		let parser = new Parser();
		assertOpcodeNode('clr', parser, parser._parseOpcode.bind(parser), nodes.OpcodeType.CLR);
		assertOpcodeNode('mov', parser, parser._parseOpcode.bind(parser), nodes.OpcodeType.MOV);
	});

	test('Alu Opcode', function () {
		let parser = new Parser();
		assertOpcodeNodeWithParams('add d', parser, parser._parseOpcodeAndParams.bind(parser), nodes.OpcodeType.ADD, nodes.RegisterType.D);
		assertOpcodeNodeWithParams('rol a', parser, parser._parseOpcodeAndParams.bind(parser), nodes.OpcodeType.ROL, nodes.RegisterType.A);
	});

	test('Clear', function () {
		let parser = new Parser();
		assertOpcodeNodeWithParams('clr a', parser, parser._parseOpcodeAndParams.bind(parser), nodes.OpcodeType.CLR, nodes.RegisterType.A);
		assertOpcodeNodeWithParams('clr c', parser, parser._parseOpcodeAndParams.bind(parser), nodes.OpcodeType.CLR, nodes.RegisterType.C);
		assertError('clr', parser, parser._parseOpcodeAndParams.bind(parser), ParseError.RegisterExpected);
	});

	test('8-bit Ldi Opcode', function () {
		let parser = new Parser();
		assertOpcodeNodeWithParams('ldi a,1', parser, parser._parseOpcodeAndParams.bind(parser), nodes.OpcodeType.LDI, nodes.RegisterType.A, 1);
		assertOpcodeNodeWithParams('ldi b,-14', parser, parser._parseOpcodeAndParams.bind(parser), nodes.OpcodeType.LDI, nodes.RegisterType.B, -14);
		assertOpcodeNodeWithParams('ldi a,0', parser, parser._parseOpcodeAndParams.bind(parser), nodes.OpcodeType.LDI, nodes.RegisterType.A, 0);
		assertError('ldi ,1', parser, parser._parseOpcodeAndParams.bind(parser), ParseError.RegisterExpected);
		assertError('ldi c,1', parser, parser._parseOpcodeAndParams.bind(parser), ParseError.RegisterOutOfRange);
		assertError('ldi b 1', parser, parser._parseOpcodeAndParams.bind(parser), ParseError.CommaExpected);
		assertError('ldi b,', parser, parser._parseOpcodeAndParams.bind(parser), ParseError.IntegerExpected);
		assertError('ldi b, -17', parser, parser._parseOpcodeAndParams.bind(parser), ParseError.ConstantOutOfRange);
		assertError('ldi b, 16', parser, parser._parseOpcodeAndParams.bind(parser), ParseError.ConstantOutOfRange);
	});

	test('16-bit Ldi Opcode', function () {
		let parser = new Parser();
		assertOpcodeNodeWithParams('ldi m,0xFEDC', parser, parser._parseOpcodeAndParams.bind(parser), nodes.OpcodeType.LDI, nodes.RegisterType.M, 0xFEDC);
		assertOpcodeNodeWithParams('ldi j,0xBCD', parser, parser._parseOpcodeAndParams.bind(parser), nodes.OpcodeType.LDI, nodes.RegisterType.J, 0xBCD);
		assertOpcodeNodeWithParams('ldi m,label', parser, parser._parseOpcodeAndParams.bind(parser), nodes.OpcodeType.LDI, nodes.RegisterType.M, "label");
		assertOpcodeNodeWithParams('ldi m,0x0', parser, parser._parseOpcodeAndParams.bind(parser), nodes.OpcodeType.LDI, nodes.RegisterType.M, 0x0);
		assertError('ldi ,1', parser, parser._parseOpcodeAndParams.bind(parser), ParseError.RegisterExpected);
		assertError('ldi xy,1', parser, parser._parseOpcodeAndParams.bind(parser), ParseError.RegisterOutOfRange);
		assertError('ldi m 0x0034', parser, parser._parseOpcodeAndParams.bind(parser), ParseError.CommaExpected);
		assertError('ldi m,', parser, parser._parseOpcodeAndParams.bind(parser), ParseError.ConstantOrLabelExpected);
		assertError('ldi j, 0x1FFFF', parser, parser._parseOpcodeAndParams.bind(parser), ParseError.ConstantOutOfRange);
	});

	test('Mov Opcode', function () {
		let parser = new Parser();
		assertOpcodeNodeWithParams('mov a,d', parser, parser._parseOpcodeAndParams.bind(parser), nodes.OpcodeType.MOV, nodes.RegisterType.A, nodes.RegisterType.D);
		assertOpcodeNodeWithParams('mov c,b', parser, parser._parseOpcodeAndParams.bind(parser), nodes.OpcodeType.MOV, nodes.RegisterType.C, nodes.RegisterType.B);
		assertError('mov', parser, parser._parseOpcodeAndParams.bind(parser), ParseError.RegisterExpected);
		assertError('mov m1,a', parser, parser._parseOpcodeAndParams.bind(parser), ParseError.RegisterOutOfRange);
		assertError('mov b', parser, parser._parseOpcodeAndParams.bind(parser), ParseError.CommaExpected);
		assertError('mov b,', parser, parser._parseOpcodeAndParams.bind(parser), ParseError.RegisterExpected);
		assertError('mov b,m1', parser, parser._parseOpcodeAndParams.bind(parser), ParseError.RegisterOutOfRange);
	});

	test('Mov Opcode', function () {
		let parser = new Parser();
		assertOpcodeNodeWithParams('mov a,d', parser, parser._parseOpcodeAndParams.bind(parser), nodes.OpcodeType.MOV, nodes.RegisterType.A, nodes.RegisterType.D);
		assertOpcodeNodeWithParams('mov c,b', parser, parser._parseOpcodeAndParams.bind(parser), nodes.OpcodeType.MOV, nodes.RegisterType.C, nodes.RegisterType.B);
		assertError('mov', parser, parser._parseOpcodeAndParams.bind(parser), ParseError.RegisterExpected);
		assertError('mov m1,a', parser, parser._parseOpcodeAndParams.bind(parser), ParseError.RegisterOutOfRange);
		assertError('mov b', parser, parser._parseOpcodeAndParams.bind(parser), ParseError.CommaExpected);
		assertError('mov b,', parser, parser._parseOpcodeAndParams.bind(parser), ParseError.RegisterExpected);
		assertError('mov b,m1', parser, parser._parseOpcodeAndParams.bind(parser), ParseError.RegisterOutOfRange);
	});

	test('Branching Opcodes', function () {
		let parser = new Parser();
		assertOpcodeNode('rts', parser, parser._parseOpcode.bind(parser), nodes.OpcodeType.RTS);
		assertOpcodeNodeWithParam('jmp test', parser, parser._parseOpcodeAndParams.bind(parser), nodes.OpcodeType.JMP, "test");
		assertOpcodeNodeWithParam('jsr test', parser, parser._parseOpcodeAndParams.bind(parser), nodes.OpcodeType.JSR, "test");
		assertOpcodeNodeWithParam('bne test2', parser, parser._parseOpcodeAndParams.bind(parser), nodes.OpcodeType.BNE, "test2");
		assertOpcodeNodeWithParam('blt test.tset', parser, parser._parseOpcodeAndParams.bind(parser), nodes.OpcodeType.BLT, "test.tset");
		assertError('ble', parser, parser._parseOpcodeAndParams.bind(parser), ParseError.LabelRefExpected);
	});

	test('Opcode Opcode', function () {
		let parser = new Parser();
		assertOpcodeNode('opc', parser, parser._parseOpcode.bind(parser), nodes.OpcodeType.OPC);
		assertOpcodeNodeWithParam('opc 0xFE', parser, parser._parseOpcodeAndParams.bind(parser), nodes.OpcodeType.OPC, 0xFE);
		assertOpcodeNodeWithParam('opc 0b01010011', parser, parser._parseOpcodeAndParams.bind(parser), nodes.OpcodeType.OPC, 0b01010011);
		assertOpcodeNodeWithParam('opc 0b00000000', parser, parser._parseOpcodeAndParams.bind(parser), nodes.OpcodeType.OPC, 0b0);
		assertOpcodeNodeWithParam('opc 0x00', parser, parser._parseOpcodeAndParams.bind(parser), nodes.OpcodeType.OPC, 0x0);
		assertError('opc', parser, parser._parseOpcodeAndParams.bind(parser), ParseError.OpcodeLiteralExpected);
		assertError('opc 0x1FF', parser, parser._parseOpcodeAndParams.bind(parser), ParseError.ConstantOutOfRange);
	});

	test('Instruction', function () {
		let parser = new Parser();
		assertNode('inc', parser, parser._parseInstruction.bind(parser));
		assertNode('and d', parser, parser._parseInstruction.bind(parser));
		assertNode('ldi a,12', parser, parser._parseInstruction.bind(parser));
		assertNode('mov a,d', parser, parser._parseInstruction.bind(parser));
		assertNode('mov a,d ; comment', parser, parser._parseInstruction.bind(parser));
		assertNode('loop: mov a,d', parser, parser._parseInstruction.bind(parser));
		assertNode('loop: mov a,d ; comment', parser, parser._parseInstruction.bind(parser));
		assertError('loop2: loop3:', parser, parser._parseInstruction.bind(parser), ParseError.OpcodeExpected);
		assertError('loop2: 45', parser, parser._parseInstruction.bind(parser), ParseError.OpcodeExpected);
		assertError('loop2: ; comment', parser, parser._parseInstruction.bind(parser), ParseError.OpcodeExpected);
		assertError('bnz loop', parser, parser._parseInstruction.bind(parser), ParseError.OpcodeExpected);
	});

	test('Instruction or Comment', function () {
		let parser = new Parser();
		assertNode('mov a,d', parser, parser._parseCommentOrInstruction.bind(parser));
		assertNode('loop: mov a,d ; comment', parser, parser._parseCommentOrInstruction.bind(parser));
		assertNode('; comment', parser, parser._parseCommentOrInstruction.bind(parser));
		assertError('bnz loop ; comment', parser, parser._parseCommentOrInstruction.bind(parser), ParseError.OpcodeExpected);
	});

	test('Program', function () {
		let parser = new Parser();
		assertNode('loop: mov a,d ; comment', parser, parser._parseProgram.bind(parser));
		assertNode('; comment', parser, parser._parseProgram.bind(parser));
		assertNode('loop: mov a,d ; comment\n; comment\nldi a,4', parser, parser._parseProgram.bind(parser));
		assertNode('; comment\n\nmov a,d ; comment\n; ldi a,4', parser, parser._parseProgram.bind(parser));
		assertError('mov a,d mov a,b', parser, parser._parseProgram.bind(parser), ParseError.EolExpected);
		assertError('mov a,d mov a,b', parser, parser._parseProgram.bind(parser), ParseError.EolExpected);
		assertError('bnz loop ; comment', parser, parser._parseProgram.bind(parser), ParseError.OpcodeExpected);
	});

	test('Full Program', function () {
		let parser = new Parser();

		// Program OK for missing branching opcodes
		assertNode([
			';*****************************************************',
			'; Demo program to calculate Fibonacci series',
			'; Result is placed in A register on each loop',
			'; until calculation overflows. Result is:',
			'; 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233',
			';*****************************************************',
			'',
			'start:  ldi a,1     ; Inital setup A = B = 1',
			'        mov b,a',
			'',
			'loop:   mov c,b     ; Calculate C = B, B = A then add',
			'        mov b,a',
			'        add',
		].join('\n'), parser, parser._parseProgram.bind(parser));

		assertError([
			'        bnz loop    ; Loop until zero',
			'',
			'end:    jmp end     ; infinite loop',
		].join('\n'), parser, parser._parseProgram.bind(parser), ParseError.OpcodeExpected);
	});

});