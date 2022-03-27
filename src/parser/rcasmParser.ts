'use strict';

import { Scanner, IToken } from './rcasmScanner';
import { ParseError, RcasmIssueType } from './rcasmErrors';
import * as nodes from './rcasmNodes';
import { TokenType } from '../rcasmLanguageTypes';
import { TextDocument } from 'vscode-languageserver-textdocument';

const staticOpcodeTable: { [code: string]: nodes.OpcodeType; } = {};
staticOpcodeTable['add'] = nodes.OpcodeType.ADD;
staticOpcodeTable['inc'] = nodes.OpcodeType.INC;
staticOpcodeTable['and'] = nodes.OpcodeType.AND;
staticOpcodeTable['orr'] = nodes.OpcodeType.ORR;
staticOpcodeTable['eor'] = nodes.OpcodeType.EOR;
staticOpcodeTable['not'] = nodes.OpcodeType.NOT;
staticOpcodeTable['rol'] = nodes.OpcodeType.ROL;
staticOpcodeTable['cmp'] = nodes.OpcodeType.CMP;
staticOpcodeTable['mov'] = nodes.OpcodeType.MOV;
staticOpcodeTable['clr'] = nodes.OpcodeType.CLR;
staticOpcodeTable['ldi'] = nodes.OpcodeType.LDI;
staticOpcodeTable['opc'] = nodes.OpcodeType.OPC;
staticOpcodeTable['jmp'] = nodes.OpcodeType.JMP;
staticOpcodeTable['jsr'] = nodes.OpcodeType.JSR;
staticOpcodeTable['rts'] = nodes.OpcodeType.RTS;
staticOpcodeTable['bne'] = nodes.OpcodeType.BNE;
staticOpcodeTable['beq'] = nodes.OpcodeType.BEQ;
staticOpcodeTable['blt'] = nodes.OpcodeType.BLT;
staticOpcodeTable['ble'] = nodes.OpcodeType.BLE;
staticOpcodeTable['bmi'] = nodes.OpcodeType.BMI;
staticOpcodeTable['bcs'] = nodes.OpcodeType.BCS;

const staticRegisterTable: { [code: string]: nodes.RegisterType; } = {};
staticRegisterTable['a'] = nodes.RegisterType.A;
staticRegisterTable['b'] = nodes.RegisterType.B;
staticRegisterTable['c'] = nodes.RegisterType.C;
staticRegisterTable['d'] = nodes.RegisterType.D;
staticRegisterTable['m1'] = nodes.RegisterType.M1;
staticRegisterTable['m2'] = nodes.RegisterType.M2;
staticRegisterTable['m'] = nodes.RegisterType.M;
staticRegisterTable['x'] = nodes.RegisterType.X;
staticRegisterTable['y'] = nodes.RegisterType.Y;
staticRegisterTable['xy'] = nodes.RegisterType.XY;
staticRegisterTable['j1'] = nodes.RegisterType.J1;
staticRegisterTable['j2'] = nodes.RegisterType.J2;
staticRegisterTable['j'] = nodes.RegisterType.J;

/// <summary>
/// A parser for rcasm.
/// </summary>
export class Parser {

	public scanner: Scanner;
	public token: IToken;
	public prevToken?: IToken;

	private lastErrorToken?: IToken;

	constructor(scnr: Scanner = new Scanner()) {
		this.scanner = scnr;
		this.token = { type: TokenType.EOF, offset: -1, len: 0, text: '' };
		this.prevToken = undefined!;
	}

	public peek(type: TokenType): boolean {
		return type === this.token.type;
	}

	public peekIsBeyondOpcode(): boolean {
		return this.peek(TokenType.Comment)
			|| this.peek(TokenType.EOL)
			|| this.peek(TokenType.EOF);
	}

	public consumeToken(): void {
		this.prevToken = this.token;
		this.token = this.scanner.scan();
	}

	public accept(type: TokenType) {
		if (type === this.token.type) {
			this.consumeToken();
			return true;
		}
		return false;
	}

	public resync(resyncTokens: TokenType[] | undefined, resyncStopTokens: TokenType[] | undefined): boolean {
		while (true) {
			if (resyncTokens && resyncTokens.indexOf(this.token.type) !== -1) {
				this.consumeToken();
				return true;
			} else if (resyncStopTokens && resyncStopTokens.indexOf(this.token.type) !== -1) {
				return true;
			} else {
				if (this.token.type === TokenType.EOF) {
					return false;
				}
				this.token = this.scanner.scan();
			}
		}
	}

	public create(ctor: nodes.NodeConstructor): nodes.Node {
		return new ctor(this.token.offset, this.token.len);
	}

