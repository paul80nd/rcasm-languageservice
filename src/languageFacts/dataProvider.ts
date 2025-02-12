'use strict';

import { IMnemonicData, IDirectiveData, IRCASMDataProvider, RCASMDataV1 } from '../rcasmLanguageTypes';

export class RCASMDataProvider implements IRCASMDataProvider {

	private _mnemonics: IMnemonicData[] = [];
	private _directives: IDirectiveData[] = [];

	constructor(data: RCASMDataV1) {
		this.addData(data);
	}

	provideMnemonics() {
		return this._mnemonics;
	}
	provideDirectives() {
		return this._directives;
	}

	private addData(data: RCASMDataV1) {
		if (data.mnemonics) {
			this._mnemonics = this._mnemonics.concat(data.mnemonics);
		}
		if (Array.isArray(data.mnemonics)) {
			for (const prop of data.mnemonics) {
				if (isMnemonicData(prop)) {
					this._mnemonics.push(prop);
				}
			}
		}
		if (Array.isArray(data.directives)) {
			for (const prop of data.directives) {
				if (isDirectiveData(prop)) {
					this._directives.push(prop);
				}
			}
		}
	}
}

function isMnemonicData(d: any): d is IMnemonicData {
	return typeof d.name === 'string';
}
function isDirectiveData(d: any): d is IDirectiveData {
	return typeof d.name === 'string';
}