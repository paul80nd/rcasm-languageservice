import { MarkupContent } from 'vscode-languageserver-types';

export * from 'vscode-languageserver-types';

export enum TokenType {
	Binary,
	Comma,
	Comment,
	Hexadecimal,
	Identifier,
	Integer,
	Label,
	Minus,
	Plus,
	EOL,
	EOF,
	InvalidChar
}

export interface IMnemonicData {
	name: string;
	summary: string;
	snippet?: string;
	description?: string | MarkupContent;
	synopsis?: string | MarkupContent;
	syntax?: string;
}

export interface RCASMDataV1 {
	version: 1;
	mnemonics?: IMnemonicData[];
}

export interface IRCASMDataProvider {
	provideMnemonics(): IMnemonicData[];
}
