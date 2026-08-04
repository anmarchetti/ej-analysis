import React, { FC, useEffect, useState } from 'react';
import { Swipeable } from 'react-swipeable';
import classNames from 'classnames';

import { CurrencyCode } from 'code/currency';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { ITradePortalStores } from 'frontend/store/tradePortal';
import { lockBodyScroll, unLockBodyScroll } from 'frontend/utils/ui.utils';
import { IBoardType, IRoomType } from 'models/data/IHotel';
import { IOfferWithoutAltBoards } from 'models/data/IOffer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import HeightAnimatedContainer from 'frontend/components/common/HeightAnimatedContainer/HeightAnimatedContainer';
import StartBookingButton from 'frontend/components/common/StartBookingButton';
import SvgChevronDown from 'frontend/components/icons-new/ChevronDown';
import SvgChevronUp from 'frontend/components/icons-new/ChevronUp';
import VisibleBasketOffers, {
    OffersViewMode,
} from 'frontend/components/renderings/Basket/components/BasketPriceCellOffers/BasketPriceCellOffers';

import BasketFirstCellAB from './BasketFirstCellAB';
import BasketPriceCellAB from './BasketPriceCellAB';
import BasketSecondCellAB from './BasketSecondCellAB';
import BasketThirdCell from './BasketThirdCellAB';

import styles from './BasketVerticalCellsAB.module.scss';

const MIN_SWIPE_DISTANCE = -100;

export interface IBasketVerticalCellsABProps {
    board: Nullable<IBoardType>;
    className: string;
    currency: CurrencyCode | undefined;
    isNextButtonVisible: boolean;
    isOpenSummaryBoxDetails: boolean;
    isPricePPShown: boolean;
    isPriceVisible: boolean;
    offer: IOfferWithoutAltBoards;
    openBoxDetails: () => void;
    room: Nullable<IRoomType>;
    totalPricePP: number;
}

export const BasketVerticalCellsAB: FC<IBasketVerticalCellsABProps> = props => {
    const [summaryBoxPositionY, setSummaryBoxPositionY] = useState(0);
    const { getPhrase } = useStore((stores: TStores | ITradePortalStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));
    const {
        isPriceVisible,
        isOpenSummaryBoxDetails,
        isNextButtonVisible,
        board,
        room,
        className,
        offer,
        isPricePPShown,
        openBoxDetails,
    } = props;

    useEffect(() => {
        isOpenSummaryBoxDetails ? lockBodyScroll() : unLockBodyScroll();
    }, [isOpenSummaryBoxDetails]);

    const closeSummaryBox = (positionY: number) => {
        if (positionY <= MIN_SWIPE_DISTANCE) {
            openBoxDetails();
        } else {
            setSummaryBoxPositionY(0);
        }
    };

    const openSummaryBox = () => {
        setSummaryBoxPositionY(0);
        openBoxDetails();
    };

    return (
        <div className={classNames(styles.basketVerticalCellsAB, 'basket-cells vertical-cells')}>
            <div style={{ transform: `translateY(${summaryBoxPositionY}px)` }}>
                <HeightAnimatedContainer isOpened={isOpenSummaryBoxDetails}>
                    <div className='basket-summary-box--details'>
                        <Swipeable
                            onSwiped={EventData => closeSummaryBox(EventData.deltaY)}
                            onSwiping={EventData => {
                                setSummaryBoxPositionY(EventData.deltaY < 0 ? EventData.absY : 0);
                            }}
                            className={styles.swipe}
                        >
                            <button className={styles.btnSwipe} />
                        </Swipeable>
                        <h4
                            className={classNames(styles.summaryBox__title, 'basket-summary-box--details__title')}
                            data-tid='basket-summary-box-title'
                        >
                            {getPhrase(SitecoreDictionary.BasketSectionHeadersThisHolidaysIncludesAB)}
                        </h4>
                        <div>
                            <BasketFirstCellAB board={board} room={room} className={className} offer={offer} />
                            <BasketSecondCellAB className={className} offer={offer} />
                            <BasketThirdCell className={className} />
                            {isPriceVisible && isNextButtonVisible && (
                                <div
                                    className={classNames(styles.pills, 'basket__price-pills')}
                                    data-tid='basket-price-cell-offers'
                                >
                                    <VisibleBasketOffers
                                        offer={offer}
                                        viewMode={OffersViewMode.AllOffers}
                                        isPricePPShown={isPricePPShown}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </HeightAnimatedContainer>
            </div>
            <Button
                className={classNames(
                    styles.showBtn,
                    'btn--open',
                    isOpenSummaryBoxDetails ? styles.btnOpened : styles.btnClosed,
                )}
                isText
                onClick={() => openSummaryBox()}
            >
                {isOpenSummaryBoxDetails ? (
                    <>
                        <SvgChevronDown />
                        <span>{getPhrase(SitecoreDictionary.BasketButtonsHideHolidayDetailsAB)}</span>
                    </>
                ) : (
                    <>
                        <SvgChevronUp />
                        <span>{getPhrase(SitecoreDictionary.BasketButtonsShowHolidayDetailsAB)}</span>
                    </>
                )}
            </Button>
            <div className='basket-summary-box'>
                <BasketPriceCellAB {...props} />
                <div className={styles.btnContainer}>
                    {isNextButtonVisible && (
                        <StartBookingButton
                            render={onClick => (
                                <Button id='book-button-basket' onClick={onClick}>
                                    {getPhrase(SitecoreDictionary.GlobalsButtonsContinue)}
                                </Button>
                            )}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default BasketVerticalCellsAB;
