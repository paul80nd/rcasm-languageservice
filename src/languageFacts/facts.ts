'use strict';

import * as customData from './data/customData';
import { RCASMDataManager } from './dataManager';
import { RCASMDataProvider } from './dataProvider';

export * from './entry';

export const rcasmDataManager = new RCASMDataManager([
	new RCASMDataProvider(customData.rcasmData)
]);