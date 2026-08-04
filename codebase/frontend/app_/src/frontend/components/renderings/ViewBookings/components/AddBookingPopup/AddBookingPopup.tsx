import React, { FC, useCallback, useEffect } from 'react';
import { ComponentRendering, Placeholder, Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { inject, observer } from 'mobx-react';

import validationService from 'frontend/services/validation.service';
import { IHolidaysStores } from 'frontend/store/holidays';
import { autoCompleteDateYear } from 'frontend/utils/date.utils';
import { getBookingErrorMessageByCode } from 'frontend/utils/getBookingErrorMessageByCode';
import { containsSubstring } from 'frontend/utils/string.utils';
import { GuestBookingInfo, GuestBookingInfoFields } from 'models/data/GuestBookingInfo';
import { ILoginInfo } from 'models/data/ILoginInfo';
import { BookingErrorCodes } from 'models/enum/BookingStatus';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SitePath from 'models/enum/SitePath';
import { IComponentWithDictionary } from 'models/sitecore/generic/IComponentWithDictionary';
import Button from 'frontend/components/common/Button';
import ErrorMessage from 'frontend/components/common/ErrorMessage';
import { Popup } from 'frontend/components/common/Popup';
import RichTextDictionary from 'frontend/components/common/RichTextDictionary';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import ValidatableDateField from 'frontend/components/common/ValidatableDateField';
import ValidatableField from 'frontend/components/common/ValidatableField/ValidatableField';
import SvgWarningFilled from 'frontend/components/icons-new/WarningFilled';
import { IViewBookingsSitecoreFields } from 'frontend/components/renderings/ViewBookings/ViewBookings';

import styles from './AddBookingPopup.module.scss';
interface IAddBookingProps extends IComponentWithDictionary {
    addBooking: () => void;
    addBookingInfo: GuestBookingInfo;
    clearError: () => void;
    error: Nullable<BookingErrorCodes>;
    fields: IViewBookingsSitecoreFields | undefined;
    findAddedBooking: () => void;
    hasBookingAdded: boolean;
    isAddingBooking: boolean;
    isLoggedIn: boolean;
    onClose: () => void;
    rendering: ComponentRendering;
    userData: Nullable<ILoginInfo>;
}

/**
 * Show add booking form inside a popup.
 */
export const AddBookingPopup: FC<IAddBookingProps> = props => {
    const {
        error,
        addBookingInfo,
        isAddingBooking,
        addBooking,
        onClose,
        clearError,
        getPhrase,
        hasBookingAdded,
        fields,
        rendering,
        userData,
        isLoggedIn,
    } = props;

    useEffect(() => {
        /* when user is LoggedIn and we don't have lastName in bookingInfo need change lastName from userDate */
        if (!addBookingInfo.lastName && isLoggedIn && userData) {
            onChangeLastName(userData.lastName);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /**
     * Update `GuestBookingInfo` field and also clears errors, so user will not see an error when he/she start editing form
     */

    const onChangeFieldCallback = useCallback(
        (field: GuestBookingInfoFields, value: string): void => {
            clearError();
            addBookingInfo.onChangeField(field, value);
        },
        [clearError, addBookingInfo],
    );

    const onChangeDepartureDate = useCallback(
        (value: string): void => {
            onChangeFieldCallback(GuestBookingInfoFields.DepartureDate, value);
        },
        [onChangeFieldCallback],
    );

    const onChangeBookingReference = useCallback(
        (value: string): void => {
            onChangeFieldCallback(GuestBookingInfoFields.BookingReference, value);
        },
        [onChangeFieldCallback],
    );

    const onChangeLastName = useCallback(
        (value: string): void => {
            onChangeFieldCallback(GuestBookingInfoFields.LastName, value);
        },
        [onChangeFieldCallback],
    );

    const onBlur = useCallback((): void => {
        onChangeDepartureDate(autoCompleteDateYear(addBookingInfo.departureDate));
    }, [addBookingInfo.departureDate, onChangeDepartureDate]);

    const onErrorLinkClick = (event): void => {
        // If it's login page url, go to 'Find booking' tab that filled with addBookingInfo
        const url = event.target ? event.target.dataset?.path ?? event.target.href : null;

        if (url && containsSubstring(url, SitePath.Login)) {
            props.findAddedBooking();
        }

        props.onClose();
    };

    const getErrorDescription = (): JSX.Element => {
        if (error === BookingErrorCodes.AssignAgentBooking && fields?.TradeBookingAddingError?.value) {
            return (
                <RichTextWithLinks field={fields.TradeBookingAddingError} tag='span' onLinkClick={onErrorLinkClick} />
            );
        }

        return <RichTextDictionary dictionaryKey={getBookingErrorMessageByCode(error)} />;
    };

    return (
        <Popup
            title={getPhrase(SitecoreDictionary.LoginLabelsViewBookingTitle)}
            containerClass='add-booking-popup'
            showCloseButton
            onClose={onClose}
        >
            {hasBookingAdded ? (
                <>
                    <div className='additional-text text-center' />
                    <Text tag={'div'} className='additional-text text-center' field={fields?.BookingAddedSuccess} />
                    <div className='text-center'>
                        <Button onClick={onClose} isMedium className='mt-3' dataTid='added-booking-popup-button'>
                            {getPhrase(SitecoreDictionary.GlobalsButtonsOK)}
                        </Button>
                    </div>
                </>
            ) : (
                <>
                    <div className='additional-text text-center'>
                        {getPhrase(SitecoreDictionary.LoginLabelsViewBookingDescription)}
                    </div>
                    <ValidatableDateField
                        onChange={onChangeDepartureDate}
                        value={addBookingInfo.departureDate}
                        id='departureDate'
                        isVertical
                        label={getPhrase(SitecoreDictionary.LoginLabelsDepartureDate)}
                        errors={validationService.validateField(addBookingInfo, GuestBookingInfoFields.DepartureDate)}
                        inputContainerClass='form-control__label--focused'
                        shouldMoveCursor
                        autoComplete={false}
                        onBlur={onBlur}
                    />
                    <ValidatableField
                        onChange={onChangeBookingReference}
                        value={addBookingInfo.bookingReference}
                        id='bookingReference'
                        isVertical
                        label={getPhrase(SitecoreDictionary.LoginLabelsBookingReference)}
                        errors={validationService.validateField(
                            addBookingInfo,
                            GuestBookingInfoFields.BookingReference,
                        )}
                        autoComplete={false}
                    />
                    <ValidatableField
                        onChange={onChangeLastName}
                        value={addBookingInfo.lastName}
                        id='lastName'
                        isVertical
                        label={getPhrase(SitecoreDictionary.LoginLabelsSurname)}
                        errors={validationService.validateField(addBookingInfo, GuestBookingInfoFields.LastName)}
                        autoComplete={false}
                    />
                    {error && (
                        <ErrorMessage
                            message={getPhrase(SitecoreDictionary.LoginLabelsSomethingWentWrong)}
                            description={getErrorDescription()}
                            errorMessageClass='error-container error'
                            icon={<SvgWarningFilled />}
                        />
                    )}
                    <div className='text-center'>
                        <Button
                            onClick={addBooking}
                            isMedium
                            disabled={!addBookingInfo.isValid || !!error}
                            isLoading={isAddingBooking}
                            className='mt-3'
                            dataTid='add-booking-popup-button'
                        >
                            {getPhrase(SitecoreDictionary.ViewBookingsButtonsAddBooking)}
                        </Button>
                    </div>
                    <div className={styles.flightAndHotelBlock}>
                        <Placeholder name={PlaceholderNames.FlightAndHotelBanner} rendering={rendering} />
                    </div>
                </>
            )}
        </Popup>
    );
};

export default inject((stores: IHolidaysStores) => ({
    addBookingInfo: stores.addBookingStore.addBookingInfo,
    isAddingBooking: stores.addBookingStore.isAddingBooking,
    addBooking: stores.addBookingStore.addBooking,
    getPhrase: stores.layoutStore.getPhrase,
    error: stores.addBookingStore.error,
    clearError: stores.addBookingStore.clearError,
    hasBookingAdded: stores.addBookingStore.hasBookingAdded,
    userData: stores.userStore.userData,
    isLoggedIn: stores.userStore.isLoggedIn,
    findAddedBooking: stores.addBookingStore.findAddedBooking,
}))(observer(AddBookingPopup));
