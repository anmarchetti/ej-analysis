import React, { FC } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores, isHolidayStore } from 'frontend/store/holidays';
import { debounce } from 'frontend/utils/debounce';
import { getBookingErrorMessageByCode } from 'frontend/utils/getBookingErrorMessageByCode';
import { ViewBookingTrackingEvents } from 'frontend/utils/tracking/viewBooking.utils';
import { BookingErrorCodes } from 'models/enum/BookingStatus';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import Checkbox from 'frontend/components/common/Checkbox';
import ErrorMessage from 'frontend/components/common/ErrorMessage';
import RichTextDictionary from 'frontend/components/common/RichTextDictionary';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import ViewBookingComponentWrapper from 'frontend/components/common/ViewBookingComponentWrapper/ViewBookingComponentWrapper';
import SVGWarningFilled from 'frontend/components/icons-new/WarningFilled';

interface IBookingPrivacyFields {
    CheckboxLabelLeft: ISitecoreField<string>;
    CheckboxLabelRight: ISitecoreField<string>;
    DebounceTimeout: ISitecoreField<number>;
    Description: ISitecoreField<string>;
    Heading: ISitecoreField<string>;
    Icon: ISitecoreField<ISitecoreImage>;
    Title: ISitecoreField<string>;
}

type TBookingPrivacyProps = ISitecoreComponent<IBookingPrivacyFields>;

export const BookingPrivacy: FC<TBookingPrivacyProps> = props => {
    const {
        getPhrase,
        booking,
        toggleBookingPrivacy,
        errorMessage,
        changeErrorMessage,
        isBookingCanceled,
        isLoadingBookingPrivacy,
        fireViewBookingEvent,
    } = useStore((stores: IHolidaysStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        booking: stores.viewBookingStore.booking,
        toggleBookingPrivacy: stores.viewBookingStore.toggleBookingPrivacy,
        errorMessage: stores.viewBookingStore.errorMessage,
        isLoadingBookingPrivacy: stores.viewBookingStore.isLoadingBookingPrivacy,
        changeErrorMessage: stores.viewBookingStore.changeErrorMessage,
        isBookingCanceled: stores.viewBookingStore.isBookingCanceled,
        fireViewBookingEvent: isHolidayStore(stores) ? stores.trackingStore.fireViewBookingEvent : null,
    }));

    if (!props.fields) {
        return null;
    }

    const { Heading, Title, Description, Icon, CheckboxLabelRight, CheckboxLabelLeft, DebounceTimeout } =
        props.fields || {};

    const isLeadLoggedIn = booking?.isLoggedInAsLeadPassenger;

    const debouncedTogglePrivacy = debounce(toggleBookingPrivacy, +(DebounceTimeout?.value || 0));

    const onSwitch = (e: React.ChangeEvent<HTMLInputElement>): void => {
        if (!isLoadingBookingPrivacy) {
            //value inverted for correct label display
            const value = !e.target.checked;
            changeErrorMessage();
            debouncedTogglePrivacy(value);
            fireViewBookingEvent?.(
                ViewBookingTrackingEvents.ReadOnlyAccess,
                `Read Only-${e.target.checked ? 'On' : 'Off'}`,
            );
        }
    };

    return isLeadLoggedIn && !isBookingCanceled ? (
        <div className='booking-privacy'>
            {!!Heading?.value && <h2 className='booking-privacy__heading'>{Heading.value}</h2>}
            <ViewBookingComponentWrapper Title={Title} Icon={Icon}>
                <div className='booking-privacy__info'>
                    {!!Description?.value && (
                        <RichTextWithLinks field={Description} tag='p' data-tid='p' className='booking-privacy__desc' />
                    )}
                    <Checkbox
                        toggle
                        onChange={onSwitch}
                        label={CheckboxLabelLeft?.value || ''}
                        label2={CheckboxLabelRight?.value || ''}
                        //value inverted for correct label displaying
                        checked={!booking?.isPrivate}
                    />
                </div>
            </ViewBookingComponentWrapper>
            {errorMessage === BookingErrorCodes.Privacy && (
                <ErrorMessage
                    message={getPhrase(SitecoreDictionary.ViewBookingErrorMessagesNotAbleToUpdate)}
                    description={<RichTextDictionary dictionaryKey={getBookingErrorMessageByCode(errorMessage)} />}
                    errorMessageClass='error-container error'
                    icon={<SVGWarningFilled />}
                />
            )}
        </div>
    ) : null;
};

export default observer(BookingPrivacy);
