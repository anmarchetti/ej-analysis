import React, { useEffect, useRef, useState } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import validationService from 'frontend/services/validation.service';
import { ITradePortalStores } from 'frontend/store/tradePortal';
import { FindBookingInfo, FindBookingInfoFields } from 'models/data/FindBookingInfo';
import { CalloutOrientation, CalloutPosition } from 'models/enum/Callout';
import Button from 'frontend/components/common/Button';
import Callout from 'frontend/components/common/Callout/Callout';
import ValidatableField from 'frontend/components/common/ValidatableField/ValidatableField';
import BookingNotFoundPopup from 'frontend/components/renderings/TradePortalFindBooking/components/BookingNotFoundPopup';
import { ITradePortalFindBookingFields } from 'frontend/components/renderings/TradePortalFindBooking/TradePortalFindBooking';

export interface ISimpleSearchContentProps {
    fields: ITradePortalFindBookingFields;
}

export const SimpleSearchContent = ({ fields }: ISimpleSearchContentProps) => {
    const { getBooking, errorMessage, isLoading } = useStore((stores: ITradePortalStores) => ({
        getBooking: stores.viewBookingStore.getBooking,
        errorMessage: stores.viewBookingStore.errorMessage,
        isLoading: stores.viewBookingStore.isLoading,
    }));

    const [isPopupOpened, setIsPopupOpened] = useState(false);
    const findBookingInfo = useRef(new FindBookingInfo());

    useEffect(() => {
        if (!!errorMessage) {
            setIsPopupOpened(true);
        }
    }, [errorMessage]);

    if (!fields) {
        return null;
    }

    const { SimpleSearchSubtitle, SimpleSearchLabel, SimpleSearchButton, SimpleSearchTooltip } = fields;

    const getFieldErrors = (field: FindBookingInfoFields) => findBookingInfo.current.validateField(field);

    const getIsFieldRequired = (field: FindBookingInfoFields) =>
        validationService.isFieldRequired(findBookingInfo, field as keyof FindBookingInfo);

    const onChangeField = (field: FindBookingInfoFields, value: string) => {
        findBookingInfo.current.onChangeField(field, value);
    };

    const onCloseClick = () => {
        setIsPopupOpened(false);
    };

    const onFindBookingClick = async () => {
        if (findBookingInfo.current.isValid) {
            await getBooking(findBookingInfo.current.bookingReference);
        }
    };

    return (
        <>
            {!!SimpleSearchSubtitle?.value && <Text field={SimpleSearchSubtitle} tag='p' />}
            <div className='simple-search__wrapper'>
                <ValidatableField
                    id={FindBookingInfoFields.BookingReference}
                    onChange={value => onChangeField(FindBookingInfoFields.BookingReference, value)}
                    name={FindBookingInfoFields.BookingReference}
                    value={findBookingInfo.current.bookingReference}
                    label={SimpleSearchLabel.value}
                    errors={getFieldErrors(FindBookingInfoFields.BookingReference)}
                    forceError={false}
                    autoComplete={false}
                    isVertical
                    required={getIsFieldRequired(FindBookingInfoFields.BookingReference)}
                />
                <Callout
                    content={<div>{SimpleSearchTooltip.value}</div>}
                    orientation={CalloutOrientation.Top}
                    position={CalloutPosition.Right}
                    isShownOnHover
                />
                <Button onClick={onFindBookingClick} type='submit' isMedium isLoading={isLoading}>
                    {SimpleSearchButton.value}
                </Button>
            </div>
            {isPopupOpened && <BookingNotFoundPopup fields={fields} onClose={onCloseClick} />}
        </>
    );
};

export default observer(SimpleSearchContent);
