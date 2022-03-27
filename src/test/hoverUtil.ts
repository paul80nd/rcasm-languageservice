/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from 'assert';
import * as rcasmLanguageService from '../rcasmLanguageService';
import { MarkupContent } from 'vscode-languageserver-types';
import { TextDocument } from 'vscode-languageserver-textdocument';

export function assertHover(value: string, expectedHoverContent: MarkupContent | undefined, expectedHoverOffset: number | undefined): void {
	const offset = value.indexOf('|');
	value = value.substr(0, offset) + value.substr(offset + 1);

	const document = TextDocument.create('test://test/test.rcasm', 'rcasm', 0, value);

	const position = document.positionAt(offset);
	const ls = rcasmLanguageService.getLanguageService();
	const program = ls.parseProgram(document);

	const hover = ls.doHover(document, position, program);
	assert.deepEqual(hover && hover.contents, expectedHoverContent);
	assert.equal(hover && document.offsetAt(hover.range!.start), expectedHoverOffset);
}

