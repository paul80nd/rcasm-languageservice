import { MarkupContent, MarkupKind } from 'vscode-languageserver-types';

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

export type Program = {

};

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