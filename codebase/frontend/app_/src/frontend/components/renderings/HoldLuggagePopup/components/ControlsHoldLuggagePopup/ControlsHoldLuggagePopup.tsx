import { FC } from 'react';
import { RichText } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { isTradeStore } from 'frontend/store/tradePortal';
import { Tokenizer } from 'frontend/utils/tokenizer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SvgMinus from 'frontend/components/icons-new/Minus';
import SvgPlus from 'frontend/components/icons-new/Plus';

import styles from './ControlsHoldLuggagePopup.module.scss';

export interface IControlsHoldLuggagePopupProps {
    code: string | undefined;
    isSport: boolean;
    priceLabel: string | undefined;
}

export const ControlsHoldLuggagePopup: FC<IControlsHoldLuggagePopupProps> = ({ code, priceLabel, isSport }) => {
    const {
        formatMoney,
        currency,
        isPriceVisible,
        luggagePrices,
        getPhrase,
        addBag,
        removeBag,
        isAddLuggageBtnDisabled,
        isRemoveLuggageBtnDisabled,
        selectedLuggage,
        selectedSportEquipment,
    } = useStore((stores: TStores) => ({
        formatMoney: stores.marketStore.formatMoney,
        currency: stores.bookingStore.currency,
        isPriceVisible: !isTradeStore(stores) || !stores.layoutStore.isPricesHidden,
        luggagePrices: stores.bookingStore.extraLuggage.luggagePrices,
        getPhrase: stores.layoutStore.getPhrase,
        addBag: stores.bookingStore.holdLuggage.addBag,
        removeBag: stores.bookingStore.holdLuggage.removeBag,
        isAddLuggageBtnDisabled: stores.bookingStore.holdLuggage.isAddLuggageBtnDisabled,
        isRemoveLuggageBtnDisabled: stores.bookingStore.holdLuggage.isRemoveLuggageBtnDisabled,
        selectedLuggage: stores.bookingStore.holdLuggage.selectedLuggage,
        selectedSportEquipment: stores.bookingStore.holdLuggage.selectedSportEquipment,
    }));

    if (!code) {
        return null;
    }

    const price = formatMoney(luggagePrices[code], { currency });
    const priceLabelResult = Tokenizer.replaceToken(priceLabel, Tokens.Price, price);
    const isAddBtnDisabled = isAddLuggageBtnDisabled(isSport, code);
    const isRemoveBtnDisabled = isRemoveLuggageBtnDisabled(isSport, code);
    const selectedItems = isSport ? selectedSportEquipment : selectedLuggage;

    return (
        <>
            {isPriceVisible && (
                <div className={styles.rightBlockLabel} data-tid='luggage-price-label'>
                    <RichText field={{ value: priceLabelResult }} tag={'span'} />
                </div>
            )}

            <div className={styles.bagControls} data-tid='bag-controls'>
                <button
                    type='button'
                    className={classNames(styles.button, isRemoveBtnDisabled && styles.buttonDisabled)}
                    onClick={() => removeBag(code, isSport)}
                    disabled={isRemoveBtnDisabled}
                    data-tid='remove-bag-btn'
                    aria-label={getPhrase(SitecoreDictionary.AccessibilityAriaLabelRemoveItem)}
                >
                    <SvgMinus />
                </button>

                <input
                    aria-label={getPhrase(SitecoreDictionary.AccessibilityAriaLabelSelectedItemCount)}
                    aria-readonly='true'
                    type='number'
                    value={selectedItems[code] || 0}
                    min='0'
                    max='999'
                    data-tid='luggage-item-value'
                    onMouseDown={e => {
                        e.preventDefault();
                    }}
                    readOnly
                />

                <button
                    type='button'
                    className={classNames(styles.button, isAddBtnDisabled && styles.buttonDisabled)}
                    onClick={() => addBag(code, isSport)}
                    disabled={isAddBtnDisabled}
                    data-tid='add-bag-btn'
                    aria-label={getPhrase(SitecoreDictionary.AccessibilityAriaLabelAddItem)}
                >
                    <SvgPlus />
                </button>
            </div>
        </>
    );
};

export default observer(ControlsHoldLuggagePopup);
