import { FC } from 'react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import Button from 'frontend/components/common/Button';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import { IIntroductionSectionFields } from 'frontend/components/renderings/AssistedTravelForm/models/interface';
import { PopupType, Screen } from 'frontend/components/renderings/AssistedTravelForm/models/types';
import { createOnContactUsClick } from 'frontend/components/renderings/AssistedTravelForm/utils/AssistedTravelForm.utils';

import styles from './IntroductionSection.module.scss';

export interface IIntroductionSectionProps {
    fields: IIntroductionSectionFields;
    goToScreen: (screen: Screen) => void;
    togglePopup: (popup: PopupType | null) => void;
}

const IntroductionSection: FC<IIntroductionSectionProps> = ({ fields, goToScreen, togglePopup }) => {
    const { redirectToViewBookingPage, isAssistedTravelRequestsFailedToLoad } = useStore((stores: IHolidaysStores) => ({
        redirectToViewBookingPage: stores.routerStore.redirectToViewBookingPage,
        isAssistedTravelRequestsFailedToLoad: stores.viewBookingStore.isAssistedTravelRequestsFailedToLoad,
    }));

    const onContactUsClick = createOnContactUsClick(togglePopup);

    const {
        PrimaryButtonLabel,
        PrimaryButtonScreenReaderText,
        SecondaryButtonLabel,
        SecondaryButtonScreenReaderText,
        IntroductionText,
    } = fields;

    const onGoToNextSection = (): void => {
        goToScreen(Screen.CustomerSelection);
    };

    return (
        <>
            <RichTextWithLinks
                className={styles.introduction}
                field={IntroductionText}
                onLinkClick={onContactUsClick}
                enableClickEventForEmptyLinks
            />
            <div className={styles.btnContainer}>
                <Button
                    isText
                    onClick={(): void => redirectToViewBookingPage()}
                    className={styles.btn}
                    aria-label={SecondaryButtonScreenReaderText?.value}
                    data-tid='view-booking-button'
                >
                    {SecondaryButtonLabel?.value}
                </Button>
                <Button
                    isMedium
                    disabled={isAssistedTravelRequestsFailedToLoad}
                    onClick={onGoToNextSection}
                    className={styles.btn}
                    aria-label={PrimaryButtonScreenReaderText?.value}
                    data-tid='next-section-button'
                >
                    {PrimaryButtonLabel?.value}
                </Button>
            </div>
        </>
    );
};

export default IntroductionSection;
