import React, { FC, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { useSubmitSearchParameters } from 'frontend/hooks/useSubmitSearchParameters/useSubmitSearchParameters';
import { SearchBarDropdown } from 'models/enum/SearchBarDropdown';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import Drawer from 'frontend/components/common/Drawer';
import { Popup } from 'frontend/components/common/Popup';
import RoomAllocationGroup from 'frontend/components/common/RoomAllocationGroup/RoomAllocationGroup';
import SearchBarFieldErrorMessage from 'frontend/components/common/SearchBarFieldErrorMessage/SearchBarFieldErrorMessage';

import styles from './PaxMixPopup.module.scss';

export interface IPaxMixPopupFields {
    Subtitle: ISitecoreField<string>;
    Title: ISitecoreField<string>;
}

export type TPaxMixPopupProps = ISitecoreComponent<IPaxMixPopupFields>;

export const PaxMixPopup: FC<TPaxMixPopupProps> = ({ fields }) => {
    const {
        isChildrenAgeValid,
        isTotalGuestsQuantityReached,
        isTotalGuestQuantityValid,
        isWhoParamsValid,
        roomsAllocation,
        getPhrase,
        mergeRoomsIntoOne,
        validateWhoParameters,
        validateChildrenAge,
        grabSearchValuesFromSearchStore,
        setWasPopunderShown,
        isPaxMixPopupEnabled,
        isReferer,
        needOpenSearchPodWhoField,
    } = useStore(stores => ({
        validateWhoParameters: stores.searchStore.validateWhoParameters,
        isChildrenAgeValid: stores.searchStore.searchWho.isChildrenAgeValid,
        isTotalGuestsQuantityReached: stores.searchStore.searchWho.isTotalGuestsQuantityReached,
        isTotalGuestQuantityValid: stores.searchStore.searchWho.isTotalGuestQuantityValid,
        isWhoParamsValid: stores.searchStore.searchWho.isWhoParamsValid,
        roomsAllocation: stores.searchStore.searchWho.roomsAllocation,
        mergeRoomsIntoOne: stores.searchStore.searchWho.mergeRoomsIntoOne,
        validateChildrenAge: stores.searchStore.searchWho.validateChildrenAge,
        getPhrase: stores.layoutStore.getPhrase,
        grabSearchValuesFromSearchStore: stores.bookingStore.grabSearchValuesFromSearchStore,
        setWasPopunderShown: stores.appStore.setWasPopunderShown,
        isPaxMixPopupEnabled: stores.layoutStore.isPaxMixPopupEnabled,
        isReferer: stores.queryParamStore.isReferer,
        needOpenSearchPodWhoField: stores.queryParamStore.needOpenSearchPodWhoField,
    }));

    const [isOpen, setIsOpen] = useState<boolean>(false);

    const { onSubmitSearchParameters } = useSubmitSearchParameters();
    const isMobile = useMobileViewport();

    const onSubmitForm = (event?: React.MouseEvent | React.FormEvent): void => {
        event?.preventDefault();
        const isValid = validateChildrenAge() && !validateWhoParameters();

        if (isValid) {
            setWasPopunderShown(true);
            grabSearchValuesFromSearchStore();
            onSubmitSearchParameters();
            setIsOpen(false);
        }
    };

    const renderContent = (buttonContainerClass?: string): JSX.Element => (
        <form data-tid='pax-mix-popup-form' className={styles.form} onSubmit={onSubmitForm}>
            <Text tag='h2' data-tid='pax-mix-popup-title' className={styles.title} field={fields?.Title} />
            <Text tag='p' data-tid='pax-mix-popup-description' className={styles.subtitle} field={fields?.Subtitle} />

            <SearchBarFieldErrorMessage fieldErrorType={SearchBarDropdown.Who} />

            {roomsAllocation.map((room, index) => (
                <RoomAllocationGroup
                    key={room.id}
                    roomIndex={index}
                    room={room}
                    number={index + 1}
                    isTotalGuestsQuantityReached={isTotalGuestsQuantityReached}
                    isTotalGuestsQuantityValid={isTotalGuestQuantityValid}
                    onTriggerError={() => {}}
                    validateWhoParameters={validateWhoParameters}
                    validateChildrenAge={validateChildrenAge}
                    isChildrenAgeValid={isChildrenAgeValid}
                    hideErrors={false}
                    hideRoomLabel
                    hideChildAgeError
                    isPaxMixPopup
                />
            ))}
            <div className={buttonContainerClass}>
                <Button isMedium type='submit' hasDisabledStyles={!isWhoParamsValid}>
                    {getPhrase(SitecoreDictionary.GlobalsButtonsSearch)}
                </Button>
            </div>
        </form>
    );

    useEffect(() => {
        // Open Pax Mix Popup if we are coming from easyJet.com (isReferer) and need set children ages (hasOpenWhoFieldQueryParam)
        if (isPaxMixPopupEnabled && isReferer && needOpenSearchPodWhoField()) {
            mergeRoomsIntoOne();
            setIsOpen(true);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            validateChildrenAge();
        }
    }, [isOpen]);

    if (!fields || !isOpen) {
        return null;
    }

    /*  Render the Pax Mix popup drawer only if there are parameters in the URL
        Pros: there’s no animation and no need to keep it permanently hidden */
    if (isMobile)
        return (
            <Drawer open={isOpen} className={styles.paxMixPopup}>
                {renderContent('drawer__actions')}
            </Drawer>
        );

    return createPortal(
        <Popup aria-label={fields?.Title.value} containerClass={styles.paxMixPopup}>
            {renderContent('popup__footer')}
        </Popup>,
        document.body,
    );
};

export default observer(PaxMixPopup);
