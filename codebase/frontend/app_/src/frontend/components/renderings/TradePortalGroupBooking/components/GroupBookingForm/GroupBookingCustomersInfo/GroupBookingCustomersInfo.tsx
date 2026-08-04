import React, { useEffect } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import { cmsUrls } from 'code/endpoints';
import useStore from 'frontend/hooks/useStore';
import {
    getAdultsCountPhrase,
    getChildrenCountPhrase,
    getInfantsCountPhrase,
} from 'frontend/utils/search/search.utils';
import { ISelectOption } from 'models/data/ISelectOption';
import { SearchBarDropdown } from 'models/enum/SearchBarDropdown';
import SiteSettings from 'models/enum/SiteSettings';
import ErrorMessage from 'frontend/components/common/ErrorMessage';
import ImageWithFilter, { SVGFilterMatrix } from 'frontend/components/common/ImageWithFilter/ImageWithFilter';
import NumberOfRoomSelector from 'frontend/components/common/NumberOfRoomSelector/NumberOfRoomSelector';
import RoomAllocationGroup from 'frontend/components/common/RoomAllocationGroup/RoomAllocationGroup';
import SearchBarFieldErrorMessage from 'frontend/components/common/SearchBarFieldErrorMessage/SearchBarFieldErrorMessage';
import SvgWarningFilled from 'frontend/components/icons-new/WarningFilled';
import { useGroupBookingStore } from 'frontend/components/renderings/TradePortalGroupBooking/store/createStore';
import { ITradePortalGroupBookingFields } from 'frontend/components/renderings/TradePortalGroupBooking/TradePortalGroupBooking';

import styles from './GroupBookingCustomersInfo.module.scss';

interface IGroupBookingAgentInformationProps {
    fields: ITradePortalGroupBookingFields;
}

const GroupBookingCustomersInfo = ({ fields }: IGroupBookingAgentInformationProps) => {
    const { groupBooking, forceErrors } = useGroupBookingStore();

    const { getPhrase, getSetting, clearErrorMessage } = useStore(({ layoutStore, searchStore }) => ({
        getPhrase: layoutStore.getPhrase,
        getSetting: layoutStore.getSetting,
        clearErrorMessage: searchStore.clearErrorMessage,
    }));

    useEffect(() => {
        groupBooking?.initializeRooms();
    }, []);

    if (!groupBooking || !fields) {
        return null;
    }

    const {
        CustomersInfoTitle,
        NumberOfRoomsLabel,
        CustomersInfoDescription,
        CustomersInfoTotal,
        TotalCountErrorTitle,
        TotalCountErrorDescription,
    } = fields;

    const getIconBySiteSetting = (setting: SiteSettings) => {
        const iconUrl = getSetting(setting);

        if (!iconUrl) {
            return null;
        }

        return (
            <ImageWithFilter
                imageSrc={cmsUrls.media(iconUrl)}
                filterMatrix={SVGFilterMatrix.Orange}
                className={styles.icon}
            />
        );
    };

    const validateWhoParameters = (): boolean => {
        clearErrorMessage();

        return false;
    };

    const changeRoomsCount = (selectedOption: ISelectOption): void => {
        groupBooking.changeRoomsCount(selectedOption);
        clearErrorMessage();
    };

    return (
        <div className={styles.customersInfo} data-tid='group-booking-customers-info'>
            {CustomersInfoTitle?.value && (
                <Text
                    data-tid='customers-info-title'
                    field={CustomersInfoTitle}
                    className={styles.formSectionTitle}
                    tag='p'
                />
            )}
            <div className='search-bar-box'>
                <div className={styles.selectorWrapper}>
                    <NumberOfRoomSelector
                        placeholder={NumberOfRoomsLabel?.value ?? ''}
                        numberOfRooms={groupBooking.rooms.length}
                        onChange={changeRoomsCount}
                        isAutoAllocation={groupBooking.isAutoAllocation}
                        isGroup
                    />
                </div>

                {forceErrors && !groupBooking.isMinCountReached && (
                    <ErrorMessage
                        message={TotalCountErrorTitle?.value}
                        description={TotalCountErrorDescription?.value}
                        errorMessageClass={styles.error}
                        icon={
                            <i className='error-message__icon'>
                                <SvgWarningFilled />
                            </i>
                        }
                        IsDesc
                        isSmallText
                    />
                )}

                {CustomersInfoDescription?.value && (
                    <Text data-tid='customers-info-description' field={CustomersInfoDescription} tag='p' />
                )}

                <div className='popup-search-pod popup-search-pod__promo'>
                    <SearchBarFieldErrorMessage
                        fieldErrorType={SearchBarDropdown.Who}
                        errorClassName={styles.errorMessage}
                    />

                    {groupBooking.rooms.map((room, index) => (
                        <RoomAllocationGroup
                            key={room.id}
                            roomIndex={index}
                            room={room}
                            number={index + 1}
                            onRemove={groupBooking.removeRoom}
                            isTotalGuestsQuantityReached={false}
                            isTotalGuestsQuantityValid={true}
                            onTriggerError={() => null}
                            validateWhoParameters={validateWhoParameters}
                            validateChildrenAge={groupBooking.validateChildrenAge}
                            isChildrenAgeValid={groupBooking.validateChildrenAge()}
                            isGroupBooking
                            hideErrors={false}
                        />
                    ))}
                </div>
            </div>
            <div className={styles.total}>
                {CustomersInfoTotal?.value && (
                    <Text
                        data-tid='customers-info-total'
                        field={CustomersInfoTotal}
                        className={styles.formSectionTitle}
                        tag='p'
                    />
                )}
                <div className={styles.quantities}>
                    <span className={styles.quantity} data-tid='group-booking-adult-quantity'>
                        {getIconBySiteSetting(SiteSettings.AdultsIcon)}
                        {getAdultsCountPhrase(groupBooking.adultsQuantity, getPhrase)}
                    </span>
                    {!!groupBooking.childrenQuantity && (
                        <span className={styles.quantity} data-tid='group-booking-children-quantity'>
                            {getIconBySiteSetting(SiteSettings.ChildIcon)}
                            {getChildrenCountPhrase(groupBooking.childrenQuantity, getPhrase)}
                        </span>
                    )}
                    {!!groupBooking.infantsQuantity && (
                        <span className={styles.quantity} data-tid='group-booking-infants-quantity'>
                            {getIconBySiteSetting(SiteSettings.InfantIcon)}
                            {getInfantsCountPhrase(groupBooking.infantsQuantity, getPhrase)}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default observer(GroupBookingCustomersInfo);
