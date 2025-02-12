'use strict';

import {
	Range, Position, MarkupContent, MarkupKind,
	Diagnostic, DiagnosticSeverity,
	Command, CompletionList, CompletionItemKind,
	InsertTextFormat, Location, Hover, MarkedString,
	SymbolInformation, SymbolKind,
	DocumentHighlight, DocumentHighlightKind, DocumentSymbol,
	TextEdit,
	WorkspaceEdit
} from 'vscode-languageserver-types';

import { TextDocument } from 'vscode-languageserver-textdocument';

export {
	TextDocument,
	Range, Position, MarkupContent, MarkupKind,
	Diagnostic, DiagnosticSeverity,
	Command, CompletionList, CompletionItemKind,
	InsertTextFormat, Location, Hover, MarkedString,
	SymbolInformation, SymbolKind,
	DocumentHighlight, DocumentHighlightKind, DocumentSymbol,
	TextEdit,
	WorkspaceEdit
};

export interface LanguageSettings {
	validate?: boolean;
}

export declare type RCASMProgram = {

};

/**
 * Describes what LSP capabilities the client supports
 */
export interface ClientCapabilities {
	/**
	 * The text document client capabilities
	 */
	textDocument?: {
		/**
		 * Capabilities specific to completions.
		 */
		completion?: {
			/**
			 * The client supports the following `CompletionItem` specific
			 * capabilities.
			 */
			completionItem?: {
				/**
				 * Client supports the follow content formats for the documentation
				 * property. The order describes the preferred format of the client.
				 */
				documentationFormat?: MarkupKind[];
			};

		};
		/**
		 * Capabilities specific to hovers.
		 */
		hover?: {
			/**
			 * Client supports the follow content formats for the content
			 * property. The order describes the preferred format of the client.
			 */
			contentFormat?: MarkupKind[];
		};
	};
}

export namespace ClientCapabilities {
	export const LATEST: ClientCapabilities = {
		textDocument: {
			completion: {
				completionItem: {
					documentationFormat: [MarkupKind.Markdown, MarkupKind.PlainText]
				}
			},
			hover: {
				contentFormat: [MarkupKind.Markdown, MarkupKind.PlainText]
			}
		}
	};
}

export interface LanguageServiceOptions {
	/**
	 * Unless set to false, the default RCASM data provider will be used
	 * along with the providers from customDataProviders.
	 * Defaults to true.
	 */
	useDefaultDataProvider?: boolean;

	/**
	 * Provide data that could enhance the service's understanding of
	 * RCASM mnemonic / directives
	 */
	customDataProviders?: IRCASMDataProvider[];

	/**
	 * Describes the LSP capabilities the client supports.
	 */
	clientCapabilities?: ClientCapabilities;
}

export interface IMnemonicData {
	name: string;
	class: string | undefined;
	summary: string;
	snippet?: string;
	description?: string | MarkupContent;
	synopsis?: string | MarkupContent;
	syntax?: string;
}

export interface IDirectiveData {
	name: string;
	summary: string;
	snippet?: string;
	description?: string | MarkupContent;
	syntax?: string;
}

export interface RCASMDataV1 {
	version: 1;
	mnemonics?: IMnemonicData[];
	directives?: IDirectiveData[];
}

export interface IRCASMDataProvider {
	provideMnemonics(): IMnemonicData[];
	provideDirectives(): IDirectiveData[];
}