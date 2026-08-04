import * as React from 'react';

import { cmsUrls } from 'code/endpoints';
import settings from 'code/settings';
import { IFacility } from 'models/data/IHotel';

interface IFacilitiesListGroupProps {
    facilities: IFacility[];
    iconUrl?: string;
    showOnlyFirstN?: boolean;
    title?: string;
}

const FacilitiesListGroup = ({ title, iconUrl, facilities, showOnlyFirstN }: IFacilitiesListGroupProps) => {
    if (!facilities.length) {
        return null;
    }

    return (
        <div className='flex-list-box' data-tid='facility-group'>
            {!!title && (
                <h3 className='flex-list-head'>
                    {!!iconUrl && (
                        <img
                            className='me-2'
                            src={cmsUrls.media(iconUrl)}
                            width={18}
                            height={18}
                            alt=''
                            role='presentation'
                        />
                    )}
                    <span>{title}</span>
                </h3>
            )}

            <ul className='list'>
                {facilities.map((item, i) => (
                    <li
                        key={item.id || i}
                        className={
                            showOnlyFirstN && i > settings.HotelDetails.MaxFacilityNumberBeforeBreakdown
                                ? 'd-none'
                                : undefined
                        }
                    >
                        {item.name}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default FacilitiesListGroup;
