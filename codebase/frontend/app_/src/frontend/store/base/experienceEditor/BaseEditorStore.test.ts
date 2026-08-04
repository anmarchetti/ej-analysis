import sitecoreService from 'frontend/services/sitecore.service';
import SitecoreTemplateId from 'models/enum/SitecoreTemplateId';

import { BaseEditorStore } from './BaseEditorStore';
jest.mock('frontend/services/sitecore.service');

const rootStore = {
    layoutStore: {
        siteTemplatesIds: SitecoreTemplateId,
        layoutId: 'layoutId',
        lang: 'ch-fr',
    },
};

describe('BaseEditorStore', () => {
    beforeEach(() => {
        jest.resetModules();
    });

    window.alert = jest.fn();

    it('should call addItem with layoutId when no Rooms folder', async () => {
        const store = new BaseEditorStore(rootStore as any);
        await store.addRoom(null);

        expect(sitecoreService.getItemDetails).toBeCalledWith(
            rootStore.layoutStore.layoutId,
            'ItemPath',
            rootStore.layoutStore.lang,
        );
    });

    it('should call addItem with layoutId when no Boards folder', async () => {
        const store = new BaseEditorStore(rootStore as any);
        await store.addBoard(null);

        expect(sitecoreService.getItemDetails).toBeCalledWith(
            rootStore.layoutStore.layoutId,
            'ItemPath',
            rootStore.layoutStore.lang,
        );
    });
});
