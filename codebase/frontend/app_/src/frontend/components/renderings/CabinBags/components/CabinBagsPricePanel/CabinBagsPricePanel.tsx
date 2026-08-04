import React, { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { IPassengerFlights } from 'models/data/AncillariesInfo';
import { ICabinBagsFields } from 'models/data/ICabinBagsFields';
import AncillariesPassengerType from 'frontend/components/common/AncillariesPassengerType/AncillariesPassengerType';
import Button from 'frontend/components/common/Button';
import IncludedBagsRow from 'frontend/components/renderings/CabinBags/components/IncludedBagsRow/IncludedBagsRow';
import LCBAddedRow from 'frontend/components/renderings/CabinBags/components/LCBAddedRow/LCBAddedRow';
import LCBIsNotAddedRow from 'frontend/components/renderings/CabinBags/components/LCBIsNotAddedRow/LCBIsNotAddedRow';

import styles from './CabinBagsPricePanel.module.scss';

export interface ICabinBagsPricePanelProps {
    passenger: IPassengerFlights;
    passengerIndex: number;
    fields?: ICabinBagsFields;
}

export const CabinBagsPricePanel: FC<ICabinBagsPricePanelProps> = ({ fields, passenger, passengerIndex }) => {
    const { extraLuggage, isCabinBagsEnabled, isPostBookingPages, isViewBookingPage, isBookingOutOfSync } = useStore(
        (stores: TStores) => ({
            getPhrase: stores.layoutStore.getPhrase,
            extraLuggage: stores.bookingStore.extraLuggage,
            isCabinBagsEnabled: stores.layoutStore.isCabinBagsEnabled,
            isPostBookingPages: stores.layoutStore.isPostBookingPages,
            isViewBookingPage: stores.layoutStore.isViewBookingPage,
            isBookingOutOfSync: stores.viewBookingStore.isBookingOutOfSync,
        }),
    );

    const {
        validateLCB,
        generatePassengerLCBItems,
        getLargeCabinBagsFormattedPrice,
        existingExtraLuggageItems,
        existingLCBItems,
        LCBMaxQuantity,
        defaultBags,
    } = extraLuggage;
    const { outboundPassenger } = passenger;
    const formattedPrice = getLargeCabinBagsFormattedPrice(true);

    if (!fields || (!formattedPrice && !isPostBookingPages)) {
        return null;
    }

    const { AddButtonLabel, AddLCBLabel, Children } = fields;
    const { withInfant, passengerId, hasLCB } = outboundPassenger;
    const isLackOfCapacity = passengerIndex > LCBMaxQuantity;

    const toggleBag = () => {
        if (!passengerId) return;

        const otherPassengersLCB = existingLCBItems.filter(item => item.passengerId !== passengerId);
        let luggageItems = existingExtraLuggageItems;

        if (hasLCB) {
            //**Leave only other passengers LCBs and hold luggage */
            luggageItems = [...defaultBags, ...luggageItems, ...otherPassengersLCB];
        } else {
            const newLCBItems = generatePassengerLCBItems(passengerId);

            /**Add new LCB items and keep other passengers LCBs with hold luggage */
            luggageItems = [...defaultBags, ...luggageItems, ...existingLCBItems, ...newLCBItems];
        }

        validateLCB(luggageItems, true, !hasLCB);
    };

    const shouldDispayAddButton = !hasLCB && !isLackOfCapacity && !isPostBookingPages;

    return (
        <div
            className={classNames(
                styles.wrapper,
                (hasLCB || isLackOfCapacity) && styles.wrapperFull,
                isPostBookingPages && styles.wrapperFullAlt,
            )}
            data-tid='lcb-price-panel-wrapper'
        >
            <AncillariesPassengerType
                className={styles.passengerType}
                outboundPassenger={outboundPassenger}
                fields={{ Children }}
                numberOfPerson={Number(passengerId)}
            />
            <div data-tid='lcb-price-panel' className={styles.container}>
                <IncludedBagsRow withInfant={!!withInfant} fields={fields} />
                {(isCabinBagsEnabled || isViewBookingPage) && !isBookingOutOfSync && (
                    <LCBAddedRow price={formattedPrice} fields={fields} removeBag={toggleBag} hasLCB={!!hasLCB} />
                )}
                {isCabinBagsEnabled && !isBookingOutOfSync && (
                    <LCBIsNotAddedRow fields={fields} hasLCB={!!hasLCB} isLackOfCapacity={isLackOfCapacity} />
                )}
            </div>
            {shouldDispayAddButton && (
                <div className={styles.addAction} data-tid='add-lcb-container'>
                    <Text field={AddLCBLabel} tag='span' className={styles.addActionLabel} />
                    <Button
                        className={styles.addButton}
                        onClick={toggleBag}
                        data-tid='lcb-add-bag-action'
                        aria-label='Add large cabin bag'
                    >
                        <div className={styles.buttonText} data-tid='lcb-add-bag-action-text'>
                            <Text tag='span' field={AddButtonLabel} />
                        </div>
                    </Button>
                </div>
            )}
        </div>
    );
};

export default observer(CabinBagsPricePanel);
