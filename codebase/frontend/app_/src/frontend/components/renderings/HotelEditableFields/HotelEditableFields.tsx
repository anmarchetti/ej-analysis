import React from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import useStore from 'frontend/hooks/useStore';
import { IHotelInfoFields } from 'models/data/IHotelInfoFields';

const HotelEditableFields = () => {
    const { isEditMode, pageFields } = useStore(stores => ({
        isEditMode: stores.layoutStore.isEditMode,
        pageFields: stores.layoutStore.pageFields as Nullable<IHotelInfoFields>,
    }));

    if (!pageFields || !isEditMode) {
        return null;
    }

    return (
        <div className='editable-fields wrapper-container--px'>
            {!!pageFields.PageTitle && (
                <p>
                    Metadata Title: <Text field={pageFields.PageTitle} tag='span' />
                </p>
            )}
            {!!pageFields.Longitude && (
                <p>
                    Longitude: <Text field={pageFields.Longitude} tag='span' />
                </p>
            )}
            {!!pageFields.Latitude && (
                <p>
                    Latitude: <Text field={pageFields.Latitude} tag='span' />
                </p>
            )}
            {!!pageFields.StarRating && (
                <p>
                    Star Rating: <Text field={pageFields.StarRating} tag='span' />
                </p>
            )}
            {!!pageFields.TripAdvisorId && (
                <p>
                    TripAdvisor ID: <Text field={pageFields.TripAdvisorId} tag='span' />
                </p>
            )}
        </div>
    );
};

export default HotelEditableFields;
