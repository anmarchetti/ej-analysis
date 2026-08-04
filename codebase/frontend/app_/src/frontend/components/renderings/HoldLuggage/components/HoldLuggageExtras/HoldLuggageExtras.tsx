import React, { FC } from 'react';
import { RichText, Text } from '@sitecore-jss/sitecore-jss-react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';

import { ICurrencyFormatOptions } from 'code/currency';
import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { isTradeStore } from 'frontend/store/tradePortal';
import { getIsSportEquipmentAvailableSeason } from 'frontend/utils/luggage.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import JSSImage from 'frontend/components/common/JSSImage';
import { IHoldLuggageFields } from 'frontend/components/renderings/HoldLuggage/IHoldLuggageFields';

import styles from './HoldLuggageExtras.module.scss';

type THoldLuggageExtrasFields = Pick<
    IHoldLuggageFields,
    | 'BagExtraIcon'
    | 'HoldLuggageAndSportHeading'
    | 'HoldLuggageHeading'
    | 'SportsHeading'
    | 'BagExtraDescription'
    | 'BagExtraSportDescription'
    | 'BagExtraPrice'
    | 'SportsExtraPrice'
    | 'AddButtonText'
    | 'EditButtonText'
    | 'BagExtraDescriptionTrade'
    | 'NoAddHeading'
    | 'SportEquipmentRestrictedSeasons'
>;

export interface IHoldLuggageExtrasProps {
    fields: THoldLuggageExtrasFields;
    isHoldLuggageFull: boolean;
}

