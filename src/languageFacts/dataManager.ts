'use strict';

import { IMnemonicData, IRCASMDataProvider, RCASMDataV1 } from '../rcasmLanguageTypes';

import * as objects from '../utils/objects';

export class RCASMDataManager {

	private _mnemonicSet: { [k: string]: IMnemonicData } = {};

	private _mnemonics: IMnemonicData[] = [];

	constructor(private dataProviders: IRCASMDataProvider[]) {
		this.collectData();
	}

	private collectData() {
		this.dataProviders.forEach(provider => {
			provider.provideMnemonics().forEach(p => {
				if (!this._mnemonicSet[p.name]) {
					this._mnemonicSet[p.name] = p;
				}
			});
		});

		this._mnemonics = objects.values(this._mnemonicSet);
	}

	getMnemonic(name: string) { return this._mnemonicSet[name]; }

	getMnemonics() {
		return this._mnemonics;
	}

}