'use strict';

import {
	Range, Position, MarkupContent, MarkupKind,
	Diagnostic, DiagnosticSeverity,
	CompletionList,
	InsertTextFormat,
	SymbolInformation, SymbolKind, Location, Hover, MarkedString,
	DocumentHighlight,
	DocumentHighlightKind
} from 'vscode-languageserver-types';

import { TextDocument } from 'vscode-languageserver-textdocument';

export {
	TextDocument,
	Range, Position, MarkupContent, MarkupKind,
	Diagnostic, DiagnosticSeverity,
	CompletionList,
	InsertTextFormat,
	SymbolInformation, SymbolKind, Location, Hover, MarkedString,
	DocumentHighlight,
	DocumentHighlightKind
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

export interface RCASMDataV1 {
	version: 1;
	mnemonics?: IMnemonicData[];
}

export interface IRCASMDataProvider {
	provideMnemonics(): IMnemonicData[];
}