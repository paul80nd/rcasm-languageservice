'use strict';

import { IMnemonicData, IDirectiveData, IRCASMDataProvider } from '../rcasmLanguageTypes';

import * as objects from '../utils/objects';
import { rcasmData } from './data/customData';
import { RCASMDataProvider } from './dataProvider';

export class RCASMDataManager {
	private dataProviders: IRCASMDataProvider[] = [];

	private _mnemonicSet: { [k: string]: IMnemonicData } = {};
	private _directiveSet: { [k: string]: IDirectiveData } = {};

	private _mnemonics: IMnemonicData[] = [];
	private _directives: IDirectiveData[] = [];

	constructor(options?: { useDefaultDataProvider?: boolean, customDataProviders?: IRCASMDataProvider[] }) {
		this.setDataProviders(options?.useDefaultDataProvider !== false, options?.customDataProviders || []);
	}

	setDataProviders(builtIn: boolean, providers: IRCASMDataProvider[]) {
		this.dataProviders = [];
		if (builtIn) {
			this.dataProviders.push(new RCASMDataProvider(rcasmData));
		}
		this.dataProviders.push(...providers);
		this.collectData();
	}

	private collectData() {
		this._mnemonicSet = {};
		this._directiveSet = {};

		this.dataProviders.forEach(provider => {
			provider.provideMnemonics().forEach(p => {
				if (!this._mnemonicSet[p.name]) {
					this._mnemonicSet[p.name] = p;
				}
			});
			provider.provideDirectives().forEach(p => {
				if (!this._directiveSet[p.name]) {
					this._directiveSet[p.name] = p;
				}
			});
		});

		this._mnemonics = objects.values(this._mnemonicSet);
		this._directives = objects.values(this._directiveSet);
	}

	getMnemonic(name: string): IMnemonicData | undefined { return this._mnemonicSet[name]; }
	getDirective(name: string): IDirectiveData | undefined { return this._directiveSet[name]; }

	getMnemonics() : IMnemonicData[] {
		return this._mnemonics;
	}
	getDirectives(): IDirectiveData[] {
		return this._directives;
	}

}