import React, { useCallback, useEffect, useRef, useState } from 'react';
import { arrayMove, SortableContainer, SortableElement } from 'react-sortable-hoc';
import classNames from 'classnames';
import { useLocalObservable } from 'mobx-react';

import { cmsUrls } from 'code/endpoints';
import { IFacility } from 'models/data/IHotel';
import Button from 'frontend/components/common/Button';

import { FACILITIES_CONTENT } from './FacilitiesContent';
import FacilityItem from './FacilityItem';

interface IFacilityGroupProps {
    facilities: IFacility[];
    iconUrl?: string;
    onDeleteItem?: (id: string) => void;
    onSortItems?: (items: IFacility[]) => void;
    onUpdateItem?: (id: string) => void;
    title?: string;
}

interface ISortableFacilityProps {
    facility: IFacility;
}

interface ISortableFacilitiesProps {
    facilities: IFacility[];
}

const FacilityGroup: React.FC<IFacilityGroupProps> = ({
    facilities: initialFacilities,
    iconUrl,
    onDeleteItem,
    onSortItems,
    onUpdateItem,
    title,
}) => {
    const [facilities, setFacilities] = useState<IFacility[]>([]);
    const [isReordering, setIsReordering] = useState(false);
    const [tempFacilities, setTempFacilities] = useState<IFacility[]>([]);
    const viewRef = useRef<HTMLDivElement>(null);
    const eventsAdded = useRef(false);
    const observableState = useLocalObservable(() => ({
        tempFacilities: [] as IFacility[],
    }));

    const sortBySortOrder = useCallback(
        (a: IFacility, b: IFacility) => (a.sortOrder && b.sortOrder ? a.sortOrder - b.sortOrder : 0),
        [],
    );

    const shownFacilities = initialFacilities.sort(sortBySortOrder);

    const initFacilities = useCallback(() => {
        if (
            !isReordering &&
            (facilities.some(f => !shownFacilities.find(s_f => s_f.id === f.id && s_f.name === f.name)) ||
                facilities.length !== shownFacilities.length)
        ) {
            setFacilities(shownFacilities);
            observableState.tempFacilities = shownFacilities;

            // addEventListener so it can work in EE, but add only once
            if (!eventsAdded.current && viewRef.current) {
                viewRef.current.querySelector('.facilities-reorder-btn')?.addEventListener('click', onReorderClick);
                viewRef.current.querySelector('.facilities-save-btn')?.addEventListener('click', onReorderSave);
                viewRef.current.querySelector('.facilities-cancel-btn')?.addEventListener('click', onReorderCancel);
                eventsAdded.current = true;
            }
        }
    }, [isReordering, facilities, shownFacilities]);

    useEffect(() => {
        initFacilities();
    }, []);

    useEffect(
        () => () => {
            if (viewRef.current) {
                viewRef.current.querySelector('.facilities-reorder-btn')?.removeEventListener('click', onReorderClick);
                viewRef.current.querySelector('.facilities-save-btn')?.removeEventListener('click', onReorderSave);
                viewRef.current.querySelector('.facilities-cancel-btn')?.removeEventListener('click', onReorderCancel);
                eventsAdded.current = false;
            }
        },
        [],
    );

    const onReorderClick = useCallback(() => {
        setIsReordering(true);
        setTempFacilities(observableState.tempFacilities);
    }, [facilities]);

    const onSortEnd = ({ oldIndex, newIndex }) => {
        const newOrdering =
            observableState.tempFacilities && arrayMove(observableState.tempFacilities, oldIndex, newIndex);
        setTempFacilities(newOrdering);
        observableState.tempFacilities = newOrdering;
    };

    const onReorderSave = useCallback(() => {
        setFacilities(observableState.tempFacilities);
        setIsReordering(false);
    }, [onSortItems]);

    const onReorderCancel = useCallback(() => {
        observableState.tempFacilities = shownFacilities;
        setIsReordering(false);
    }, []);

    const SortableFacility = SortableElement<ISortableFacilityProps>(({ facility }) => (
        <FacilityItem key={facility.id} label={facility.name} isEditMode={false} id={facility.id} />
    ));

    const SortableFacilities = SortableContainer<ISortableFacilitiesProps>(({ facilities }) => (
        <div>
            {facilities.map((f, index) => (
                <SortableFacility key={f.id} index={index} facility={f} />
            ))}
        </div>
    ));

    return (
        <div className='flex-list-box' data-tid='facility-group'>
            {title && (
                <h3 className='flex-list-head'>
                    {iconUrl && <img className='me-2' alt='' src={cmsUrls.media(iconUrl)} width={18} height={18} />}
                    <span>{title}</span>
                </h3>
            )}

            <div className='flex-list-items' ref={viewRef}>
                {isReordering && <div data-tid={'reorder-message'}>{FACILITIES_CONTENT.REORDER_GROUP_MESSAGE}</div>}

                <Button
                    className={classNames('facilities-reorder-btn', isReordering ? 'd-none' : 'd-inline-block')}
                    data-tid={'reorder-btn'}
                >
                    {FACILITIES_CONTENT.REORDER_GROUP}
                </Button>
                <Button
                    className={classNames('facilities-save-btn me-1', isReordering ? 'd-inline-block' : 'd-none')}
                    data-tid={'save-btn'}
                >
                    {FACILITIES_CONTENT.SAVE_ORDER}
                </Button>
                <Button
                    className={classNames('facilities-cancel-btn', isReordering ? 'd-inline-block' : 'd-none')}
                    data-tid={'cancel-btn'}
                >
                    {FACILITIES_CONTENT.CANCEL}
                </Button>

                {isReordering ? (
                    <SortableFacilities facilities={tempFacilities} axis='y' onSortEnd={onSortEnd} />
                ) : (
                    <ul className='list'>
                        {facilities.map((f, idx) => (
                            <FacilityItem
                                key={`${f.id}${idx}`}
                                label={f.name}
                                isEditMode
                                id={f.id}
                                onDeleteItem={onDeleteItem}
                                onUpdateItem={onUpdateItem}
                            />
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default FacilityGroup;
