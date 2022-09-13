'use strict';

import * as rcasm from '@paul80nd/rcasm';
import * as nodes from './rcasmNodes';
import { TextDocument } from '../rcasmLanguageTypes';

/// <summary>
/// A parser for rcasm (wraps rcasm parser).
/// </summary>
export class RCASMParser {

	public parseProgram(textDocument: TextDocument): nodes.Program {
		const versionId = textDocument.version;
		const text = textDocument.getText();

		const program = rcasm.parseOnly(textDocument.getText());
		const root = new nodes.Program(program);

		const textProvider = (offset: number, length: number) => {
			if (textDocument.version !== versionId) {
				throw new Error('Underlying model has changed, AST is no longer valid');
			}
			return text.substr(offset, length);
		};
		root.textProvider = textProvider;

		return root;
	}

}