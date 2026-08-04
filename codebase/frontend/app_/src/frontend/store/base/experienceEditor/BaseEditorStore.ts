import { Guid } from 'guid-typescript';
import { action, makeObservable, observable } from 'mobx';

import sitecoreService from 'frontend/services/sitecore.service';
import { TRootStore } from 'frontend/store/IStores';
import { getImageByField, getItemIdFromResponse } from 'frontend/utils/expEditor.utils';
import { IRoomFacility } from 'models/data/IHotel';
import { ISortItems } from 'models/data/sort/ISortItems';

/** Experience Editor store */
export class BaseEditorStore {
    /** item Id to show inside SitecorePopup */
    @observable activeItemId: string | null = null;
    private closeCallback?: (itemId: string | null) => void;

    constructor(public rootStore: TRootStore) {
        makeObservable(this);
    }

    @action onCloseSitecorePopup = async (): Promise<void> => {
        this.closeCallback?.(this.activeItemId);
        this.activeItemId = null;
    };

    /**
     * this function will open SitecorePopup to edit item inside Sitecore
     * @param onPopupCloseCallback callback to be called after SitecorePopup closed
     */
    @action showItem = (itemId: string, onPopupCloseCallback?: (itemId: string | null) => void) => {
        this.closeCallback = onPopupCloseCallback || (() => {});
        this.activeItemId = itemId;
    };

    /**
     * Add sitecore item
     */
    addSitecoreItem = async (
        parentId: string,
        templateID: string,
        itemName: string = Guid.create().toString(),
        shouldBeLast = true,
    ) => {
        if (!parentId || !templateID) {
            return undefined;
        }

        try {
            // eslint-disable-next-line prefer-const
            let [{ data: parentInfo }, { data: childrenInfo }] = await Promise.all([
                // get detials of parent so we know in what folder create a child
                sitecoreService.getItemDetails(parentId, 'ItemPath', this.rootStore.layoutStore.lang),
                // get all sort orders of child items, so we know what sort order to set to new item
                sitecoreService.getItemChildren(parentId, 'ItemId,__Sortorder', true, this.rootStore.layoutStore.lang),
            ]);

            if (!parentInfo.ItemPath) {
                throw new Error();
            }

            if (!childrenInfo?.length) {
                childrenInfo = [{ __Sortorder: 0 }];
            }

            const itemBody: { [key: string]: string } = {
                ItemName: itemName,
                TemplateID: templateID,
            };

            // apply the biggest sort order so new item appears last
            if (shouldBeLast) {
                let sortOrder = Math.max(...childrenInfo.map(c => +c.__Sortorder)) + 1;

                // apply sort order to items if there is no sort order
                if (childrenInfo.some(c => c.__Sortorder === '')) {
                    try {
                        await this.sortItems(childrenInfo.map(c => c.ItemID));
                    } finally {
                        sortOrder = childrenInfo.length;
                    }
                }

                itemBody.__Sortorder = sortOrder + '';
            }

            return await sitecoreService.createItem(parentInfo.ItemPath, itemBody, this.rootStore.layoutStore.lang);
        } catch (e) {
            alert('Something went wrong on creating item');

            return undefined;
        }
    };

    updateItem = async (itemId: string, onPopupCloseCallback?: (itemId: string | null) => void) => {
        try {
            itemId && this.showItem(itemId, onPopupCloseCallback);
        } catch (e) {
            alert('Something went wrong on updating item');
            throw e;
        }
    };

    deleteItem = async (itemId: string) => {
        if (!itemId) {
            return;
        }

        try {
            await sitecoreService.deleteItem(itemId, this.rootStore.layoutStore.lang);

            return;
        } catch (e) {
            alert('Something went wrong on deleting item');
            throw e;
        }
    };

    deleteItems = async (itemIds: string[]) => {
        if (!itemIds) {
            return;
        }

        try {
            await sitecoreService.deleteItems(itemIds, this.rootStore.layoutStore.lang);

            return;
        } catch (e) {
            alert('Something went wrong on deleting item');
            throw e;
        }
    };

    sortItems = async (itemIds: string[]) => {
        try {
            const sortDict: ISortItems = {
                itemIds,
                sortOrders: itemIds.map((_id, i) => String(i)),
            };
            await sitecoreService.sortItems(sortDict, this.rootStore.layoutStore.lang);

            return;
        } catch (e) {
            alert('Something went wrong on sorting items');
        }
    };

    /**
     * Updates DisplayName for item
     * @param itemId
     * @param name
     */
    setItemDisplayName = (itemId: string, name: string): void => {
        try {
            sitecoreService.editItem(
                itemId,
                {
                    ItemName: name.replace(/[^a-zA-Z0-9 ]/g, '').trim(),
                },
                this.rootStore.layoutStore.lang,
            );

            return;
        } catch (e) {
            alert('Something went wrong on updating display name');
        }
    };

    /** Get image object by image item id */
    getImageByItemId = async (itemId: string) => {
        try {
            const { data: imageInfo } = await sitecoreService.getItemDetails(
                itemId,
                'Image',
                this.rootStore.layoutStore.lang,
            );

            return getImageByField(imageInfo.Image, itemId);
        } catch (e) {
            return null;
        }
    };

    /**
     * Creates Item
     * @param parentId
     * @param templateId
     * @param name
     * @returns itemId of created item
     */
    private createItemFromTemplate = async (
        parentId: string,
        templateId: string,
        name?: string,
    ): Promise<string | null> => {
        const result = await this.addSitecoreItem(parentId, templateId, name);

        return (!!result && getItemIdFromResponse(result)) || null;
    };

