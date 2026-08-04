import React, { FC } from 'react';
import classNames from 'classnames';

import { CurrencyCode } from 'code/currency';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { ITradePortalStores } from 'frontend/store/tradePortal';
import { containsLuxuryPromoCode } from 'frontend/utils/offer.utils';
import { IBoardType, IRoomType } from 'models/data/IHotel';
import { IOfferWithoutAltBoards } from 'models/data/IOffer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import StartBookingButton from 'frontend/components/common/StartBookingButton';
import SvgChevronDown from 'frontend/components/icons-new/ChevronDown';
import SvgChevronUp from 'frontend/components/icons-new/ChevronUp';
import SvgCross from 'frontend/components/icons-new/Cross';
import BasketFirstCell from 'frontend/components/renderings/Basket/components/BasketFirstCell';
import BasketPriceCell from 'frontend/components/renderings/Basket/components/BasketPriceCell';
import VisibleBasketOffers, {
    OffersViewMode,
} from 'frontend/components/renderings/Basket/components/BasketPriceCellOffers/BasketPriceCellOffers';
import { BasketSecondCell } from 'frontend/components/renderings/Basket/components/BasketSecondCell';
import BasketThirdCell from 'frontend/components/renderings/Basket/components/BasketThirdCell';
import PromocodeBanner from 'frontend/components/renderings/Basket/components/PromocodeBanner/PromocodeBanner';
import { ISummaryBarSitecoreFields } from 'frontend/components/renderings/SummaryBar/SummaryBar.interfaces';
import SummaryDetails from 'frontend/components/renderings/SummaryBar/SummaryDetails/SummaryDetails';

import { resetScrollbarPosition, setContainerHeight } from './BasketVerticalCells.utils';

import styles from './BasketVerticalCells.module.scss';

interface IBasketVerticalCellsProps {
    board: Nullable<IBoardType>;
    className: string;
    currency: CurrencyCode | undefined;
    fields: ISummaryBarSitecoreFields | undefined;
    isExpanded: boolean;
    isNewSummaryBar: boolean;
    isNextButtonVisible: boolean;
    isPricePPShown: boolean;
    isPriceVisible: boolean;
    offer: IOfferWithoutAltBoards;
    room: Nullable<IRoomType>;
    toggleIsExpanded: () => void;
    totalPricePP: number;
}

export const BasketVerticalCells: FC<IBasketVerticalCellsProps> = props => {
    const { getPhrase } = useStore((stores: TStores | ITradePortalStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));
    const { offer, isPriceVisible, isExpanded, isNextButtonVisible, toggleIsExpanded, isNewSummaryBar } = props;

    const getTitle = (): string => {
        if (isNewSummaryBar && props.fields) {
            return props.fields?.SummaryBarTitle.value;
        }

        return getPhrase(SitecoreDictionary.BasketSectionHeadersThisPriceIncludes);
    };

    const getButtonTitle = (): string => {
        if (isNewSummaryBar && props.fields) {
            return props.fields?.SummaryBarExpanderTitle.value;
        }

        return getPhrase(SitecoreDictionary.BasketButtonsHolidayDetails);
    };

    return (
        <div
            id='basket-container'
            className={classNames('basket-cells', 'vertical-cells', styles.container)}
            ref={setContainerHeight}
        >
            <div
                className={classNames('basket-summary-box--details', styles.content, {
                    [styles.expanded]: isExpanded,
                })}
            >
                <div>
                    <h4 className='basket-summary-box--details__title' data-tid='basket-summary-box-details-title'>
                        {getTitle()}
                    </h4>

                    <button className='btn btn--txt btn--close' onClick={toggleIsExpanded}>
                        <SvgCross />
                    </button>
                </div>

                <div
                    id='scrollable-wrapper'
                    className={classNames(styles.wrapper, { [styles.extras]: isNewSummaryBar })}
                >
                    {isNewSummaryBar ? (
                        <SummaryDetails
                            {...(props.fields as ISummaryBarSitecoreFields)}
                            onEditClick={toggleIsExpanded}
                        />
                    ) : (
                        <>
                            <BasketFirstCell {...props} />
                            <BasketSecondCell {...props} />
                            <BasketThirdCell {...props} />

                            {isPriceVisible && isNextButtonVisible && (
                                <div className='basket__price-pills' data-tid='basket-price-cell-offers'>
                                    <VisibleBasketOffers
                                        offer={offer}
                                        viewMode={OffersViewMode.AllOffers}
                                        isPricePPShown={props.isPricePPShown}
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <div className={classNames(styles.panelWrapper, 'basket-summary-box')}>
                {!isExpanded && (
                    <PromocodeBanner
                        buttonLabel={props.fields?.MerchandiseBannerButtonLabel}
                        text={props.fields?.MerchandiseBannerText}
                    />
                )}

                <div className={classNames('vertical-cell--btn', styles.btn)}>
                    <Button
                        className='btn--open'
                        isText
                        onClick={(): void => {
                            if (!isExpanded) {
                                resetScrollbarPosition();
                            }

                            setContainerHeight();
                            toggleIsExpanded();
                        }}
                        dataTid='toggle-basket-btn'
                    >
                        {isExpanded ? <SvgChevronDown /> : <SvgChevronUp />}
                        {getButtonTitle()}
                    </Button>
                </div>

                <BasketPriceCell {...props} />

                {isNextButtonVisible && (
                    <div className='vertical-cell--btn'>
                        <StartBookingButton
                            render={(onClick: () => void): JSX.Element => (
                                <Button
                                    id='book-button-basket'
                                    className='book-btn-basket-mobile'
                                    onClick={onClick}
                                    isBlackColor={containsLuxuryPromoCode(props.offer.promoCollections)}
                                >
                                    {getPhrase(SitecoreDictionary.GlobalsButtonsContinue)}
                                </Button>
                            )}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default BasketVerticalCells;
