import { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { unLockBodyScroll } from 'frontend/utils/ui.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreField, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import { Popup } from 'frontend/components/common/Popup';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import RouterLink from 'frontend/components/common/RouterLink';

import styles from './CurrentlyOnHolidayPopUp.module.scss';

export interface IOnHolidayProps {
    closeOnHolidayPopup: () => void;
    onHolidayContent: {
        OnHolidayButton: ISitecoreField<ISitecoreLink>;
        OnHolidayDescription: ISitecoreField<string>;
        OnHolidayTitle: ISitecoreField<string>;
    };
}

const CurrentlyOnHolidayPopUp: FC<IOnHolidayProps> = ({ closeOnHolidayPopup, onHolidayContent }) => {
    const { getPhrase } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const { OnHolidayTitle, OnHolidayDescription, OnHolidayButton } = onHolidayContent;

    const redirectToLink = (): void => {
        unLockBodyScroll();
    };
    const renderCloseButton = (): JSX.Element => (
        <>
            {OnHolidayButton?.value?.href && (
                <RouterLink
                    link={OnHolidayButton}
                    className={classNames('btn', styles.button)}
                    dataId='on-holiday-button'
                    onClick={redirectToLink}
                >
                    {OnHolidayButton.value.text}
                </RouterLink>
            )}
            <Button
                className={styles.changeDatesBtn}
                isTransparent
                onClick={closeOnHolidayPopup}
                data-tid='close-on-holiday-popup'
            >
                {getPhrase(SitecoreDictionary.ContactUsButtonsChangeDates)}
            </Button>
        </>
    );

    return (
        <Popup
            id='onholiday-popup'
            isContentCentered
            containerClass={styles.onHolidayPopup}
            footerContent={renderCloseButton()}
            dialogClass={styles.onHolidayPopupDialog}
            footerClass={styles.onHolidayPopupFooter}
        >
            <Text field={OnHolidayTitle} className={styles.onHolidayPopupTitle} tag='h5' data-tid='on-holiday-title' />
            <RichTextWithLinks field={OnHolidayDescription} />
        </Popup>
    );
};

export default CurrentlyOnHolidayPopUp;
