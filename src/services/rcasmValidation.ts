'use strict';

import * as rcasm from '@paul80nd/rcasm';
import { TextDocument, Diagnostic, DiagnosticSeverity, LanguageSettings } from '../rcasmLanguageTypes';

export class RCASMValidation {

	private settings?: LanguageSettings;

	constructor() {
	}

	public configure(settings?: LanguageSettings) {
		this.settings = settings;
	}

	public doValidation(document: TextDocument, settings: LanguageSettings | undefined = this.settings): Diagnostic[] {
		if (settings && settings.validate === false) {
			return [];
		}

		const { errors, warnings } = rcasm.assemble(document.getText());

		let toDiagnostic = (e: rcasm.Diagnostic, s: DiagnosticSeverity): Diagnostic => {
			return <Diagnostic>{
				severity: s,
				range: {
					start: document!.positionAt(e.loc.start.offset),
					end: document!.positionAt(e.loc.end.offset)
				},
				message: e.msg,
				source: document.languageId
			};
		};

		const entries: Diagnostic[] = [];
		entries.push(...errors.map(e => toDiagnostic(e, DiagnosticSeverity.Error)));
		entries.push(...warnings.map(e => toDiagnostic(e, DiagnosticSeverity.Warning)));

		return entries;
	}
}