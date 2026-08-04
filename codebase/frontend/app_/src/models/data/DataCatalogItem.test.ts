import { DataStatus } from 'models/enum/DataStatus';

import { DataCatalogItem } from './DataCatalogItem';

describe('DataCatalogItem', () => {
    it('Should call fetch data action and status should be loaded', async () => {
        const getDataService = jest.fn().mockResolvedValueOnce(true);
        const dataCatalogItem = new DataCatalogItem([], getDataService);

        const fetchDataSpy = jest.spyOn(dataCatalogItem, 'fetchData');

        await dataCatalogItem.fetchData();
        expect(fetchDataSpy).toHaveBeenCalled();
        expect(dataCatalogItem.status).toEqual(DataStatus.Loaded);
        expect(getDataService).toHaveBeenCalled();
    });

    it('Should fail if fetch failed', async () => {
        const getDataService = jest.fn().mockRejectedValueOnce(new Error());
        const dataCatalogItem = new DataCatalogItem([], getDataService);

        await dataCatalogItem.fetchData();

        expect(getDataService).toHaveBeenCalled();
        expect(dataCatalogItem.status).toEqual(DataStatus.Error);
    });

    it('Should not return data from getDataService if status is loading', async () => {
        const getDataService = jest.fn().mockResolvedValueOnce(true);
        const dataCatalogItem = new DataCatalogItem([], getDataService);

        const fetchDataSpy = jest.spyOn(dataCatalogItem, 'fetchData');

        dataCatalogItem.status = DataStatus.Loading;
        await dataCatalogItem.fetchData();

        expect(fetchDataSpy).toHaveBeenCalled();
        expect(getDataService).not.toHaveBeenCalled();
    });

    it('Should not return data from getDataService if status is loaded', async () => {
        const getDataService = jest.fn().mockResolvedValueOnce(true);
        const dataCatalogItem = new DataCatalogItem([], getDataService);

        const fetchDataSpy = jest.spyOn(dataCatalogItem, 'fetchData');

        dataCatalogItem.status = DataStatus.Loaded;
        await dataCatalogItem.fetchData();

        expect(fetchDataSpy).toHaveBeenCalled();
        expect(getDataService).not.toHaveBeenCalled();
    });
});