export const HoldLuggageExtras: FC<IHoldLuggageExtrasProps> = ({ fields, isHoldLuggageFull }) => {
    const {
        formatMoney,
        currency,
        isPriceVisible,
        extraLuggage,
        isFlightExternal,
        isExtrasPage,
        isConfirmationPage,
        travelDate,
        setHoldLuggagePopupOpened,
        isLuxuryPackage,
    } = useStore((stores: TStores) => ({
        formatMoney: stores.marketStore.formatMoney,
        setHoldLuggagePopupOpened: stores.bookingStore.holdLuggage.setHoldLuggagePopupOpened,
        currency: stores.bookingStore.currency,
        isPriceVisible: !isTradeStore(stores) || !stores.layoutStore.isPricesHidden,
        extraLuggage: stores.bookingStore.extraLuggage,
        isFlightExternal: stores.bookingStore.isFlightExternal,
        isExtrasPage: stores.layoutStore.isExtrasPage,
        isConfirmationPage: stores.layoutStore.isConfirmationPage,
        travelDate: stores.bookingStore.travelDate,
        isLuxuryPackage: stores.bookingStore.isLuxuryPackage,
    }));

    const isFlightInternalOnExtras = !isFlightExternal && isExtrasPage;

    const {
        isHoldLuggageAvailable,
        isSportsEquipmentAvailable,
        cheapestHoldLuggage,
        cheapestSportLuggage,
        canAddHoldLuggage,
    } = extraLuggage;

    if (!fields || (!canAddHoldLuggage && !isFlightInternalOnExtras) || isConfirmationPage || isLuxuryPackage) {
        return null;
    }

    const {
        BagExtraIcon,
        HoldLuggageAndSportHeading,
        HoldLuggageHeading,
        SportsHeading,
        BagExtraDescription,
        BagExtraSportDescription,
        BagExtraPrice,
        SportsExtraPrice,
        AddButtonText,
        EditButtonText,
        BagExtraDescriptionTrade,
        NoAddHeading,
        SportEquipmentRestrictedSeasons,
    } = fields;
    const { RestrictionSeasonsList } = SportEquipmentRestrictedSeasons?.fields || {};
    const priceOptions: ICurrencyFormatOptions = {
        currency: currency,
        maximumFractionDigits: 2,
    };
    const holdLuggagePrice = formatMoney(cheapestHoldLuggage?.price || 0, priceOptions);
    const sportLuggagePrice = formatMoney(cheapestSportLuggage?.price || 0, priceOptions);
    const weight = cheapestHoldLuggage?.name?.match(/\d+/)?.[0];
    const sportsItemExtraPriceLabel = Tokenizer.replaceToken(SportsExtraPrice?.value, Tokens.Price, sportLuggagePrice);
    const itemExtraPriceLabel = Tokenizer.replaceToken(BagExtraPrice?.value, Tokens.Price, holdLuggagePrice);
    const isSEAvailableSeason = getIsSportEquipmentAvailableSeason(RestrictionSeasonsList, travelDate);
    const isLuggageExtrasPriceVisible = isPriceVisible && isHoldLuggageAvailable;
    const isLuggageExtrasSportsPriceVisible = isPriceVisible && isSportsEquipmentAvailable && isSEAvailableSeason;

    const onAddButtonClick = (): void => {
        setHoldLuggagePopupOpened(true);
    };

    const getLuggageExtrasHeading = (): ISitecoreField<string> => {
        if (isHoldLuggageAvailable && isSportsEquipmentAvailable && isSEAvailableSeason)
            return HoldLuggageAndSportHeading;

        if (isHoldLuggageAvailable) return HoldLuggageHeading;

        if (isSportsEquipmentAvailable) return SportsHeading;

        return NoAddHeading;
    };

    const getLuggageExtrasDescription = (): string => {
        if (isHoldLuggageAvailable) {
            return Tokenizer.replaceTokens(BagExtraDescription?.value, {
                [Tokens.Price]: holdLuggagePrice,
                [Tokens.Number]: weight || '',
            });
        }

        return BagExtraSportDescription?.value;
    };

    return (
        <div
            className={classNames(styles.holdLuggageExtras, !isFlightExternal && styles.border)}
            data-tid='hold-luggage-extras'
        >
            <div className={styles.luggageSection}>
                <JSSImage field={BagExtraIcon} className={styles.bagExtraIconBig} dataTid='hold-luggage-icon-desktop' />
                <div className={styles.infoBlock}>
                    <div className={styles.titleContainer}>
                        <JSSImage
                            field={BagExtraIcon}
                            className={styles.bagExtraIconSmall}
                            dataTid='hold-luggage-icon-mobile'
                        />
                        <Text
                            field={getLuggageExtrasHeading()}
                            className={styles.bagExtraHeading}
                            tag='span'
                            data-tid='hold-luggage-extras-heading'
                        />
                    </div>
                    {isPriceVisible ? (
                        <RichText
                            field={{ ...BagExtraDescription, value: getLuggageExtrasDescription() }}
                            className={styles.bagExtraDescription}
                            data-tid='hold-luggage-extras-description'
                        />
                    ) : (
                        <RichText
                            data-tid='hold-luggage-extras-description-trade'
                            field={BagExtraDescriptionTrade}
                            className={styles.bagExtraDescription}
                        />
                    )}
                </div>
            </div>
            {canAddHoldLuggage && (
                <div className={styles.priceSection}>
                    {isLuggageExtrasPriceVisible && (
                        <RichText
                            field={{ ...BagExtraPrice, value: itemExtraPriceLabel }}
                            tag='span'
                            data-tid='hold-luggage-extras-price-bags'
                            className={styles.bagExtraPrice}
                        />
                    )}
                    {isLuggageExtrasSportsPriceVisible && (
                        <RichText
                            field={{ ...SportsExtraPrice, value: sportsItemExtraPriceLabel }}
                            tag='span'
                            data-tid='hold-luggage-extras-price-sports'
                            className={styles.sportsExtraPrice}
                        />
                    )}
                    <Button
                        className={classNames(styles.addButton, isHoldLuggageFull && styles.outlined)}
                        onClick={onAddButtonClick}
                        data-tid='add-lug-btn'
                    >
                        <Text field={isHoldLuggageFull ? EditButtonText : AddButtonText} />
                    </Button>
                </div>
            )}
        </div>
    );
};

export default observer(HoldLuggageExtras);