	public finish<T extends nodes.Node>(node: T, error?: RcasmIssueType, resyncTokens?: TokenType[], resyncStopTokens?: TokenType[]): T {
		// parseNumeric misuses error for boolean flagging (however the real error mustn't be a false)
		// + nodelist offsets mustn't be modified, because there is a offset hack in rulesets for smartselection
		if (!(node instanceof nodes.Nodelist)) {
			if (error) {
				this.markError(node, error, resyncTokens, resyncStopTokens);
			}
			// set the node end position
			if (this.prevToken) {
				// length with more elements belonging together
				const prevEnd = this.prevToken.offset + this.prevToken.len;
				node.length = prevEnd > node.offset ? prevEnd - node.offset : 0; // offset is taken from current token, end from previous: Use 0 for empty nodes
			}

		}
		return node;
	}

	public markError<T extends nodes.Node>(node: T, error: RcasmIssueType, resyncTokens?: TokenType[], resyncStopTokens?: TokenType[]): void {
		if (this.token !== this.lastErrorToken) { // do not report twice on the same token
			node.addIssue(new nodes.Marker(node, error, nodes.Level.Error, undefined, this.token.offset, this.token.len));
			this.lastErrorToken = this.token;
		}
		if (resyncTokens || resyncStopTokens) {
			this.resync(resyncTokens, resyncStopTokens);
		}
	}

	public parseProgram(textDocument: TextDocument): nodes.Program {
		const versionId = textDocument.version;
		const text = textDocument.getText();
		const textProvider = (offset: number, length: number) => {
			if (textDocument.version !== versionId) {
				throw new Error('Underlying model has changed, AST is no longer valid');
			}
			return text.substr(offset, length);
		};

		return this.internalParse(text, this._parseProgram, textProvider);
	}

	public internalParse<T extends nodes.Node, U extends T | null>(input: string, parseFunc: () => U, textProvider?: nodes.ITextProvider): U;
	public internalParse<T extends nodes.Node, U extends T>(input: string, parseFunc: () => U, textProvider?: nodes.ITextProvider): U {
		this.scanner.setSource(input);
		this.token = this.scanner.scan();
		const node: U = parseFunc.bind(this)();
		if (node) {
			if (textProvider) {
				node.textProvider = textProvider;
			} else {
				node.textProvider = (offset: number, length: number) => { return input.substr(offset, length); };
			}
		}
		return node;
	}

	public _parseProgram(): nodes.Program {
		const node = <nodes.Program>this.create(nodes.Program);

		// Empty doc
		if (this.peek(TokenType.EOF)) {
			return this.finish(node);
		}

		// prog: (line? EOL) +
		do {

			// accept blank lines 
			if (this.accept(TokenType.EOL)) {
				continue;
			}

			// Try for statement
			if (!node.addChild(this._parseCommentOrInstruction())) {

				// Unknown token (expecting an opcode but a label or comment would have done)
				this.consumeToken();
				this.markError(node, ParseError.OpcodeLabelOrCommentExpected);

			}

		} while (!this.peek(TokenType.EOF));

		return this.finish(node);
	}

	public _parseCommentOrInstruction(): nodes.Node | null {
		// line: comment | instruction;
		const node = this._parseComment()
			|| this._parseInstruction();

		// EOL
		if (node && !this.peek(TokenType.EOF) && !this.accept(TokenType.EOL)) {
			this.markError(node, ParseError.EolExpected);
		}

		return node;
	}

	public _parseInstruction(): nodes.Instruction | null {
		if (!this.peek(TokenType.Identifier) && !this.peek(TokenType.Label)) {
			return null;
		}

		const node = <nodes.Instruction>this.create(nodes.Instruction);

		// Pick up label (optional)
		node.setLabel(this._parseLabel());

		// Pick up opcode
		if (!node.setOpcode(this._parseOpcodeAndParams())) {
			// Consume token to try and recover and complete comment and line
			this.markError(node, ParseError.OpcodeExpected);
			this.consumeToken();
		}

		// Pick up comment (optional)
		node.setComment(this._parseComment());

		return this.finish(node);
	}

	public _parseComment(): nodes.Node | null {
		if (!this.peek(TokenType.Comment)) {
			return null;
		}
		const node = <nodes.Comment>this.create(nodes.Comment);
		this.consumeToken();

		return this.finish(node);
	}

