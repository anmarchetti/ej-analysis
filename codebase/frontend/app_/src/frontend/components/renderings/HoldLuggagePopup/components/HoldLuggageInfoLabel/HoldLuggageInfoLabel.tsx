import { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';

import { SignDisplay } from 'code/currency';
import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { isTradeStore } from 'frontend/store/tradePortal';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { IHoldLuggagePopupFields } from 'frontend/components/renderings/HoldLuggagePopup/HoldLuggagePopup';

import styles from './HoldLuggageInfoLabel.module.scss';

export type THoldLuggageInfoLabelProps = Pick<IHoldLuggagePopupFields, 'LuggageAddedLabel' | 'NoLuggageAddedLabel'> & {
    isMobileContent?: boolean;
};

export const HoldLuggageInfoLabel: FC<THoldLuggageInfoLabelProps> = ({
    NoLuggageAddedLabel,
    LuggageAddedLabel,
    isMobileContent,
}) => {
    const { formatMoney, currency, isPriceVisible, selectedTotalNumber, selectedLuggageTotalPrice } = useStore(
        (stores: TStores) => ({
            formatMoney: stores.marketStore.formatMoney,
            currency: stores.bookingStore.currency,
            isPriceVisible: !isTradeStore(stores) || !stores.layoutStore.isPricesHidden,
            selectedTotalNumber: stores.bookingStore.holdLuggage.selectedTotalNumber,
            selectedLuggageTotalPrice: stores.bookingStore.holdLuggage.selectedLuggageTotalPrice,
        }),
    );

    const luggageSelectedLabel = selectedTotalNumber
        ? {
              value: Tokenizer.replaceToken(LuggageAddedLabel?.value, Tokens.Number, selectedTotalNumber.toString()),
          }
        : NoLuggageAddedLabel;

    return (
        <div
            className={classNames(styles.infoLabel, isMobileContent && styles.mobileInfoLabel)}
            data-tid='hold-luggage-info-label'
        >
            <Text tag='span' field={luggageSelectedLabel} />
            {isPriceVisible && (
                <span data-tid='hold-luggage-info-label-price' className={styles.price}>
                    {formatMoney(selectedLuggageTotalPrice, { currency, signDisplay: SignDisplay.Always })}
                </span>
            )}
        </div>
    );
};

export default observer(HoldLuggageInfoLabel);
