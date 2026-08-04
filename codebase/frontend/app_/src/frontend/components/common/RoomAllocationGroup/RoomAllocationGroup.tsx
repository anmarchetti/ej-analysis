import React, { FC, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import { useMoreThenTabletViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { getTextFromHtml } from 'frontend/utils/string.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { SearchPodValidationFields } from 'models/data/tracking/SearchPodEvent';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SiteSettings from 'models/enum/SiteSettings';
import { RoomAllocation } from 'models/RoomAllocation';
import Button from 'frontend/components/common/Button';
import IconChild from 'frontend/components/icons/Child';
import IconInfant from 'frontend/components/icons/Infant';
import SvgAdults from 'frontend/components/icons-new/Adults';

import ChildrenAgesSelector from './components/ChildrenAgesSelector/ChildrenAgesSelector';
import RoomAllocationGuestsNumber from './components/RoomAllocationGuestsNumber/RoomAllocationGuestsNumber';
import { getAdultsError, getAdultsErrorTrackValidationField } from './RoomAllocationGroup.utils';

import styles from './RoomAllocationGroup.module.scss';

export const ROOM_ALLOCATION_GROUP_ID = 'room-allocation-group';

export interface IRoomAllocationProps {
    hideErrors: boolean;
    isChildrenAgeValid: boolean;
    isTotalGuestsQuantityReached: boolean; // Validating prop
    isTotalGuestsQuantityValid: boolean; // Validating prop
    number: number;
    onTriggerError: (roomIndex: number) => void;
    room: RoomAllocation;
    roomIndex: number;
    validateChildrenAge: () => boolean;
    validateWhoParameters: () => void;
    hideChildAgeError?: boolean;
    hideRoomLabel?: boolean;
    isGroupBooking?: boolean;
    isPaxMixPopup?: boolean;
    isSearchBar?: boolean;
    onRemove?: (id: number) => void;
}

export enum GuestErrorPlace {
    Adults = 'Adults',
    Children = 'Children',
    Infants = 'Infants',
}

enum InfantErrorPlace {
    Adult = 'Adult',
    Infant = 'Infant',
}

const RoomAllocationGroup: FC<IRoomAllocationProps> = ({
    hideErrors,
    isChildrenAgeValid,
    isTotalGuestsQuantityReached,
    isTotalGuestsQuantityValid,
    number,
    onTriggerError,
    room,
    roomIndex,
    validateChildrenAge,
    validateWhoParameters,
    hideChildAgeError,
    hideRoomLabel,
    isGroupBooking,
    isPaxMixPopup,
    isSearchBar,
    onRemove,
}) => {
    const {
        trackValidation,
        isTradePortal,
        getPhrase,
        getSettingAsNumber,
        setMaxGuestNumberError,
        setMaxGuestNumberPerRoomError,
        validateGuestQuantityPerRoom,
    } = useStore((stores: TStores) => ({
        trackValidation: stores.trackingStore.trackValidation,
        isTradePortal: stores.layoutStore.isTradePortal,
        getPhrase: stores.layoutStore.getPhrase,
        getSettingAsNumber: stores.layoutStore.getSettingAsNumber,
        setMaxGuestNumberError: stores.searchStore.searchWho.setMaxGuestNumberError,
        setMaxGuestNumberPerRoomError: stores.searchStore.searchWho.setMaxGuestNumberPerRoomError,
        validateGuestQuantityPerRoom: stores.searchStore.searchWho.validateGuestQuantityPerRoom,
    }));

    const childrenAgesSelectorRef = useRef<HTMLDivElement | null>(null);

    const [maxGuestsErrorPlace, setMaxGuestsErrorPlace] = useState<GuestErrorPlace | null>(null);
    const [isPerRoomMaxError, setIsPerRoomMaxError] = useState<boolean>(false);
    const [isMinimumNumberOfAdults, setIsMinimumNumberOfAdults] = useState<boolean>(false);
    const [infantsPerAdultErrorPlace, setInfantsPerAdultErrorPlace] = useState<InfantErrorPlace | null>(null);

    const roomLabel = Tokenizer.replaceToken(
        getPhrase(SitecoreDictionary.RoomTypesLabelsRoom),
        Tokens.Number,
        number.toString(),
    );

    const isDesktop = useMoreThenTabletViewport();

    const processMaxGuestError = (guestErrorPlace: GuestErrorPlace): void => {
        let trackingErrorMessageKey = SitecoreDictionary.RoomAllocationErrorsMaximumNumberOfGuestsHTML;

        if (isPerRoomMaxError && !isGroupBooking) {
            setMaxGuestNumberPerRoomError();
            trackingErrorMessageKey = SitecoreDictionary.RoomAllocationErrorsMaxNumberOfGuestsPerRoom;
        } else {
            setMaxGuestNumberError();
        }

        const trackingField = isSearchBar ? SearchPodValidationFields.MaxPAX : guestErrorPlace;
        const trackingErrorMessage = getTextFromHtml(getPhrase(trackingErrorMessageKey));

        trackValidation(trackingField, trackingErrorMessage);
        setMaxGuestsErrorPlace(null);
    };

    const adultsErrorsMsgs = useMemo(() => {
        if (maxGuestsErrorPlace === GuestErrorPlace.Adults) {
            processMaxGuestError(GuestErrorPlace.Adults);

            return [];
        }

        const error = getAdultsError(isMinimumNumberOfAdults, infantsPerAdultErrorPlace === InfantErrorPlace.Adult);

        if (!error) {
            return [];
        }

        const phrase = getPhrase(error);
        const trackValidationField = getAdultsErrorTrackValidationField(
            isMinimumNumberOfAdults,
            infantsPerAdultErrorPlace === InfantErrorPlace.Adult,
            !!isSearchBar,
        );
        trackValidation(trackValidationField, phrase);

        return [phrase];
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [maxGuestsErrorPlace, isPerRoomMaxError, isMinimumNumberOfAdults, infantsPerAdultErrorPlace]);

    const childrenErrorsMsgs = useMemo(() => {
        if (maxGuestsErrorPlace === GuestErrorPlace.Children) {
            processMaxGuestError(GuestErrorPlace.Children);
        }

        return [];
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [maxGuestsErrorPlace, isPerRoomMaxError]);

    const infantsErrorsMsgs = useMemo(() => {
        if (maxGuestsErrorPlace === GuestErrorPlace.Infants) {
            processMaxGuestError(GuestErrorPlace.Infants);

            return [];
        }

        if (infantsPerAdultErrorPlace === InfantErrorPlace.Infant) {
            const phrase = getPhrase(SitecoreDictionary.RoomAllocationErrorsMaximumNumberOfInfantGuestsPerAdultGuest);

            const trackValidationField = isSearchBar
                ? SearchPodValidationFields.MaxInfantsPerAdult
                : GuestErrorPlace.Infants;
            trackValidation(trackValidationField, phrase);

            return [phrase];
        }

        return [];
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [maxGuestsErrorPlace, isPerRoomMaxError, infantsPerAdultErrorPlace]);

    const isTotalGuestQuantityValueInvalidOrReached = isTotalGuestsQuantityReached || !isTotalGuestsQuantityValid;
    const isGuestQuantityPerRoomInvalid = validateGuestQuantityPerRoom(room) && !isGroupBooking;
    const isAnyGuestLimitReached = isTotalGuestQuantityValueInvalidOrReached || isGuestQuantityPerRoomInvalid;
    const maxGuestNumberInGroupBookingRoom = getSettingAsNumber(SiteSettings.MaxGuestNumberInGroupBookingRoom);
    /**
     * Checks if the maximum number of adults is reached.
     * This is only for group booking on TradePortal, the setting doesn't exist on Holidays
     */
    const isMaximumNumberOfAdultsReached = room.adults.length >= maxGuestNumberInGroupBookingRoom;

    /**
     * Checks if the maximum number of children is reached.
     * This is only for group booking on TradePortal, the setting doesn't exist on Holidays
     */
    const isMaximumNumberOfChildrenReached = room.children.length >= maxGuestNumberInGroupBookingRoom;

    const triggerError = (): void => {
        onTriggerError(roomIndex);
    };

    const triggerGuestLimitError = (guestErrorPlace: GuestErrorPlace, isTotalMaxError: boolean): void => {
        setIsPerRoomMaxError(!isTotalMaxError);
        setMaxGuestsErrorPlace(guestErrorPlace);
        triggerError();
    };

    const resetErrors = (shouldValidateWhoParams: boolean): void => {
        const focusedButton = document.activeElement;
        onTriggerError(-1);
        shouldValidateWhoParams && validateWhoParameters();
        !isChildrenAgeValid && validateChildrenAge();

        setMaxGuestsErrorPlace(null);
        setIsPerRoomMaxError(false);
        setInfantsPerAdultErrorPlace(null);
        setIsMinimumNumberOfAdults(false);

        if ((shouldValidateWhoParams || !isChildrenAgeValid) && focusedButton instanceof HTMLElement && isDesktop) {
            focusedButton.focus();
        }
    };

    const onAddAdult = (): void => {
        resetErrors(maxGuestsErrorPlace !== GuestErrorPlace.Adults);

        const isTotalMaxError = isTotalGuestQuantityValueInvalidOrReached || isMaximumNumberOfAdultsReached;

        if (isTotalMaxError || isGuestQuantityPerRoomInvalid) {
            triggerGuestLimitError(GuestErrorPlace.Adults, isTotalMaxError);

            return;
        }

        room.addAdult(isTradePortal);
    };

    const onRemoveAdult = (): void => {
        if (!room.cantRemoveAdult) {
            room.removeAdult();
            resetErrors(true);

            return;
        }

        if (room.isMinimumNumberOfAdults) {
            setIsMinimumNumberOfAdults(true);
        } else if (room.isMinimumNumberOfAdultsForInfants) {
            setInfantsPerAdultErrorPlace(InfantErrorPlace.Adult);
        }

        triggerError();
    };

    const onAddChild = (): void => {
        resetErrors(maxGuestsErrorPlace !== GuestErrorPlace.Children);

        if (isTotalGuestQuantityValueInvalidOrReached || isGuestQuantityPerRoomInvalid) {
            triggerGuestLimitError(GuestErrorPlace.Children, isTotalGuestQuantityValueInvalidOrReached);

            return;
        }

        if (isMaximumNumberOfChildrenReached) {
            triggerError();

            return;
        }

        room.addChild();
    };

    const onRemoveChild = (): void => {
        room.removeChild();
        resetErrors(true);
    };

    const onAddInfant = (): void => {
        resetErrors(maxGuestsErrorPlace !== GuestErrorPlace.Infants);

        if (isTotalGuestQuantityValueInvalidOrReached || isGuestQuantityPerRoomInvalid) {
            triggerGuestLimitError(GuestErrorPlace.Infants, isTotalGuestQuantityValueInvalidOrReached);

            return;
        }

        if (room.isMaximumNumberOfInfantsForAdults) {
            setInfantsPerAdultErrorPlace(InfantErrorPlace.Infant);

            triggerError();

            return;
        }

        room.addInfant();
    };

    const onRemoveInfant = (): void => {
        room.removeInfant();
        resetErrors(true);
    };

    const onRemoveRoom = (): void => {
        onRemove?.(room.id);
        validateWhoParameters();
    };

    return (
        <div
            data-tid='room-allocation-group'
            id={ROOM_ALLOCATION_GROUP_ID}
            className={classNames(
                styles.room,
                isPaxMixPopup && styles.paxMixPopup,
                isGroupBooking && styles.groupBooking,
            )}
        >
            {!hideRoomLabel && (
                <div className={classNames(styles.roomNumber)}>
                    <span>{roomLabel}</span>

                    <Button isTransparent className={styles.removeRoom} onClick={onRemoveRoom} dataTid='remove-room'>
                        {getPhrase(SitecoreDictionary.GlobalsButtonsRemove)}
                    </Button>
                </div>
            )}

            <div className={styles.guests}>
                <RoomAllocationGuestsNumber
                    id='guest-picker-adults'
                    icon={
                        <SvgAdults
                            className={classNames(
                                styles.icon,
                                adultsErrorsMsgs.length > 0 && !hideErrors && styles.redIcon,
                            )}
                        />
                    }
                    title={getPhrase(SitecoreDictionary.RoomAllocationLabelsAdults)}
                    number={room.adults.length}
                    onAdd={onAddAdult}
                    onRemove={onRemoveAdult}
                    isAddDisabled={isAnyGuestLimitReached || isMaximumNumberOfAdultsReached}
                    isRemoveDisabled={room.cantRemoveAdult}
                    errorMsgs={adultsErrorsMsgs}
                    hideErrors={hideErrors}
                />

                <RoomAllocationGuestsNumber
                    id='guest-picker-children'
                    icon={
                        <IconChild
                            className={classNames(
                                styles.icon,
                                childrenErrorsMsgs.length > 0 && !hideErrors && styles.redIcon,
                            )}
                        />
                    }
                    title={getPhrase(SitecoreDictionary.RoomAllocationLabelsChildren)}
                    number={room.children.length}
                    onAdd={onAddChild}
                    onRemove={onRemoveChild}
                    isAddDisabled={isAnyGuestLimitReached || isMaximumNumberOfChildrenReached}
                    isRemoveDisabled={room.cantRemoveChild}
                    errorMsgs={childrenErrorsMsgs}
                    hideErrors={hideErrors}
                    selectorRef={childrenAgesSelectorRef}
                />

                <ChildrenAgesSelector
                    hideError={hideChildAgeError}
                    childrenGuests={room.children}
                    isChildrenAgeValid={isChildrenAgeValid}
                    validateChildrenAge={validateChildrenAge}
                    isGroupBooking={isGroupBooking}
                    isSearchBar={isSearchBar}
                />

                <RoomAllocationGuestsNumber
                    id='guest-picker-infants'
                    icon={
                        <IconInfant
                            className={classNames(
                                styles.icon,
                                infantsErrorsMsgs.length > 0 && !hideErrors && styles.redIcon,
                            )}
                        />
                    }
                    title={getPhrase(SitecoreDictionary.RoomAllocationLabelsInfants)}
                    number={room.infants.length}
                    onAdd={onAddInfant}
                    onRemove={onRemoveInfant}
                    isAddDisabled={isAnyGuestLimitReached || room.cantAddInfant}
                    isRemoveDisabled={room.cantRemoveInfant}
                    errorMsgs={infantsErrorsMsgs}
                    hideErrors={hideErrors}
                />
            </div>
        </div>
    );
};

export default observer(RoomAllocationGroup);
