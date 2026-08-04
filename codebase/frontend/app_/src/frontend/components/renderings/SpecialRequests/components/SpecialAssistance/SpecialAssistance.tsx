import { FC, useState } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { isHolidayStore } from 'frontend/store/holidays';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import JSSImage from 'frontend/components/common/JSSImage';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import SpecialAssistanceDrawer from 'frontend/components/renderings/SpecialRequests/components/SpecialAssistanceDrawer/SpecialAssistanceDrawer';
import SpecialAssistancePopup from 'frontend/components/renderings/SpecialRequests/components/SpecialAssistancePopup/SpecialAssistancePopup';

import styles from './SpecialAssistance.module.scss';

export interface IAddAssistanceFields {
    AddAssistanceDescription: ISitecoreField<string>;
    AddAssistanceExtra: ISitecoreField<string>;
    AddAssistancePhone: ISitecoreField<string>;
    AddAssistanceTitle: ISitecoreField<string>;
}
export interface ISpecialAssistanceFields extends IAddAssistanceFields {
    InfoCTA: ISitecoreField<string>;
    InfoDescription: ISitecoreField<string>;
    InfoIcon: ISitecoreField<ISitecoreImage>;
    InfoTitle: ISitecoreField<string>;
}

export interface ISpecialAssistanceProps {
    fields?: ISpecialAssistanceFields;
    isCTAEnabled?: boolean;
}

const SpecialAssistance: FC<ISpecialAssistanceProps> = ({ fields, isCTAEnabled = true }) => {
    const [isPopupShown, setIsPopupShown] = useState(false);
    const isMobile = useMobileViewport();

    const { isSpecialAssistanceEnabled, isConfirmationPage, isViewBookingStatusPage } = useStore(stores => ({
        isSpecialAssistanceEnabled: stores.layoutStore.isSpecialAssistanceEnabled,
        isConfirmationPage: stores.layoutStore.isConfirmationPage,
        isViewBookingStatusPage: isHolidayStore(stores) ? stores.viewBookingStore.isViewBookingStatusPage : false,
    }));

    const togglePopup = () => {
        setIsPopupShown(!isPopupShown);
    };

    if (!fields || !isSpecialAssistanceEnabled) {
        return null;
    }

    const { InfoIcon, InfoTitle, InfoDescription, InfoCTA } = fields;

    return (
        <div
            data-tid='special-assistance-wrapper'
            className={classNames(
                'special-assistance-content holiday-summary-item',
                styles.specialAssistance,
                isViewBookingStatusPage && styles.narrowContainer,
            )}
        >
            <div className={styles.textContainer} data-tid='special-assistance-text-container'>
                <Text className={styles.title} field={InfoTitle} tag='h2' data-tid='special-assistance-title' />
                <div className={styles.textContent} data-tid='special-assistance-content'>
                    <JSSImage field={InfoIcon} dataTid='special-assistance-icon' />
                    <RichTextWithLinks
                        tag='div'
                        field={InfoDescription}
                        className={styles.description}
                        dataId='special-assistance-description'
                    />
                </div>
            </div>

            {!!InfoCTA?.value && isCTAEnabled && (
                <Button
                    onClick={togglePopup}
                    isOutlined
                    className={classNames(styles.btn, isConfirmationPage && styles.confirmationPage)}
                    isSmall
                    data-tid='special-assistance-button'
                >
                    <Text field={InfoCTA} tag='span' />
                </Button>
            )}

            {isPopupShown && !isMobile && <SpecialAssistancePopup onClose={togglePopup} {...fields} />}
            {isPopupShown && isMobile && <SpecialAssistanceDrawer onCTAClick={togglePopup} {...fields} />}
        </div>
    );
};

export default observer(SpecialAssistance);
