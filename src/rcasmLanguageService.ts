'use strict';

import { RCASMParser } from './parser/rcasmParser';
import { RCASMCompletion } from './services/rcasmCompletion';
import { RCASMHover } from './services/rcasmHover';
import { RCASMNavigation } from './services/rcasmNavigation';
import { RCASMValidation } from './services/rcasmValidation';

import {
	RCASMProgram,
	LanguageSettings, LanguageServiceOptions,
	Diagnostic, DocumentSymbol, Position, CompletionList, Hover, Location, DocumentHighlight,
	SymbolInformation,
	TextDocument
} from './rcasmLanguageTypes';

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
	findDocumentSymbols2(document: TextDocument, program: RCASMProgram): DocumentSymbol[];
}

export function getLanguageService(options?: LanguageServiceOptions): LanguageService {
	const parser = new RCASMParser();
	const hover = new RCASMHover(options && options.clientCapabilities);
	const completion = new RCASMCompletion(options && options.clientCapabilities);
	const navigation = new RCASMNavigation();
	const validation = new RCASMValidation();

	return {
		doValidation: validation.doValidation.bind(validation),
		parseProgram: parser.parseProgram.bind(parser),
		doComplete: completion.doComplete.bind(completion),
		doHover: hover.doHover.bind(hover),
		findDefinition: navigation.findDefinition.bind(navigation),
		findReferences: navigation.findReferences.bind(navigation),
		findDocumentHighlights: navigation.findDocumentHighlights.bind(navigation),
		findDocumentSymbols: navigation.findSymbolInformations.bind(navigation),
		findDocumentSymbols2: navigation.findDocumentSymbols.bind(navigation),
	};
}
