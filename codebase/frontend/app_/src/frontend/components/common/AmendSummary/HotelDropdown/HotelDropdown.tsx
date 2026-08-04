import { FunctionComponent } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import { IHotel } from 'models/data/IHotel';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import AmendSummaryAccordion from 'frontend/components/common/AmendSummary/AmendSummaryAccordion/AmendSummaryAccordion';
import HotelPreviewLink from 'frontend/components/common/AmendSummary/HotelPreviewLink/HotelPreviewLink';
import IconChevronRight from 'frontend/components/icons/ChevronRight';

import styles from './HotelDropdown.module.scss';

export interface IHotelDropdownProps {
    CTALabel: ISitecoreField<string>;
    hotel: IHotel;
    icon: ISitecoreField<ISitecoreImage>;
    title: ISitecoreField<string>;
    previewClickHandler?: () => void;
}

const HotelDropdown: FunctionComponent<IHotelDropdownProps> = ({
    previewClickHandler,
    icon,
    title,
    hotel,
    CTALabel,
}) => {
    const location = `${hotel.resort.name}, ${hotel.location.name}`;

    return (
        <AmendSummaryAccordion dataTid='amend-summary-hotel' icon={icon} title={title.value} className={styles.content}>
            <h4 className={styles.title} data-tid='amend-summary-hotel-name'>
                {hotel.name}
            </h4>
            <p data-tid='amend-summary-hotel-location'>{location}</p>
            {CTALabel && (
                <HotelPreviewLink hotel={hotel} className={styles.link} clickHandler={previewClickHandler}>
                    <Text field={CTALabel} />
                    <IconChevronRight />
                </HotelPreviewLink>
            )}
        </AmendSummaryAccordion>
    );
};

export default HotelDropdown;
