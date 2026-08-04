import React, { useEffect, useRef } from 'react';

import isBackend from 'frontend/utils/isBackend';

import { FACILITIES_CONTENT } from './FacilitiesContent';

interface IFacilityItemProps {
    label: string;
    id?: string;
    isEditMode?: boolean;
    onDeleteItem?: (id: string) => void;
    onUpdateItem?: (id: string) => void;
}

const FacilityItem: React.FC<IFacilityItemProps> = ({ label, id, isEditMode, onDeleteItem, onUpdateItem }) => {
    const viewRef = useRef<HTMLLIElement>(null);

    useEffect(() => {
        if (!isEditMode || isBackend() || !viewRef.current) return;

        const updateButton = viewRef.current.querySelector('.update-facility-btn');
        const deleteButton = viewRef.current.querySelector('.delete-facility-btn');

        const handleUpdateItem = (e: Event): void => {
            e.preventDefault();
            const target = e.target as HTMLElement;
            const itemId = target.dataset.itemId;

            if (itemId) {
                onUpdateItem?.(itemId);
            }
        };

        const handleDeleteItem = (e: Event): void => {
            e.preventDefault();

            if (confirm('Are you sure you want to delete this facility?')) {
                const target = e.target as HTMLElement;
                const itemId = target.dataset.itemId;

                if (itemId) {
                    onDeleteItem?.(itemId);
                }
            }
        };

        if (updateButton) {
            updateButton.addEventListener('click', handleUpdateItem);
        }

        if (deleteButton) {
            deleteButton.addEventListener('click', handleDeleteItem);
        }

        return () => {
            if (updateButton) {
                updateButton.removeEventListener('click', handleUpdateItem);
            }

            if (deleteButton) {
                deleteButton.removeEventListener('click', handleDeleteItem);
            }
        };
    }, [isEditMode, onDeleteItem, onUpdateItem]);

    return (
        <li className='list-item' ref={viewRef} data-tid={'facility-item'}>
            {label}
            {isEditMode && id && (
                <div>
                    <a href='#' className='update-facility-btn' data-item-id={id} data-tid={'update-facility'}>
                        {FACILITIES_CONTENT.UPDATE}
                    </a>
                    &nbsp;|&nbsp;
                    <a href='#' className='delete-facility-btn' data-item-id={id} data-tid={'delete-facility'}>
                        {FACILITIES_CONTENT.REMOVE}
                    </a>
                </div>
            )}
        </li>
    );
};

export default FacilityItem;
