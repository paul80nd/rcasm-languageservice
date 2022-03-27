import { Parser } from './parser/rcasmParser';
import { RCASMCompletion } from './services/rcasmCompletion';
import { Position, CompletionList } from 'vscode-languageserver-types';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { Program, LanguageServiceOptions } from './rcasmLanguageTypes';

export * from './rcasmLanguageTypes';

export interface LanguageService {
	parseProgram(document: TextDocument): Program;
	doComplete(document: TextDocument, position: Position, program: Program): CompletionList;
}

export function getLanguageService(options?: LanguageServiceOptions): LanguageService {
	const rcasmParser = new Parser();
	const rcasmCompletion = new RCASMCompletion(options && options.clientCapabilities);

	return {
		parseProgram: rcasmParser.parseProgram.bind(rcasmParser),
		doComplete: rcasmCompletion.doComplete.bind(rcasmCompletion),
	};
}
