'use strict';

import * as nodes from '../parser/rcasmNodes';
import { LanguageSettings } from '../rcasmLanguageTypes';
import { TextDocument, Range, Diagnostic, DiagnosticSeverity } from 'vscode-languageserver-types';

export class RCASMValidation {

	private settings?: LanguageSettings;

	constructor() {
	}

	public configure(settings?: LanguageSettings) {
		this.settings = settings;
	}

	public doValidation(document: TextDocument, program: nodes.Program, settings: LanguageSettings | undefined = this.settings): Diagnostic[] {
		if (settings && settings.validate === false) {
			return [];
		}

		const entries: nodes.IMarker[] = [];
		entries.push.apply(entries, nodes.ParseErrorCollector.entries(program));

		function toDiagnostic(marker: nodes.IMarker): Diagnostic {
			const range = Range.create(document.positionAt(marker.getOffset()), document.positionAt(marker.getOffset() + marker.getLength()));
			const source = document.languageId;

			return <Diagnostic>{
				code: marker.getRule().id,
				source: source,
				message: marker.getMessage(),
				severity: marker.getLevel() === nodes.Level.Warning ? DiagnosticSeverity.Warning : DiagnosticSeverity.Error,
				range: range
			};
		}

		return entries.filter(entry => entry.getLevel() !== nodes.Level.Ignore).map(toDiagnostic);
	}
}