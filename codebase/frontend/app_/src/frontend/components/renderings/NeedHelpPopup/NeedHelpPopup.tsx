import { FC } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import WarningPopup from 'frontend/components/renderings/WarningPopup/WarningPopup';

import styles from './NeedHelpPopup.module.scss';

type TNeedHelpPopupFields = {
    Description: ISitecoreField<string>;
    Title: ISitecoreField<string>;
    CTA?: ISitecoreField<string>;
    Icon?: ISitecoreField<ISitecoreImage>;
    Label?: ISitecoreField<string>;
};

export type TNeedHelpPopupProps = ISitecoreComponent<TNeedHelpPopupFields>;

const NeedHelpPopup: FC<TNeedHelpPopupProps> = ({ fields }) => {
    const { isLuxuryPackage, toggleHelpPopup, isHelpPopupShown } = useStore((stores: IHolidaysStores) => ({
        isLuxuryPackage: stores.viewBookingStore.isLuxuryPackage,
        toggleHelpPopup: stores.viewBookingStore.toggleHelpPopup,
        isHelpPopupShown: stores.viewBookingStore.isHelpPopupShown,
    }));

    if (!fields || !isLuxuryPackage || !isHelpPopupShown) {
        return null;
    }

    const handleCloseHelpPopup = (): void => {
        toggleHelpPopup(false);
    };

    const { Description, Title, CTA, Icon, Label } = fields;

    return (
        <WarningPopup
            title={Title}
            description={Description}
            luxuryLabel={Label}
            secondaryCtaText={CTA}
            icon={Icon}
            onSecondaryCtaClick={handleCloseHelpPopup}
            onClose={handleCloseHelpPopup}
            bodyClass={styles.body}
            contentClass={styles.content}
            ctaClass={styles.cta}
            footerClass={styles.footer}
        />
    );
};

export default observer(NeedHelpPopup);
