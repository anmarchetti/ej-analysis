import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import { arrayMove, SortableContainer, SortableElement } from 'react-sortable-hoc';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { IRoomFacility } from 'models/data/IHotel';
import SiteSettings from 'models/enum/SiteSettings';
import Button from 'frontend/components/common/Button';
import styles from 'frontend/components/renderings/RoomTypes/components/Room.module.scss';
import RoomFacilityItem from 'frontend/components/renderings/RoomTypes/components/RoomFacilityItem/RoomFacilityItem';

export interface IRoomFacilitiesProps {
    facilities: IRoomFacility[] | undefined;
    addFacility?: (facilitiesFolderId: string | null, callback?, parentId?: string) => Promise<string | null>;
    getFacilityById?: (itemId: string) => Promise<IRoomFacility | null>;
    isEditMode?: boolean;
    onDeleteItem?: (id: string) => void;
    onSortItems?: (items: string[]) => void;
    roomFacilityFolderId?: string | null;
    roomId?: string;
    tooltipClass?: string;
}

interface ISortableFacilityProps {
    facility: IRoomFacility;
}

interface ISortableFacilitiesProps {
    facilities: IRoomFacility[];
}

const RoomFacilities: FC<IRoomFacilitiesProps> = ({
    facilities,
    addFacility,
    getFacilityById,
    isEditMode,
    onDeleteItem,
    onSortItems,
    roomFacilityFolderId,
    roomId,
    tooltipClass,
}) => {
    const { getSettingAsNumber } = useStore(({ layoutStore }) => ({
        getSettingAsNumber: layoutStore.getSettingAsNumber,
    }));
    const getFacilities = (): IRoomFacility[] | undefined =>
        isEditMode
            ? facilities
            : facilities?.slice(0, getSettingAsNumber(SiteSettings.MaxNumberOfVisibleRoomFacilities));

    const [facilitiesState, setFacilitiesState] = useState(getFacilities() || []);
    const [tempFacilities, setTempFacilities] = useState([] as IRoomFacility[]);
    const [isReordering, setIsReordering] = useState(false);
    const [roomFacilityFolderIdState, setRoomFacilityFolderIdState] = useState(roomFacilityFolderId);
    const viewRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const { current } = viewRef;

        if (isEditMode && current) {
            current.querySelector('.room-facilities-reorder-btn')?.addEventListener('click', onReorderClick);
            current.querySelector('.room-facilities-save-btn')?.addEventListener('click', onReorderSave);
            current.querySelector('.room-facilities-cancel-btn')?.addEventListener('click', onReorderCancel);
            current.querySelector('.room-facilities-add-btn')?.addEventListener('click', onAddFacility);
        }

        return () => {
            if (isEditMode && current) {
                current.querySelector('.room-facilities-reorder-btn')?.removeEventListener('click', onReorderClick);
                current.querySelector('.room-facilities-save-btn')?.removeEventListener('click', onReorderSave);
                current.querySelector('.room-facilities-cancel-btn')?.removeEventListener('click', onReorderCancel);
                current.querySelector('.room-facilities-add-btn')?.removeEventListener('click', onAddFacility);
            }
        };
    }, []);

    const onReorderClick = useCallback(() => {
        setIsReordering(true);
        setTempFacilities([...facilitiesState]);
    }, [facilitiesState]);

    const onReorderSave = useCallback((): void => {
        setTempFacilities(prev => {
            const ids = prev.filter(i => !!i.id).map(i => i.id!);
            onSortItems?.(ids);
            setFacilitiesState(prev);

            return [];
        });
        setIsReordering(false);
    }, [onSortItems]);

    const onReorderCancel = useCallback((): void => {
        setIsReordering(false);
        setTempFacilities([]);
    }, []);

    const onSortEnd = ({ oldIndex, newIndex }): void => {
        setTempFacilities(prevTemp => arrayMove(prevTemp, oldIndex, newIndex));
    };

    const onDeleteFacility = (id: string): void => {
        setFacilitiesState(prevFacilities => {
            const idx = prevFacilities.findIndex(el => el.id === id);
            const newArr = [...prevFacilities.slice(0, idx), ...prevFacilities.slice(idx + 1)];

            return newArr;
        });
        onDeleteItem?.(id);
    };

    const onAddFacility = useCallback(async (): Promise<void> => {
        let facilityFolderId: Nullable<string> = null;

        if (addFacility) {
            facilityFolderId = await addFacility(
                roomFacilityFolderIdState || null,
                async (itemId: string) => {
                    const facility = getFacilityById && (await getFacilityById(itemId));

                    if (facility) {
                        setFacilitiesState(prevFacilities => [...prevFacilities, facility]);
                    }
                },
                roomId,
            );
        }

        setRoomFacilityFolderIdState(facilityFolderId);
    }, [addFacility, getFacilityById, roomFacilityFolderIdState, roomId]);

    const getFacilityItems = (items: IRoomFacility[]): JSX.Element => (
        <React.Fragment>
            {items.map((facility, i) => (
                <RoomFacilityItem
                    key={`${facility.id || facility.code}-${i}`}
                    id={facility.id}
                    roomFacility={facility}
                    isEditMode={isEditMode}
                    onDeleteItem={onDeleteFacility}
                    tooltipClass={tooltipClass}
                />
            ))}
        </React.Fragment>
    );

    const SortableFacility = SortableElement<ISortableFacilityProps>(({ facility }) => (
        <RoomFacilityItem roomFacility={facility} isEditMode={isEditMode} onDeleteItem={onDeleteFacility} />
    ));

    const SortableFacilities = SortableContainer<ISortableFacilitiesProps>(({ facilities }) => (
        <div>
            {facilities.map((f, index) => (
                <SortableFacility key={f.id} index={index} facility={f} />
            ))}
        </div>
    ));

    const colCount = 2;
    const hasFacilities = !!facilitiesState.length;
    const itemsPerCol = Math.ceil(facilitiesState.length / colCount);
    const firstColFacilities = facilitiesState.slice(0, itemsPerCol);
    const secondColFacilities = facilitiesState.slice(itemsPerCol);

    return (
        <div ref={viewRef} className={styles.detailsIcons} data-tid='facilities'>
            {isEditMode && (
                <div data-tid='facilities-edit'>
                    {isReordering && (
                        <div data-tid='facilities-edit-text'>Drag and drop facilities inside the room.</div>
                    )}
                    <Button
                        className={classNames(
                            'room-facilities-reorder-btn',
                            isReordering || !hasFacilities ? 'd-none' : 'd-inline-block',
                        )}
                    >
                        Reorder facilities
                    </Button>
                    <Button
                        className={classNames(
                            'room-facilities-save-btn me-1',
                            isReordering ? 'd-inline-block' : 'd-none',
                        )}
                    >
                        Save Order
                    </Button>
                    <Button
                        className={classNames('room-facilities-cancel-btn', isReordering ? 'd-inline-block' : 'd-none')}
                    >
                        Cancel
                    </Button>
                    {isReordering && <SortableFacilities facilities={tempFacilities} axis='y' onSortEnd={onSortEnd} />}
                </div>
            )}
            {!isReordering && !!facilitiesState.length && (
                <div className='row masonry'>
                    <div data-tid='first-column-of-facilities' className='g-0'>
                        {getFacilityItems(firstColFacilities)}
                    </div>
                    <div data-tid='second-column-of-facilities' className='g-0'>
                        {getFacilityItems(secondColFacilities)}
                    </div>
                </div>
            )}
            {isEditMode && <Button className='room-facilities-add-btn p-1'>Add facility</Button>}
        </div>
    );
};

export default RoomFacilities;
