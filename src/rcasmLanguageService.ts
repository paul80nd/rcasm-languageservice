'use strict';

import { Parser } from './parser/rcasmParser';
import { RCASMCompletion } from './services/rcasmCompletion';
import { RCASMHover } from './services/rcasmHover';
import { RCASMNavigation } from './services/rcasmNavigation';
import { RCASMValidation } from './services/rcasmValidation';

import {
	RCASMProgram,
	LanguageSettings, LanguageServiceOptions,
	Diagnostic, Position, CompletionList, Hover, Location, DocumentHighlight,
	SymbolInformation,
	TextDocument
} from './rcasmLanguageTypes';

export type Stylesheet = {};
export * from './rcasmLanguageTypes';

export interface LanguageService {
	doValidation(document: TextDocument, documentSettings?: LanguageSettings): Diagnostic[];
	parseProgram(document: TextDocument): RCASMProgram;
	doComplete(document: TextDocument, position: Position, program: RCASMProgram): CompletionList;
	doHover(document: TextDocument, position: Position, program: RCASMProgram): Hover | null;
	findDefinition(document: TextDocument, position: Position, program: RCASMProgram): Location | null;
	findReferences(document: TextDocument, position: Position, program: RCASMProgram): Location[];
	findDocumentHighlights(document: TextDocument, position: Position, program: RCASMProgram): DocumentHighlight[];
	findDocumentSymbols(document: TextDocument, program: RCASMProgram): SymbolInformation[];
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
		findDefinition: rcasmNavigation.findDefinition.bind(rcasmNavigation),
		findReferences: rcasmNavigation.findReferences.bind(rcasmNavigation),
		findDocumentHighlights: rcasmNavigation.findDocumentHighlights.bind(rcasmNavigation),
		findDocumentSymbols: rcasmNavigation.findDocumentSymbols.bind(rcasmNavigation),
	};
}
