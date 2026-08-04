import { FC, useState } from 'react';
import { observer } from 'mobx-react';

import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreCompositeField, ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import { ISitecoreAirport } from 'models/sitecore/IAirportsData';
import BookingAlert from 'frontend/components/common/Booking/BookingAlert/BookingAlert';
import styles from 'frontend/components/common/Booking/BookingAlert/BookingAlert.module.scss';

import CrisisBannerPopup from './components/CrisisBannerPopup/CrisisBannerPopup';
import useCrisisBanner from './hooks/useCrisisBanner';

interface ICrisisBannerFields {
    AlwaysVisible: ISitecoreField<boolean>;
    CTAButtonLabel: ISitecoreField<string>;
    CTAButtonScreenReaderLabel: ISitecoreField<string>;
    Content: ISitecoreField<string>;
    ExpandButtonScreenReaderLabel: ISitecoreField<string>;
    ImpactedAirports: ISitecoreCompositeField<ISitecoreAirport>[];
    Title: ISitecoreField<string>;
}

export type TCrisisBannerProps = ISitecoreComponent<ICrisisBannerFields>;

const CrisisBanner: FC<TCrisisBannerProps> = ({ fields }) => {
    const [isPopupShown, toggleShowPopup] = useState(true);
    const isBookingImpacted = useCrisisBanner({
        alwaysVisible: fields?.AlwaysVisible,
        impactedAirports: fields?.ImpactedAirports,
    });

    if (!fields || !isBookingImpacted) {
        return null;
    }

    const { Title, Content, CTAButtonLabel, CTAButtonScreenReaderLabel, ExpandButtonScreenReaderLabel } = fields;

    const renderContent = (isInPopup?: boolean) => (
        <BookingAlert
            title={Title}
            content={Content}
            expandBtnAriaLabel={ExpandButtonScreenReaderLabel?.value}
            isInPopup={isInPopup}
        />
    );

    return (
        <div className={styles.wrapper} data-tid='crisis-banner'>
            {renderContent()}
            <CrisisBannerPopup
                open={isPopupShown}
                ctaCloseButtonLabel={CTAButtonLabel}
                ctaCloseButtonScreenReaderLabel={CTAButtonScreenReaderLabel}
                content={renderContent(true)}
                onClose={() => toggleShowPopup(false)}
            />
        </div>
    );
};

export default observer(CrisisBanner);
