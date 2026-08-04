import { makeObservable } from 'mobx';

import { BaseEditorStore } from 'frontend/store/base/experienceEditor/BaseEditorStore';
import { TradePortalRootStore } from 'frontend/store/tradePortal/TradePortalRootStore';

/** Experience Editor store */
export class TradePortalEditorStore extends BaseEditorStore {
    constructor(public rootStore: TradePortalRootStore) {
        super(rootStore);
        makeObservable(this);
    }
}
