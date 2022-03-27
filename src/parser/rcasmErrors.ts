'use strict';

import * as nodes from './rcasmNodes';

import * as nls from 'vscode-nls';
const localize = nls.loadMessageBundle();

export class RcasmIssueType implements nodes.IRule {
	id: string;
	message: string;

	public constructor(id: string, message: string) {
		this.id = id;
		this.message = message;
	}
}

export const ParseError = {
	BinaryExpected: new RcasmIssueType('rcasm-binaryexpected', localize('expected.binary', "binary expected")),
	ConstantExpected: new RcasmIssueType('rcasm-constantexpected', localize('expected.constant', "constant expected")),
	ConstantOrLabelExpected: new RcasmIssueType('rcasm-constantorlabelexpected', localize('expected.constantorlabel', "constant or label expected")),
	CommaExpected: new RcasmIssueType('rcasm-commaexpected', localize('expected.comma', "comma expected")),
	EolExpected: new RcasmIssueType('rcasm-eolexpected', localize('expected.eol', "end of line expected")),	
	HexadecimalExpected: new RcasmIssueType('rcasm-hexadecimalexpected', localize('expected.hexadecimal', "hexadecimal expected")),
	IntegerExpected: new RcasmIssueType('rcasm-integerexpected', localize('expected.integer', "integer expected")),
	LabelRefExpected: new RcasmIssueType('rcasm-labelrefexpected', localize('expected.labelref', "label reference expected")),
	RegisterExpected: new RcasmIssueType('rcasm-registerexpected', localize('expected.register', "register expected")),
	OpcodeExpected: new RcasmIssueType('rcasm-opcodeexpected', localize('expected.opcode', "opcode expected")),
	OpcodeLiteralExpected: new RcasmIssueType('rcasm-opcodeliteralexpected', localize('expected.opcodeliteral', "opcode literal expected")),
	OpcodeLabelOrCommentExpected: new RcasmIssueType('rcasm-opcodelabelorcommentexpected', localize('expected.opcodelabelorcomment', "opcode, label or comment expected")),
	ConstantOutOfRange: new RcasmIssueType('rcasm-constantoutofrange', localize('outofrange.constant', "constant out of range")),	
	RegisterOutOfRange: new RcasmIssueType('rcasm-registeroutofrange', localize('outofrange.register', "register out of range")),	
};