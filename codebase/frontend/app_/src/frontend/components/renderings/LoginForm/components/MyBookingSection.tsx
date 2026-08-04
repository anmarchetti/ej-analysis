import React, { FC, useCallback, useEffect, useMemo, useRef } from 'react';
import { ComponentRendering, Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import validationService from 'frontend/services/validation.service';
import { IHolidaysStores } from 'frontend/store/holidays';
import { autoCompleteDateYear } from 'frontend/utils/date.utils';
import {
    getBookingErrorMessageByCode,
    getBookingErrorMessageTitleByCode,
} from 'frontend/utils/getBookingErrorMessageByCode';
import { GuestBookingInfoFields } from 'models/data/GuestBookingInfo';
import { CalloutOrientation, CalloutPosition } from 'models/enum/Callout';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import Callout from 'frontend/components/common/Callout/Callout';
import ErrorMessage from 'frontend/components/common/ErrorMessage';
import OverlaySpinner from 'frontend/components/common/OverlaySpinner';
import RichTextDictionary from 'frontend/components/common/RichTextDictionary';
import ValidatableDateField from 'frontend/components/common/ValidatableDateField';
import ValidatableField from 'frontend/components/common/ValidatableField/ValidatableField';
import SVGWarningFilled from 'frontend/components/icons-new/WarningFilled';
import styles from 'frontend/components/renderings/LoginForm/LoginForm.module.scss';

export const MyBooking: FC<{ rendering: ComponentRendering }> = ({ rendering }) => {
    const {
        getPhrase,
        getBooking,
        guestBookingInfo,
        errorMessage,
        isLoading,
        changeErrorMessage,
        userData,
        isLoggedIn,
    } = useStore((stores: IHolidaysStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        getBooking: stores.viewBookingStore.getBooking,
        guestBookingInfo: stores.viewBookingStore.guestBookingInfo,
        errorMessage: stores.viewBookingStore.errorMessage,
        isLoading: stores.viewBookingStore.isLoading,
        changeErrorMessage: stores.viewBookingStore.changeErrorMessage,
        userData: stores.userStore.userData,
        isLoggedIn: stores.userStore.isLoggedIn,
    }));

    const depDateRef = useRef<HTMLInputElement>(null);
    const bookingRefRef = useRef<HTMLInputElement>(null);
    const lastNameRef = useRef<HTMLInputElement>(null);

    const onChangeDepartureDate = useCallback(
        (value: string) => {
            changeErrorMessage();
            guestBookingInfo.onChangeField(GuestBookingInfoFields.DepartureDate, value);
        },
        [changeErrorMessage, guestBookingInfo],
    );

    const onBlur = useCallback((): void => {
        onChangeDepartureDate(autoCompleteDateYear(guestBookingInfo.departureDate));
    }, [guestBookingInfo.departureDate, onChangeDepartureDate]);

    const triggerFieldsValidation = () => {
        if (guestBookingInfo.departureDate) {
            depDateRef.current?.focus();
            depDateRef.current?.blur();
        }

        if (guestBookingInfo.bookingReference) {
            bookingRefRef.current?.focus();
            bookingRefRef.current?.blur();
        }

        if (guestBookingInfo.lastName) {
            lastNameRef.current?.focus();
            lastNameRef.current?.blur();
        }
    };

    const errorMessageTitle = useMemo(() => getBookingErrorMessageTitleByCode(errorMessage), [errorMessage]);

    const errorMessageText = useMemo(() => getBookingErrorMessageByCode(errorMessage), [errorMessage]);

    const getMyBooking = () => {
        getBooking();
    };

    useEffect(() => {
        triggerFieldsValidation();

        if (!guestBookingInfo.lastName && isLoggedIn && userData) {
            changeErrorMessage();
            guestBookingInfo.onChangeField(GuestBookingInfoFields.LastName, userData.lastName);
        }

        return () => {
            guestBookingInfo.clearData();
            changeErrorMessage();
        };
    }, []);

    return (
        <>
            <div id='login-form__view-booking' className='login-form__content'>
                <ValidatableDateField
                    onChange={onChangeDepartureDate}
                    value={guestBookingInfo.departureDate}
                    id='departureDate'
                    isVertical
                    label={getPhrase(SitecoreDictionary.LoginLabelsDepartureDate)}
                    errors={validationService.validateField(guestBookingInfo, GuestBookingInfoFields.DepartureDate)}
                    inputContainerClass='form-control__label--focused'
                    shouldMoveCursor
                    autoComplete={false}
                    inputRef={depDateRef}
                    onBlur={onBlur}
                />
                <div className='form-group--with-tooltip'>
                    <ValidatableField
                        onChange={value => {
                            changeErrorMessage();
                            guestBookingInfo.onChangeField(GuestBookingInfoFields.BookingReference, value);
                        }}
                        value={guestBookingInfo.bookingReference}
                        id='bookingReference'
                        isVertical
                        label={getPhrase(SitecoreDictionary.LoginLabelsBookingReference)}
                        errors={validationService.validateField(
                            guestBookingInfo,
                            GuestBookingInfoFields.BookingReference,
                        )}
                        autoComplete={false}
                        inputRef={bookingRefRef}
                        inputMode='numeric'
                    />
                    {!!getPhrase(SitecoreDictionary.LoginLabelsBookingReferenceToolTip) && (
                        <Callout
                            content={<div>{getPhrase(SitecoreDictionary.LoginLabelsBookingReferenceToolTip)}</div>}
                            orientation={CalloutOrientation.Top}
                            position={CalloutPosition.IconLeft}
                            isShownOnHover
                        />
                    )}
                </div>
                <ValidatableField
                    onChange={value => {
                        changeErrorMessage();
                        guestBookingInfo.onChangeField(GuestBookingInfoFields.LastName, value);
                    }}
                    value={guestBookingInfo.lastName}
                    id='lastName'
                    isVertical
                    label={getPhrase(SitecoreDictionary.LoginLabelsSurname)}
                    errors={validationService.validateField(guestBookingInfo, GuestBookingInfoFields.LastName)}
                    autoComplete={false}
                    inputRef={lastNameRef}
                />

                {errorMessage && (
                    <ErrorMessage
                        message={getPhrase(errorMessageTitle)}
                        description={<RichTextDictionary dictionaryKey={errorMessageText} />}
                        errorMessageClass='error-container error'
                        icon={<SVGWarningFilled />}
                    />
                )}

                <div className='row view-booking__button'>
                    <Button
                        onClick={getMyBooking}
                        isLarge
                        disabled={!guestBookingInfo.isValid}
                        dataTid='view-booking-button'
                    >
                        {getPhrase(SitecoreDictionary.LoginButtonsViewBooking)}
                    </Button>
                </div>
                {isLoading && (
                    <OverlaySpinner
                        header={getPhrase(SitecoreDictionary.LoginLabelsSpinnerHeader)}
                        description={getPhrase(SitecoreDictionary.LoginLabelsSpinnerDescription)}
                    />
                )}
            </div>
            <div className={styles.flightAndHotelBlock}>
                <Placeholder name={PlaceholderNames.FlightAndHotelBanner} rendering={rendering} />
            </div>
        </>
    );
};

export default observer(MyBooking);
