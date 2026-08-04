import { FC } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { ISitecoreChildren } from 'models/data/ISitecoreChildren';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import BookingAlert from 'frontend/components/common/Booking/BookingAlert/BookingAlert';
import styles from 'frontend/components/common/Booking/BookingAlert/BookingAlert.module.scss';

export interface IDisruptionItem {
    Description: ISitecoreField<string>;
    DisruptionLevel: ISitecoreField<string>;
    Title: ISitecoreField<string>;
    Visible: ISitecoreField<boolean>;
}

export interface IDisruptionBannerFields {
    Children: ISitecoreChildren<IDisruptionItem>[];
    CollapseButtonAriaLabel: ISitecoreField<string>;
    ExpandButtonAriaLabel: ISitecoreField<string>;
}

export type TDisruptionBannerProps = ISitecoreComponent<IDisruptionBannerFields>;

const DisruptionBanner: FC<TDisruptionBannerProps> = ({ fields }) => {
    const { bookingDisruptions } = useStore((stores: IHolidaysStores) => ({
        bookingDisruptions: stores.viewBookingStore.getBookingDisruptions,
    }));

    if (!fields?.Children.length || !bookingDisruptions.length) {
        return null;
    }

    const { Children: ContentDisruptions, CollapseButtonAriaLabel, ExpandButtonAriaLabel } = fields;

    const filteredContentDisruptions = ContentDisruptions.filter(content => {
        const isDisruptionContentExists = !!bookingDisruptions.find(
            item => item === content.fields.DisruptionLevel.value,
        );

        return content.fields.Visible.value && isDisruptionContentExists;
    });

    if (!filteredContentDisruptions.length) return null;

    return (
        <div className={styles.wrapper} data-tid='disruption-banner'>
            {filteredContentDisruptions.map(disruption => (
                <BookingAlert
                    key={`disruption-alert-${disruption.fields.DisruptionLevel.value}`}
                    title={disruption.fields.Title}
                    content={disruption.fields.Description}
                    expandBtnAriaLabel={ExpandButtonAriaLabel.value}
                    collapseBtnAriaLabel={CollapseButtonAriaLabel.value}
                />
            ))}
        </div>
    );
};

export default observer(DisruptionBanner);
