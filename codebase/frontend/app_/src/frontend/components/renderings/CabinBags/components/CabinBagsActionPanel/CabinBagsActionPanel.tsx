import React, { FC, useMemo } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { isTradeStore } from 'frontend/store/tradePortal';
import { getLCBPriceLabel } from 'frontend/utils/seatAndBags.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { IUrgencyMessageStored } from 'frontend/utils/urgencyMessage.utils';
import { setWebStorageItem } from 'frontend/utils/webStorage.utils';
import { ICabinBagsFields } from 'models/data/ICabinBagsFields';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { WebStorageKeys } from 'models/enum/WebStorageKeys';
import Button from 'frontend/components/common/Button';
import JSSImage from 'frontend/components/common/JSSImage';
import UrgencyMessage from 'frontend/components/common/UrgencyMessage/UrgencyMessage';
import SvgTick from 'frontend/components/icons-new/Tick';

import styles from './CabinBagsActionPanel.module.scss';

export interface ICabinBagsActionPanelProps {
    fields?: ICabinBagsFields;
}

export const CabinBagsActionPanel: FC<ICabinBagsActionPanelProps> = ({ fields }) => {
    const {
        isPriceVisible,
        extraLuggage,
        outBoundPassengers,
        LCBCount,
        getPhrase,
        isLCBAssignedToAllPassengers,
        availableDepartureCabinBags,
        availableReturnCabinBags,
    } = useStore((stores: TStores) => ({
        extraLuggage: stores.bookingStore.extraLuggage,
        isPriceVisible: !isTradeStore(stores) || !stores.layoutStore.isPricesHidden,
        outBoundPassengers: stores.flightsPassengersStore.outBoundPassengers,
        LCBCount: stores.flightsPassengersStore.LCBCount,
        isLCBAssignedToAllPassengers: stores.flightsPassengersStore.isLCBAssignedToAllPassengers,
        getPhrase: stores.layoutStore.getPhrase,
        availableDepartureCabinBags: stores.bookingStore.availableDepartureCabinBags,
        availableReturnCabinBags: stores.bookingStore.availableReturnCabinBags,
    }));

    const {
        isLCBAlmostFull,
        passengersAvailableForLCBCount,
        getLargeCabinBagsFormattedPrice,
        existingExtraLuggageItems,
        generatePassengerLCBItems,
        validateLCB,
        defaultBags,
    } = extraLuggage;
    const formattedPrice = getLargeCabinBagsFormattedPrice(false, true);

    const thresholdValue = fields?.UrgencyMessageCabinBagsThreshold?.value ?? 0;
    const urgencyMessageText = fields?.UrgencyMessageText?.value ?? '';
    const urgencyTooltipText = fields?.UrgencyMessageTooltipText?.value ?? '';
    const itemUrgencyMessageText = fields?.itemUrgencyMessageText?.value ?? '';

    const { urgencyMessageTextFormatted, urgencyMessageTooltipTextFormatted, itemUrgencyMessageTextFormatted } =
        useMemo(() => {
            const isDepartureCabinBags = availableDepartureCabinBags <= availableReturnCabinBags;
            const minAvailableCabinBags = isDepartureCabinBags ? availableDepartureCabinBags : availableReturnCabinBags;
            let urgencyMessageTextFormatted: string | undefined;
            let urgencyMessageTooltipTextFormatted: string | undefined;
            let itemUrgencyMessageTextFormatted: string | undefined;

            const formatUrgencyMessageTooltipText = (text: string, isDepartureCabinBags: boolean): string =>
                Tokenizer.replaceToken(
                    text,
                    Tokens.FlightDirection,
                    getPhrase(
                        isDepartureCabinBags
                            ? SitecoreDictionary.GlobalsLabelsDeparture
                            : SitecoreDictionary.GlobalsLabelsReturn,
                    ),
                );

            const formatUrgencyMessageText = (text: string): string =>
                Tokenizer.replaceToken(text, Tokens.Avail, minAvailableCabinBags.toString());

            if (minAvailableCabinBags <= thresholdValue) {
                urgencyMessageTextFormatted = formatUrgencyMessageText(urgencyMessageText);
                itemUrgencyMessageTextFormatted = formatUrgencyMessageText(itemUrgencyMessageText);
                urgencyMessageTooltipTextFormatted = formatUrgencyMessageTooltipText(
                    urgencyTooltipText,
                    isDepartureCabinBags,
                );
            }

            return {
                urgencyMessageTextFormatted,
                urgencyMessageTooltipTextFormatted,
                itemUrgencyMessageTextFormatted,
            };
        }, [
            thresholdValue,
            urgencyMessageText,
            urgencyTooltipText,
            itemUrgencyMessageText,
            availableDepartureCabinBags,
            availableReturnCabinBags,
            getPhrase,
        ]);

    if (!fields || !formattedPrice) {
        return null;
    }

    const { CabinBagPriceLabel, SpeedyBoardingLabel, AddCabinBagLabel, SpeedyBoardingIcon, AddMaxCabinBagsButton } =
        fields;

    const onAddLCBClick = () => {
        const passengersCountForLCB = outBoundPassengers.slice(0, passengersAvailableForLCBCount);
        const LCBItemsToAdd = passengersCountForLCB.reduce(
            (result, { passengerId }) =>
                passengerId ? [...result, ...generatePassengerLCBItems(passengerId)] : result,
            [],
        );
        const luggageItems = [...defaultBags, ...LCBItemsToAdd, ...existingExtraLuggageItems];

        validateLCB(luggageItems, false);
    };

    const priceLabel = getLCBPriceLabel(formattedPrice, CabinBagPriceLabel);
    const btnLabel = isLCBAlmostFull ? AddMaxCabinBagsButton : AddCabinBagLabel;

    const shouldShowUrgencyMessage = !!urgencyMessageTextFormatted && LCBCount === 0;

    const urgencyMessageData: IUrgencyMessageStored = {
        urgencyMessageText: itemUrgencyMessageTextFormatted ?? '',
        hasUrgencyMessage: !!itemUrgencyMessageTextFormatted,
    };

    setWebStorageItem(WebStorageKeys.CabinBagsUrgencyMessageText, urgencyMessageData, sessionStorage);

    return (
        <div
            className={classNames(shouldShowUrgencyMessage && styles.flexColumn, styles.wrapper)}
            data-tid='lcb-action-panel'
        >
            {shouldShowUrgencyMessage && (
                <div className={styles.urgencyMessageWrapper}>
                    <UrgencyMessage
                        message={urgencyMessageTextFormatted}
                        tooltip={urgencyMessageTooltipTextFormatted}
                        className={styles.urgencyMessage}
                    />
                </div>
            )}
            <div className={styles.actionWrapper}>
                {isPriceVisible && (
                    <div
                        className={styles.priceInfo}
                        data-tid='lcb-price-info'
                        dangerouslySetInnerHTML={{ __html: priceLabel || '' }}
                    />
                )}
                <div className={styles.speedyBoarding} data-tid='lcb-speedy-boarding'>
                    <JSSImage
                        data-tid='speedy-boarding-icon'
                        field={SpeedyBoardingIcon}
                        className={styles.speedyIcon}
                    />
                    <Text field={SpeedyBoardingLabel} tag='span' />
                </div>
                <div className={styles.buttonContainer}>
                    {isLCBAssignedToAllPassengers ? (
                        <span className={styles.selectedLabel} data-tid='lcb-selected-label'>
                            {getPhrase(SitecoreDictionary.GlobalsLabelsSelected)} <SvgTick />
                        </span>
                    ) : (
                        <Button
                            isOutlined={isLCBAlmostFull}
                            className={styles.button}
                            onClick={onAddLCBClick}
                            data-tid='lcb-action-panel-button'
                        >
                            <div className={styles.buttonText} data-tid='lcb-action-panel-button-text'>
                                <Text field={btnLabel} tag='span' />
                            </div>
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default observer(CabinBagsActionPanel);
