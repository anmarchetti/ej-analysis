import * as React from 'react';

import { cmsUrls } from 'code/endpoints';
import useStore from 'frontend/hooks/useStore';
import { isHolidayStore } from 'frontend/store/holidays';
import { ViewBookingTrackingEvents } from 'frontend/utils/tracking/viewBooking.utils';
import { IHealthEntryRequirement } from 'models/data/IBookingInfo';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import RouterLink from 'frontend/components/common/RouterLink';

interface IHealthEntryRequirementTileProps {
    item: IHealthEntryRequirement;
}

const HealthEntryRequirementTile = ({ item }: IHealthEntryRequirementTileProps) => {
    const { fireViewBookingEvent } = useStore(stores => ({
        fireViewBookingEvent: isHolidayStore(stores) ? stores.trackingStore.fireViewBookingEvent : null,
    }));

    const onActionClick = () => {
        fireViewBookingEvent?.(ViewBookingTrackingEvents.Health, item.trackingLabel);
    };

    return (
        <div className='health-entry-requirement' data-tid='health-entry-requirement'>
            <div
                className='health-entry-requirement__background'
                data-tid='health-entry-requirement-background'
                style={item.image ? { backgroundImage: `url(${cmsUrls.media(item.image)})` } : undefined}
            >
                {item.icon && (
                    <div className='health-entry-requirement__icon' data-tid='health-entry-requirement-icon'>
                        <img src={cmsUrls.media(item.icon)} alt='' role='presentation' />
                    </div>
                )}
            </div>

            <div className='health-entry-requirement__info'>
                {!!item.title && (
                    <h3 className='health-entry-requirement-info__title' data-tid='health-entry-requirement-title'>
                        {item.title}
                    </h3>
                )}

                {!!item.description && (
                    <RichTextWithLinks
                        field={{ value: item.description }}
                        className='health-entry-requirement-info__description'
                    />
                )}

                {!!item.cta?.url && (
                    <div className='health-entry-requirement-info__footer' data-tid='health-entry-requirement-footer'>
                        <RouterLink link={{ value: item.cta }} className='btn btn--medium' onClick={onActionClick}>
                            {item.cta.text}
                        </RouterLink>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HealthEntryRequirementTile;