	public _parseOpcodeAndParams(): nodes.Opcode | null {
		let node = this._parseOpcode();
		if (!node) {
			return null;
		}

		// Obtain parameters
		switch (node.opcode) {
			case nodes.OpcodeType.ADD:
			case nodes.OpcodeType.INC:
			case nodes.OpcodeType.AND:
			case nodes.OpcodeType.ORR:
			case nodes.OpcodeType.EOR:
			case nodes.OpcodeType.NOT:
			case nodes.OpcodeType.ROL:
			case nodes.OpcodeType.CMP:
				if (!node.setPrimaryParam(this._parseAluRegister())) {
					return this.finish(node, ParseError.RegisterExpected);
				}
				break;
			case nodes.OpcodeType.LDI:
				return this._processLoadImmediate(node);
			case nodes.OpcodeType.MOV:
				return this._processBinaryOpcode(node,
					() => this._parseMoveRegister(), ParseError.RegisterExpected,
					() => this._parseMoveRegister(), ParseError.RegisterExpected);
			case nodes.OpcodeType.CLR:
				return this._processUnaryOpcode(node,
					() => this._parseMoveRegister(), ParseError.RegisterExpected);
			case nodes.OpcodeType.OPC:
				return this._processUnaryOpcode(node,
					() => this._parseOpcodeLiteral(), ParseError.OpcodeLiteralExpected);
			case nodes.OpcodeType.JMP:
			case nodes.OpcodeType.JSR:
			case nodes.OpcodeType.BNE:
			case nodes.OpcodeType.BEQ:
			case nodes.OpcodeType.BLT:
			case nodes.OpcodeType.BLE:
			case nodes.OpcodeType.BMI:
			case nodes.OpcodeType.BCS:
				return this._processUnaryOpcode(node,
					() => this._parseLabelRef(), ParseError.LabelRefExpected);
		}

		return this.finish(node);
	}

	private _processUnaryOpcode(node: nodes.Opcode,
		paramFunc: () => nodes.Node | null, paramMissingError: RcasmIssueType): nodes.Opcode {

		// Try and parse param
		if (!node.setPrimaryParam(paramFunc())) {
			return this.finish(node, paramMissingError);
		}

		// All done
		return this.finish(node);
	}

	private _processBinaryOpcode(node: nodes.Opcode,
		firstParamFunc: () => nodes.Node | null, firstParamMissingError: RcasmIssueType,
		secondParamFunc: () => nodes.Node | null, secondParamMissingError: RcasmIssueType): nodes.Opcode {

		// Try and parse first param
		if (!node.setPrimaryParam(firstParamFunc())) {
			// Try and continue to next param
			this.markError(node, firstParamMissingError);
			if (this.peekIsBeyondOpcode()) {
				return this.finish(node);
			}
			this.consumeToken();
		}

		// Require comma
		if (!this.accept(TokenType.Comma)) {
			// Try and continue to next param
			this.markError(node, ParseError.CommaExpected);
			if (this.peekIsBeyondOpcode()) {
				return this.finish(node);
			}
			this.consumeToken();
		}

		// Try and parse second param
		if (!node.setSecondaryParam(secondParamFunc())) {
			return this.finish(node, secondParamMissingError);
		}

		// All done
		return this.finish(node);
	}

	public _processLoadImmediate(node: nodes.Opcode): nodes.Opcode {

		// Try and parse first param
		let registerNode = this._parseSetRegister();
		if (!node.setPrimaryParam(registerNode)) {
			// Try and continue to next param
			this.markError(node, ParseError.RegisterExpected);
			if (this.peekIsBeyondOpcode()) {
				return this.finish(node);
			}
			this.consumeToken();
		}

		// Which vesion of LDI
		let is16bitLoad = registerNode?.register === nodes.RegisterType.J
			|| registerNode?.register === nodes.RegisterType.M;

		// Require comma
		if (!this.accept(TokenType.Comma)) {
			// Try and continue to next param
			this.markError(node, ParseError.CommaExpected);
			if (this.peekIsBeyondOpcode()) {
				return this.finish(node);
			}
			this.consumeToken();
		}

		// Try and parse second param
		let constNode = is16bitLoad
			? this._parseHexadecimal(0, 0xFFFF) || this._parseLabelRef()
			: this._parseInteger(-16, 15);
		if (!node.setSecondaryParam(constNode)) {
			return this.finish(node, is16bitLoad ? ParseError.ConstantOrLabelExpected : ParseError.IntegerExpected);
		}

		// All done
		return this.finish(node);
	}

	public _parseLabel(): nodes.Label | null {
		if (!this.peek(TokenType.Label)) {
			return null;
		}

		const node = <nodes.Label>this.create(nodes.Label);
		this.consumeToken();
		return this.finish(node);
	}

	public _parseLabelRef(): nodes.Label | null {
		if (!this.peek(TokenType.Identifier)) {
			return null;
		}

		const node = <nodes.Label>this.create(nodes.LabelRef);
		this.consumeToken();
		return this.finish(node);
	}

	public _parseOpcodeLiteral(): nodes.Constant | null {
		return this._parseHexadecimal(0, 0xFF)
			|| this._parseBinary(0, 0xFF);
	}

