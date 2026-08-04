import * as React from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { isDateInRange } from 'frontend/utils/date.utils';
import { ISitecoreChildren } from 'models/data/ISitecoreChildren';
import { BookingStatus } from 'models/enum/BookingStatus';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import RouterLink from 'frontend/components/common/RouterLink';
import SvgChevronRight from 'frontend/components/icons-new/ChevronRight';
import SvgInfoFilled from 'frontend/components/icons-new/InfoFilled';

interface IPolicyBannerPropsFields {
    items: ISitecoreChildren<IPolicyBannerFields>[];
}

export interface IPolicyBannerFields {
    Description: ISitecoreField<string>;
    EndDate: ISitecoreField<string>;
    Link: ISitecoreField<ISitecoreLink>;
    StartDate: ISitecoreField<string>;
    Title: ISitecoreField<string>;
}

export type TPolicyBannerProps = ISitecoreComponent<IPolicyBannerPropsFields>;

export const PolicyBanner = (props: TPolicyBannerProps) => {
    const { booking } = useStore(stores => ({
        booking: stores.bookingStore.booking ? stores.bookingStore.booking : stores.viewBookingStore.booking,
    }));

    if (!booking || booking.bookingStatus === BookingStatus.Canceled) {
        return null;
    }

    const returnDate = new Date(booking.package.accom.endDate);

    const banner = props.fields?.items.find(item => {
        const startDate = new Date(item.fields.StartDate.value);
        const endDate = new Date(item.fields.EndDate.value);

        // if end date is not set, set it to max available year
        if (endDate.getFullYear() <= 1) {
            endDate.setFullYear(9999);
        }

        if (isDateInRange(returnDate, startDate, endDate)) {
            return item;
        }

        return null;
    });

    if (!banner) {
        return null;
    }

    return (
        <div className='policy-banner__container' data-tid='policy-banner-container'>
            <div className='policy-banner'>
                <div className='policy-banner__icon' data-tid='policy-banner-icon'>
                    <SvgInfoFilled />
                </div>
                <div className='policy-banner-info'>
                    {!!banner.fields?.Title && (
                        <Text field={banner.fields.Title} tag='h3' className='policy-banner__title' />
                    )}
                    {!!banner.fields?.Description && (
                        <Text field={banner.fields.Description} tag='p' className='policy-banner__description' />
                    )}
                    {!!banner.fields?.Link && banner.fields?.Link.value?.href && (
                        <div className='policy-banner__link' data-tid='policy-banner-link'>
                            <RouterLink link={banner.fields.Link}>{banner?.fields?.Link.value.text}</RouterLink>
                            <SvgChevronRight className='icon-arrow' />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default observer(PolicyBanner);
