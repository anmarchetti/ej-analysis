import { ISearchPodDataFields } from 'frontend/components/renderings/SearchPod/models';

export class SearchPodStore {
    private _fields: ISearchPodDataFields | undefined;

    constructor(fields: ISearchPodDataFields | undefined) {
        this.setFields(fields);
    }

    get fields(): ISearchPodDataFields | undefined {
        return this._fields;
    }

    setFields = (fields: ISearchPodDataFields | undefined): void => {
        this._fields = fields;
    };

    get isSearchPodInitialized(): boolean {
        return !!this.fields;
    }
}