    addImage = async (
        imagesFolderItemId: string | null,
        onPopupCloseCallback?: (itemId: string | null) => void,
        parentId?: string,
    ) => {
        if (!imagesFolderItemId && parentId) {
            imagesFolderItemId = await this.createItemFromTemplate(
                parentId,
                this.rootStore.layoutStore.siteTemplatesIds.ImagesFolder,
                'Images',
            );
        }

        if (!imagesFolderItemId) {
            return null;
        }

        const itemId = await this.createItemFromTemplate(
            imagesFolderItemId,
            this.rootStore.layoutStore.siteTemplatesIds.SitecoreImage,
        );
        itemId && this.showItem(itemId, onPopupCloseCallback);

        return undefined;
    };

    /**
     * Creates Room item
     * @param parentId
     * @param onPopupCloseCallback
     */
    addRoom = async (
        parentId: string | null,
        onPopupCloseCallback?: (itemId: string | null) => void,
    ): Promise<string | null> => {
        if (!parentId) {
            parentId = await this.createItemFromTemplate(
                this.rootStore.layoutStore.layoutId,
                this.rootStore.layoutStore.siteTemplatesIds.AccomodationRoomsFolder,
                'Rooms',
            );

            if (!parentId) {
                return null;
            }
        }

        const itemId = await this.createItemFromTemplate(
            parentId,
            this.rootStore.layoutStore.siteTemplatesIds.AccomodationRoom,
        );
        itemId && this.showItem(itemId, onPopupCloseCallback);

        return parentId;
    };

    /**
     * Creates Board item
     * @param parentId
     * @param onPopupCloseCallback
     */
    addBoard = async (
        parentId: string | null,
        onPopupCloseCallback?: (itemId: string | null) => void,
    ): Promise<string | null> => {
        if (!parentId) {
            parentId = await this.createItemFromTemplate(
                this.rootStore.layoutStore.layoutId,
                this.rootStore.layoutStore.siteTemplatesIds.AccomodationBoardsFolder,
                'Boards',
            );

            if (!parentId) {
                return null;
            }
        }

        const itemId = await this.createItemFromTemplate(
            parentId,
            this.rootStore.layoutStore.siteTemplatesIds.AccomodationBoard,
        );
        itemId && this.showItem(itemId, onPopupCloseCallback);

        return parentId;
    };

    /**
     * Creates Facility item
     * @param parentId
     * @param onPopupCloseCallback
     */
    addFacility = async (
        parentId: string | null,
        onPopupCloseCallback?: (itemId: string | null) => void,
    ): Promise<string | null> => {
        if (!parentId) {
            parentId = await this.createItemFromTemplate(
                this.rootStore.layoutStore.layoutId,
                this.rootStore.layoutStore.siteTemplatesIds.AccomodationFacilitiesFolder,
                'Facilities',
            );

            if (!parentId) {
                return null;
            }
        }

        const itemId = await this.createItemFromTemplate(
            parentId,
            this.rootStore.layoutStore.siteTemplatesIds.AccomodationFacility,
        );
        itemId && this.showItem(itemId, onPopupCloseCallback);

        return parentId;
    };

    /**
     * Returns item details by itemId
     * @param itemId
     */
    getItemById = async (itemId: string) => {
        try {
            const { data } = await sitecoreService.getItemDetails(itemId, '', this.rootStore.layoutStore.lang);

            return data;
        } catch (e) {
            return null;
        }
    };

    /**
     * Returns room facility by itemId
     * @param itemId
     */
    getRoomFacilityById = async (itemId: string): Promise<IRoomFacility | null> => {
        try {
            const { data } = await sitecoreService.getItemDetails(itemId, this.rootStore.layoutStore.lang);
            const facility: IRoomFacility = {
                id: data.ItemID,
                name: data.ItemName,
                code: data.Code,
                number: data.Number,
                disclaimerMessage: data.DesclaimerMessage,
            };

            return facility;
        } catch (e) {
            return null;
        }
    };

    /**
     * Returns VirtualFacilityGroup Id
     * @param itemId Hotel facility item id
     */
    getVirtualFacilityGroupIdByFacilityId = async (itemId: string): Promise<string | null> => {
        try {
            const { data } = await sitecoreService.getVirtualFacilityGroupIdByFacilityId(
                itemId,
                this.rootStore.layoutStore.lang,
            );

            if (data?.VirtualFacilityGroupId) return data.VirtualFacilityGroupId;

            return null;
        } catch (e) {
            return null;
        }
    };

    /**
     *  Creates Room Facility item
     * @param facilitiesFolderId
     * @param onPopupCloseCallback
     * @param parentId
     */
    addRoomFacility = async (
        facilitiesFolderId: string | null,
        onPopupCloseCallback?: (itemId: string | null) => void,
        parentId?: string,
    ): Promise<string | null> => {
        if (!facilitiesFolderId && parentId) {
            facilitiesFolderId = await this.createItemFromTemplate(
                parentId,
                this.rootStore.layoutStore.siteTemplatesIds.RoomFacilitiesFolder,
                'Facilities',
            );
        }

        if (!facilitiesFolderId) {
            return null;
        }

        const itemId = await this.createItemFromTemplate(
            facilitiesFolderId,
            this.rootStore.layoutStore.siteTemplatesIds.RoomFacility,
        );
        itemId && this.showItem(itemId, onPopupCloseCallback);

        return facilitiesFolderId;
    };
}
