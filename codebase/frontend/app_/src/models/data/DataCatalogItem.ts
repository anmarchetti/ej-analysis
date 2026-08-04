import { action, makeObservable, observable, runInAction, when } from 'mobx';

import { DataStatus } from 'models/enum/DataStatus';

export class DataCatalogItem<T> {
    @observable data: T;
    @observable status: DataStatus = DataStatus.NotLoaded;
    getDataService: () => Promise<T>;

    constructor(data: T, getDataService: () => Promise<T>) {
        makeObservable(this);

        this.data = data;
        this.getDataService = getDataService;
    }

    @action fetchData = async (): Promise<void> => {
        try {
            if (this.status === DataStatus.Loading) {
                await when(() => this.status === DataStatus.Loading);

                return;
            }

            if (this.status === DataStatus.Loaded) {
                return;
            }

            this.status = DataStatus.Loading;
            const data = await this.getDataService();
            runInAction(() => {
                this.data = data;
                this.status = DataStatus.Loaded;
            });
        } catch (e) {
            runInAction(() => {
                this.status = DataStatus.Error;
            });
        }
    };
}
