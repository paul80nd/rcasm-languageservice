import { Parser } from './parser/rcasmParser';
import { RCASMValidation } from './services/rcasmValidation';
import { RCASMCompletion } from './services/rcasmCompletion';
import { RCASMHover } from './services/rcasmHover';
import { RCASMNavigation } from './services/rcasmNavigation';
import { Diagnostic, Position, CompletionList, Hover, SymbolInformation, DocumentHighlight } from 'vscode-languageserver-types';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { Program, LanguageSettings, LanguageServiceOptions } from './rcasmLanguageTypes';

export * from './rcasmLanguageTypes';

export interface LanguageService {
	doValidation(document: TextDocument, program: Program, documentSettings?: LanguageSettings): Diagnostic[];
	parseProgram(document: TextDocument): Program;
	findDocumentHighlights(document: TextDocument, position: Position, program: Program): DocumentHighlight[];
	doComplete(document: TextDocument, position: Position, program: Program): CompletionList;
	doHover(document: TextDocument, position: Position, program: Program): Hover | null;
	findDocumentSymbols(document: TextDocument, program: Program): SymbolInformation[];
}

export function getLanguageService(options?: LanguageServiceOptions): LanguageService {
	const rcasmParser = new Parser();
	const rcasmHover = new RCASMHover(options && options.clientCapabilities);
	const rcasmCompletion = new RCASMCompletion(options && options.clientCapabilities);
	const rcasmNavigation = new RCASMNavigation();
	const rcasmValidation = new RCASMValidation();

	return {
		doValidation: rcasmValidation.doValidation.bind(rcasmValidation),
		parseProgram: rcasmParser.parseProgram.bind(rcasmParser),
		doComplete: rcasmCompletion.doComplete.bind(rcasmCompletion),
		doHover: rcasmHover.doHover.bind(rcasmHover),
		findDocumentHighlights: rcasmNavigation.findDocumentHighlights.bind(rcasmNavigation),
		findDocumentSymbols: rcasmNavigation.findDocumentSymbols.bind(rcasmNavigation),
	};
}
