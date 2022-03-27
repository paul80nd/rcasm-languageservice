'use strict';

import { IMnemonicData, IRCASMDataProvider, RCASMDataV1 } from '../rcasmLanguageTypes';

export class RCASMDataProvider implements IRCASMDataProvider {

	private _mnemonics: IMnemonicData[] = [];

	constructor(data: RCASMDataV1) {
		this.addData(data);
	}

	provideMnemonics() {
		return this._mnemonics;
	}

	private addData(data: RCASMDataV1) {
		if (data.mnemonics) {
			this._mnemonics = this._mnemonics.concat(data.mnemonics);
		}
	}

}
