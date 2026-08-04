import React, { FunctionComponent } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { CurrencyCode, SignDisplay } from 'code/currency';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { isTradeStore } from 'frontend/store/tradePortal';
import { getImageUrl } from 'frontend/utils/url.utils';
import { IBoardType } from 'models/data/IHotel';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import BlockSelected from 'frontend/components/common/BlockSelected';
import Button from 'frontend/components/common/Button';
import DiscountedBoardPercentagePill from 'frontend/components/common/Pills/DiscountedBoardPill/DiscountedBoardPercentagePill';
import FreeBoardUpgradePill from 'frontend/components/common/Pills/FreeBoardUpgradePill/FreeBoardUpgradePill';
import PriceLabel from 'frontend/components/common/PriceLabel/PriceLabel';
import styles from 'frontend/components/renderings/AlternativeBoardsPopup/AlternativeBoardsPopup.module.scss';

export interface IAltBoardItemProps {
    board: IBoardType;
    isPricePPShown: boolean;
    isSelected: boolean;
    selectedBoardPricePP: number;
    currency?: CurrencyCode;
    onSelect?: () => void;
}

const AltBoardItem: FunctionComponent<IAltBoardItemProps> = ({
    board: { pricePP, iconUrl, title, code, content, isFreeBoardUpgrade = false, discountPercent },
    currency,
    isPricePPShown,
    isSelected,
    selectedBoardPricePP,
    onSelect,
}) => {
    const { isPriceVisible, formatMoney, getPhrase } = useStore((stores: TStores) => ({
        isPriceVisible: !isTradeStore(stores) || !stores.layoutStore.isPricesHidden,
        formatMoney: stores.marketStore.formatMoney,
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const price = (pricePP ?? 0) - selectedBoardPricePP;
    const itemTitle = title || code;

    const tooltipClass = classNames(styles.tooltip, styles.priority);

    return (
        <div
            className={classNames(styles.item, isSelected && styles.itemSelected)}
            data-tid='alt-board-item-wrapper'
            data-item-accomcode={code}
            {...(isSelected && { 'data-item-selection': 'selected' })}
        >
            <div className={styles.itemBody}>
                <div className={styles.alternativeBoardsTitleSection}>
                    <div className={styles.alternativeBoardsTitleWrapper}>
                        {iconUrl && (
                            <div
                                className={styles.itemIcon}
                                style={{
                                    backgroundImage: `url(${getImageUrl(iconUrl)})`,
                                }}
                            />
                        )}
                        {itemTitle && (
                            <h4 className={styles.itemTitle} data-tid='alt-board-item-title'>
                                {itemTitle}
                            </h4>
                        )}
                    </div>

                    <div className={styles.mobilePillWrapper}>
                        <FreeBoardUpgradePill isFreeBoardUpgrade={isFreeBoardUpgrade} tooltipClass={tooltipClass} />
                        <DiscountedBoardPercentagePill percent={discountPercent} />
                    </div>
                </div>
                {content && (
                    <>
                        {isSelected && (
                            <div className={styles.selectedLabel}>
                                {getPhrase(SitecoreDictionary.BoardTypesLabelsIncludedInHoliday)}
                            </div>
                        )}
                        <div className={styles.itemInfo}>
                            <div
                                className={styles.description}
                                data-tid='alt-board-item-desc'
                                dangerouslySetInnerHTML={{ __html: content }}
                            />
                        </div>
                    </>
                )}
            </div>

            <div
                className={classNames(styles.itemButtons, { [styles.withPill]: discountPercent || isFreeBoardUpgrade })}
            >
                <div className={styles.desktopPillWrapper}>
                    <FreeBoardUpgradePill isFreeBoardUpgrade={isFreeBoardUpgrade} tooltipClass={tooltipClass} />
                    <DiscountedBoardPercentagePill percent={discountPercent} />
                </div>

                {isSelected ? (
                    <BlockSelected siteCoreKey={SitecoreDictionary.BoardTypesButtonsSelected} />
                ) : (
                    <Button
                        className={styles.itemAction}
                        isFullWidth
                        onClick={onSelect}
                        data-tid='alt-board-item-action'
                    >
                        {isPriceVisible ? (
                            <PriceLabel
                                price={
                                    <>
                                        {formatMoney(price, {
                                            currency,
                                            maximumFractionDigits: 0,
                                            signDisplay: SignDisplay.ExceptZero,
                                        })}
                                    </>
                                }
                                priceDictionary={
                                    isPricePPShown ? SitecoreDictionary.GlobalsPriceLabelsPerPerson : undefined
                                }
                            />
                        ) : (
                            getPhrase(SitecoreDictionary.BoardTypesLabelsSelect)
                        )}
                    </Button>
                )}
            </div>
        </div>
    );
};

export default observer(AltBoardItem);
