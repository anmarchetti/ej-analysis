import React, { useState } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';
import dynamic from 'next/dynamic';

import useStore from 'frontend/hooks/useStore';
import { ITradePortalStores } from 'frontend/store/tradePortal';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { GENERIC_CUSTOM_PARAMS_EMPTY } from 'models/enum/tracking/GenericEventParams';
import Button from 'frontend/components/common/Button';
import { IFeesPopupFields } from 'frontend/components/renderings/FeesPopup/FeesPopup';
import { FEES_GENERIC_EVENT_PARAMS } from 'frontend/components/renderings/Payment/components/BookingDetails/BookingDetails';

import styles from './AmendmentViewBookingCost.module.scss';

const DynamicFeesPopup = dynamic(() => import('frontend/components/renderings/FeesPopup/FeesPopup'));

export interface IAmendmentViewBookingCostProps {
    fields: IFeesPopupFields;
    linkClass?: string;
}

const AmendmentViewBookingCost = ({ fields, linkClass }: IAmendmentViewBookingCostProps) => {
    const { trackEventWithParams, totalAccommodationDiscount, paymentInfo, priceBreakdown, tradeAgentPriceBreakdown } =
        useStore((stores: ITradePortalStores) => ({
            totalAccommodationDiscount: stores.bookingStore.totalAccomodationDiscount,
            trackEventWithParams: stores.trackingStore.trackEventWithParams,
            paymentInfo: stores.amendSeatsStore.paymentInfo,
            priceBreakdown: stores.amendSeatsStore?.priceBreakdown,
            tradeAgentPriceBreakdown: stores.amendSeatsStore?.tradeAgentPriceBreakdown,
        }));
    const [isTradeAgentFeePopupShown, setIsTradeAgentFeePopupShown] = useState(false);

    if (!fields || !paymentInfo) {
        return null;
    }

    const { FeesAndTaxesLabel } = fields;

    const toggleTradeAgentFeePopup = () => {
        trackEventWithParams(
            EventTypes.GenericEvent,
            FEES_GENERIC_EVENT_PARAMS(!isTradeAgentFeePopupShown),
            GENERIC_CUSTOM_PARAMS_EMPTY,
        );
        setIsTradeAgentFeePopupShown(!isTradeAgentFeePopupShown);
    };

    return (
        <div className={classNames(styles.amendmentViewBookingCost)} data-tid='booking-cost'>
            <div className={styles.body}>
                {!!FeesAndTaxesLabel?.value && (
                    <div
                        data-tid='fees-popup-link'
                        className={classNames('fees-popup-link no-print', styles.feesPopupLink, linkClass)}
                    >
                        <Button isText onClick={toggleTradeAgentFeePopup}>
                            {FeesAndTaxesLabel.value}
                        </Button>
                    </div>
                )}
            </div>
            {isTradeAgentFeePopupShown && (
                <DynamicFeesPopup
                    onClose={toggleTradeAgentFeePopup}
                    paymentInfo={paymentInfo}
                    fields={fields}
                    tradeAgentPriceBreakdown={tradeAgentPriceBreakdown}
                    priceBreakdown={priceBreakdown}
                    totalAccomodationDiscount={totalAccommodationDiscount}
                />
            )}
        </div>
    );
};

export default observer(AmendmentViewBookingCost);
