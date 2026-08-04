import { useCallback, useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { getImageByField } from 'frontend/utils/expEditor.utils';
import { convertSitecoreItemsToFacilityGroups } from 'frontend/utils/facilities.utils';
import { normalizeGUID } from 'frontend/utils/string.utils';
import { IFacility, IFacilityGroup, ISitecoreFacilityGroup, ISitecoreVirtualFacilities } from 'models/data/IHotel';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';

import { FACILITIES_CONTENT } from './FacilitiesContent';
import FacilityGroup from './FacilityGroup';
import FacilityItemFood from './FacilityItemFood';

export interface IFacilitiesEditModeProps {
    fields: ISitecoreVirtualFacilities;
}

const FacilitiesEditMode = ({ fields }: IFacilitiesEditModeProps) => {
    const {
        getPhrase,
        addItem,
        getItemById,
        updateItem,
        deleteItem,
        sortItems,
        getGroupIdByItemId,
        setItemDisplayName,
    } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        addItem: stores.editorStore.addFacility,
        getItemById: stores.editorStore.getItemById,
        updateItem: stores.editorStore.updateItem,
        deleteItem: stores.editorStore.deleteItem,
        sortItems: stores.editorStore.sortItems,
        getGroupIdByItemId: stores.editorStore.getVirtualFacilityGroupIdByFacilityId,
        setItemDisplayName: stores.editorStore.setItemDisplayName,
    }));

    const [facilityGroups, setFacilityGroups] = useState<IFacilityGroup[]>([]);
    const [addingItem, setAddingItem] = useState(false);
    const [parentItemId, setParentItemId] = useState<string | undefined>(undefined);

    const viewRef = useRef<HTMLDivElement>(null);

    const initializeFacilityGroups = (groups: ISitecoreFacilityGroup[]) => {
        const convertedGroups = convertSitecoreItemsToFacilityGroups(groups);
        setFacilityGroups(convertedGroups);
    };

    const onAddItem = useCallback(async () => {
        setAddingItem(true);
        const parentId = await addItem(parentItemId ?? null, onCloseCallback);
        setAddingItem(false);
        setParentItemId(parentId ?? undefined);
    }, [addItem, parentItemId]);

    const onCloseCallback = async (itemId: string | null) => {
        if (!itemId) {
            alert(FACILITIES_CONTENT.NO_ITEM_ID_FOUND_MESSAGE);

            return;
        }

        const data = await getItemById(itemId);
        const groupId = await getGroupIdByItemId(itemId);

        if (!groupId) {
            alert(FACILITIES_CONTENT.NO_VIRTUAL_GROUP_FOUND_MESSAGE);

            return;
        }

        const fields = await getItemFields(data);

        if (fields) {
            updateItemState(itemId, normalizeGUID(groupId), fields).then(() => {
                location.reload();
                alert(FACILITIES_CONTENT.PAGE_RELOAD_MESSAGE);
            });
        }
    };

    const onSortItems = async (items: IFacility[], groupId: string) => {
        await sortItems(items.map(i => i.id).filter(i => !!i) as string[]);
        setFacilityGroups(prevGroups =>
            prevGroups.map(group => (group.id === groupId ? { ...group, items: items } : group)),
        );
    };

    const getItemFields = async data => {
        const facilityTypeId = normalizeGUID(data.FacilityType || '');

        if (!facilityTypeId) {
            alert(FACILITIES_CONTENT.NO_FACILITY_TYPE_ID_FOUND_MESSAGE);

            return null;
        }

        const facilityType = await getItemById(facilityTypeId);

        if (facilityType?.Name) {
            return {
                name: facilityType?.Name,
                id: data?.ItemID?.toLowerCase(),
            };
        }

        return null;
    };

    const onUpdateItem = async (itemId: string) => {
        await updateItem(itemId, onCloseCallback);
    };

    const updateItemState = async (itemId: string, groupItemId: string, fields) => {
        setItemDisplayName(itemId, fields.name);
        const group = facilityGroups.find(group => group.id === groupItemId);

        if (group) {
            setFacilityGroups(prevGroups =>
                prevGroups.map(g => (g.id === groupItemId ? { ...g, items: [...g.items, { ...fields }] } : g)),
            );
        } else {
            const newGroup = await createNewGroup(groupItemId, fields);
            setFacilityGroups(prevGroups => [...prevGroups, newGroup]);
        }
    };

    const createNewGroup = async (groupItemId, fields) => {
        const groupData = await getItemById(groupItemId);
        const groupIcon = getImageByField(groupData.Icon, groupItemId);

        return {
            id: groupItemId,
            name: groupData.Name,
            iconUrl: groupIcon?.small || '',
            items: [{ ...fields }],
        } as IFacilityGroup;
    };

    const onDeleteItem = (itemId: string) => {
        deleteItem(itemId).then(() => {
            location.reload();
            alert(FACILITIES_CONTENT.PAGE_RELOAD_MESSAGE);
        });
        setFacilityGroups(prevGroups =>
            prevGroups.map(group => ({
                ...group,
                items: group.items.filter(item => item.id !== itemId),
            })),
        );
    };

    useEffect(() => {
        if (fields.virtualFacilityGroups?.length) {
            initializeFacilityGroups(fields.virtualFacilityGroups);
        }

        if (fields.facilitiesFolderId) {
            setParentItemId(fields.facilitiesFolderId);
        }

        const addFacilityBtn = viewRef.current?.querySelector('.add-facility-btn');
        addFacilityBtn?.addEventListener('click', onAddItem);

        return () => {
            addFacilityBtn?.removeEventListener('click', onAddItem);
        };
    }, [fields, onAddItem]);

    return (
        <div ref={viewRef}>
            <h2 className='hotel-facilities__title' data-tid={'hotel-facilities-title'}>
                {getPhrase(SitecoreDictionary.HotelInfoLabelsFacilitiesAndAmenities)}
            </h2>
            <div className='hotel-facilities__lists' data-tid={'hotel-facilities-lists'}>
                {facilityGroups
                    .filter(f => f.items?.length)
                    .map((el, idx) => {
                        if (el.description) {
                            return (
                                <FacilityItemFood
                                    key={idx}
                                    title={el.name}
                                    iconUrl={el.iconUrl}
                                    description={el.description}
                                />
                            );
                        }

                        return (
                            <FacilityGroup
                                key={idx}
                                facilities={el.items}
                                title={el.name}
                                iconUrl={el.iconUrl}
                                onDeleteItem={onDeleteItem}
                                onUpdateItem={onUpdateItem}
                                onSortItems={items => onSortItems(items, el.id)}
                            />
                        );
                    })}
            </div>
            <Button className='add-facility-btn my-3' isLoading={addingItem} data-tid='add-facility-btn'>
                {FACILITIES_CONTENT.ADD_FACILITIES}
            </Button>
        </div>
    );
};

export default observer(FacilitiesEditMode);
