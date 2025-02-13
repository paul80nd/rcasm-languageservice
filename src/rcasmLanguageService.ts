'use strict';

import { RCASMParser } from './parser/rcasmParser';
import { RCASMCompletion } from './services/rcasmCompletion';
import { RCASMHover } from './services/rcasmHover';
import { RCASMNavigation } from './services/rcasmNavigation';
import { RCASMValidation } from './services/rcasmValidation';
import { getFoldingRanges } from './services/rcasmFolding';

import {
	RCASMProgram,
	LanguageSettings, LanguageServiceOptions,
	Diagnostic, DocumentSymbol, Position, CompletionList, Hover, Location, DocumentHighlight,
	SymbolInformation, Range, WorkspaceEdit, TextDocument,
	FoldingRange,
	IRCASMDataProvider
} from './rcasmLanguageTypes';
import { RCASMDataManager } from './languageFacts/dataManager';

export * from './rcasmLanguageTypes';

export interface LanguageService {
	configure(raw?: LanguageSettings): void;
	setDataProviders(useDefaultDataProvider: boolean, customDataProviders: IRCASMDataProvider[]): void;	
	doValidation(document: TextDocument, documentSettings?: LanguageSettings): Diagnostic[];
	parseProgram(document: TextDocument): RCASMProgram;
	doComplete(document: TextDocument, position: Position, program: RCASMProgram): CompletionList;
	doHover(document: TextDocument, position: Position, program: RCASMProgram): Hover | null;
	findDefinition(document: TextDocument, position: Position, program: RCASMProgram): Location | null;
	findReferences(document: TextDocument, position: Position, program: RCASMProgram): Location[];
	findDocumentHighlights(document: TextDocument, position: Position, program: RCASMProgram): DocumentHighlight[];
	findDocumentSymbols(document: TextDocument, program: RCASMProgram): SymbolInformation[];
	findDocumentSymbols2(document: TextDocument, program: RCASMProgram): DocumentSymbol[];
	prepareRename(document: TextDocument, position: Position, program: RCASMProgram): Range | undefined;
	doRename(document: TextDocument, position: Position, newName: string, program: RCASMProgram): WorkspaceEdit;
	getFoldingRanges(document: TextDocument, program: RCASMProgram, context?: { rangeLimit?: number; }): FoldingRange[];
}

function createFacade(parser: RCASMParser, completion: RCASMCompletion, hover: RCASMHover, navigation: RCASMNavigation, validation: RCASMValidation, rcasmDataManager: RCASMDataManager): LanguageService {
	return {
		configure: (settings) => {
			validation.configure(settings);
		},
		setDataProviders: rcasmDataManager.setDataProviders.bind(rcasmDataManager),
		doValidation: validation.doValidation.bind(validation),
		parseProgram: parser.parseProgram.bind(parser),
		doComplete: completion.doComplete.bind(completion),
		doHover: hover.doHover.bind(hover),
		findDefinition: navigation.findDefinition.bind(navigation),
		findReferences: navigation.findReferences.bind(navigation),
		findDocumentHighlights: navigation.findDocumentHighlights.bind(navigation),
		findDocumentSymbols: navigation.findSymbolInformations.bind(navigation),
		findDocumentSymbols2: navigation.findDocumentSymbols.bind(navigation),
		prepareRename: navigation.prepareRename.bind(navigation),
		doRename: navigation.doRename.bind(navigation),
		getFoldingRanges
	};
}

const defaultLanguageServiceOptions = {};

export function getLanguageService(options: LanguageServiceOptions = defaultLanguageServiceOptions): LanguageService {
	const rcasmDataManager = new RCASMDataManager(options);
	return createFacade(
		new RCASMParser(),
		new RCASMCompletion(options && options.clientCapabilities, rcasmDataManager),
		new RCASMHover(options && options.clientCapabilities, rcasmDataManager),
		new RCASMNavigation(),
		new RCASMValidation(),
		rcasmDataManager
	);
}