	public _parseOpcode(): nodes.Opcode | null {
		if (!this.peek(TokenType.Identifier)) {
			return null;
		}

		// Try identifier as opcode
		let opcodeType = <nodes.OpcodeType>staticOpcodeTable[this.token.text.toLowerCase()];
		if (typeof opcodeType === 'undefined') {
			return null;
		}

		// Consume
		const node = <nodes.Opcode>this.create(nodes.Opcode);
		node.opcode = opcodeType;
		this.consumeToken();
		return node;
	}

	public _parseAluRegister(): nodes.Register | null {
		var node = this._parseRegister([
			nodes.RegisterType.A,
			nodes.RegisterType.D
		]);

		// Default to register A if not specified
		if (!node) {
			node = <nodes.Register>this.create(nodes.Register);
			node.register = nodes.RegisterType.A;
		}

		return node;
	}

	public _parseSetRegister(): nodes.Register | null {
		return this._parseRegister([
			nodes.RegisterType.A,
			nodes.RegisterType.B,
			nodes.RegisterType.M,
			nodes.RegisterType.J
		]);
	}

	public _parseMoveRegister(): nodes.Register | null {
		return this._parseRegister([
			nodes.RegisterType.A,
			nodes.RegisterType.B,
			nodes.RegisterType.C,
			nodes.RegisterType.D
		]);
	}

	public _parseRegister(subset?: nodes.RegisterType[]): nodes.Register | null {
		if (!this.peek(TokenType.Identifier)) {
			return null;
		}

		// Try identifier as register
		let registerType = <nodes.RegisterType>staticRegisterTable[this.token.text.toLowerCase()];
		if (typeof registerType === 'undefined') {
			return null;
		}

		const node = <nodes.Register>this.create(nodes.Register);
		node.register = registerType;

		// Verify in range (if required)
		if (subset && !subset.includes(registerType)) {
			this.markError(node, ParseError.RegisterOutOfRange);
		}

		// Consume
		this.consumeToken();
		return this.finish(node);
	}

	public _parseConstant(): nodes.Constant | null {
		return this._parseHexadecimal()
			|| this._parseBinary()
			|| this._parseInteger();
	}

	public _parseHexadecimal(minValue: number = 0, maxValue: number = Number.POSITIVE_INFINITY): nodes.Constant | null {
		if (!this.peek(TokenType.Hexadecimal)) {
			return null;
		}

		const node = <nodes.Constant>this.create(nodes.Constant);

		// try value
		const intVal = parseInt(this.token.text, 16);
		if (isNaN(intVal)) {
			this.markError(node, ParseError.HexadecimalExpected);
		}
		node.value = intVal;

		// test range				
		if (node.value < minValue || node.value > maxValue) {
			this.markError(node, ParseError.ConstantOutOfRange);
		}

		this.consumeToken();
		return this.finish(node);
	}

	public _parseBinary(minValue: number = 0, maxValue: number = Number.POSITIVE_INFINITY): nodes.Constant | null {
		if (!this.peek(TokenType.Binary)) {
			return null;
		}

		const node = <nodes.Constant>this.create(nodes.Constant);

		// try value
		const intVal = parseInt(this.token.text.substring(2), 2);
		if (isNaN(intVal)) {
			this.markError(node, ParseError.BinaryExpected);
		}
		node.value = intVal;

		// test range				
		if (node.value < minValue || node.value > maxValue) {
			this.markError(node, ParseError.ConstantOutOfRange);
		}

		this.consumeToken();
		return this.finish(node);
	}

	public _parseInteger(minValue: number = Number.NEGATIVE_INFINITY, maxValue: number = Number.POSITIVE_INFINITY): nodes.Constant | null {

		if (!this.peek(TokenType.Integer) &&
			!this.peek(TokenType.Plus) &&
			!this.peek(TokenType.Minus)) {
			return null;
		}

		// Accept +/-
		let isNegative: boolean = this.peek(TokenType.Minus);
		if (this.peek(TokenType.Plus) || this.peek(TokenType.Minus)) {
			this.consumeToken();
		}

		// Must be integer next
		if (!this.peek(TokenType.Integer)) {
			return null;
		}

		// try value
		let intVal = parseInt(this.token.text);
		if (isNaN(intVal)) {
			return null;
		}
		intVal = isNegative ? -intVal : intVal;

		const node = <nodes.Constant>this.create(nodes.Constant);
		node.value = intVal;

		// test range				
		if (node.value < minValue || node.value > maxValue) {
			this.markError(node, ParseError.ConstantOutOfRange);
		}

		this.consumeToken();
		return this.finish(node);
	}

}