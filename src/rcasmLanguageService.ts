import { Parser } from './parser/rcasmParser';
import { RCASMCompletion } from './services/rcasmCompletion';
import { RCASMHover } from './services/rcasmHover';
import { Position, CompletionList, Hover } from 'vscode-languageserver-types';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { Program, LanguageServiceOptions } from './rcasmLanguageTypes';

export * from './rcasmLanguageTypes';

export interface LanguageService {
	parseProgram(document: TextDocument): Program;
	doComplete(document: TextDocument, position: Position, program: Program): CompletionList;
	doHover(document: TextDocument, position: Position, program: Program): Hover | null;
}

export function getLanguageService(options?: LanguageServiceOptions): LanguageService {
	const rcasmParser = new Parser();
	const rcasmHover = new RCASMHover(options && options.clientCapabilities);
	const rcasmCompletion = new RCASMCompletion(options && options.clientCapabilities);

	return {
		parseProgram: rcasmParser.parseProgram.bind(rcasmParser),
		doComplete: rcasmCompletion.doComplete.bind(rcasmCompletion),
		doHover: rcasmHover.doHover.bind(rcasmHover),
	};
}
