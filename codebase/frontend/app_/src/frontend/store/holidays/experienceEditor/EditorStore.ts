import { makeObservable } from 'mobx';

import { BaseEditorStore } from 'frontend/store/base/experienceEditor/BaseEditorStore';
import { HolidaysRootStore } from 'frontend/store/holidays/HolidaysRootStore';

/** Experience Editor store */
export class EditorStore extends BaseEditorStore {
    constructor(public rootStore: HolidaysRootStore) {
        super(rootStore);
        makeObservable(this);
    }
}
