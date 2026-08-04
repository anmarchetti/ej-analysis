import { FunctionComponent, useEffect, useRef, useState } from 'react';
import { EventData, Swipeable } from 'react-swipeable';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { CurrencyCode, SignDisplay } from 'code/currency';
import useClickOutside from 'frontend/hooks/useClickOutside';
import { useMoreThenMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { lockBodyScroll, unLockBodyScroll } from 'frontend/utils/ui.utils';
import { IFeePerPerson } from 'models/data/IAmendBookingFlights';
import { TAmendTaxesAndFees } from 'models/data/IAmendTaxAndFeeItem';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import HeightAnimatedContainer from 'frontend/components/common/HeightAnimatedContainer/HeightAnimatedContainer';
import {
    DATA_TID_PREFIX as DATA_TID,
    getPaymentField,
} from 'frontend/components/common/PriceBreakdown/PriceBreakdown.utils';
import StickyBox from 'frontend/components/common/StickyBox';

import PriceBreakdownDetails, {
    IPriceBreakdownDetailsProps,
} from './components/PriceBreakdownDetails/PriceBreakdownDetails';
import { IPriceBreakdownItem } from './components/PriceBreakdownItem/PriceBreakdownItem';
import PriceBreakdownShimmer from './components/PriceBreakdownShimmer/PriceBreakdownShimmer';
import PriceBreakdownStickyBar from './components/PriceBreakdownStickyBar/PriceBreakdownStickyBar';
import TouristTaxSummary from './components/TouristTaxSummary/TouristTaxSummary';

import styles from './PriceBreakdown.module.scss';

const MIN_SWIPE_DISTANCE = -50;

export interface IPriceBreakdownBaseFields {
    NoChangeTotal: ISitecoreField<string>;
    PayNow: ISitecoreField<string>;
    PriceBreakdownTitle: ISitecoreField<string>;
    RefundAmount: ISitecoreField<string>;
}

export interface IPriceBreakdownFields extends IPriceBreakdownBaseFields {
    ChangeFeeTitle?: ISitecoreField<string>;
    HolidayCredit?: ISitecoreField<string>;
    PreviousBalanceLabel?: ISitecoreField<string>;
    TotalCostOfChange?: ISitecoreField<string>;
}

export interface IPriceBreakdownProps {
    currency: CurrencyCode;
    fields: IPriceBreakdownFields;
    totalPrice: number;
    containerClassName?: string;
    feeChargePrice?: number;
    feesPerPersons?: IFeePerPerson[];
    holidayCredit?: number;
    isLoading?: boolean;
    isTradePortal?: boolean;
    previousBalance?: number;
    priceBreakdownItems?: IPriceBreakdownItem[];
    priceBreakdownTitle?: ISitecoreField<string>;
    showStickyDesignOnMobile?: boolean;
    subTotalPrice?: number;
    titleClassName?: string;
    totalPriceLabelField?: ISitecoreField<string>;
    touristTaxData?: {
        hasTouristTax: boolean;
        newTaxesAndFees: TAmendTaxesAndFees;
        newTouristTaxConverted: number;
        prevTouristTax: number;
    };
    touristTaxFields?: {
        newTaxLabel?: string;
        newTaxPopupContent?: string;
        newTaxPopupTitle?: string;
        paidToUsLabel?: string;
        prevTaxLabel?: string;
    };
}

const PriceBreakdown: FunctionComponent<IPriceBreakdownProps> = ({
    fields,
    feesPerPersons,
    feeChargePrice,
    isTradePortal,
    previousBalance,
    totalPrice,
    priceBreakdownItems,
    totalPriceLabelField,
    priceBreakdownTitle,
    subTotalPrice,
    holidayCredit,
    currency,
    showStickyDesignOnMobile = true,
    containerClassName,
    titleClassName,
    isLoading,
    touristTaxData,
    touristTaxFields,
}) => {
    const { formatMoney, isTouristTaxEnabled } = useStore(({ marketStore, layoutStore }: TStores) => ({
        formatMoney: marketStore.formatMoney,
        isTouristTaxEnabled: layoutStore.isTouristTaxEnabled,
    }));
    const containerRef = useRef(null);
    const isMoreThenMobileViewport = useMoreThenMobileViewport();
    useClickOutside(containerRef, () => setIsMobileDrawerOpened(false));

    const [translateY, setTranslateY] = useState(0);
    const [isMobileDrawerOpened, setIsMobileDrawerOpened] = useState(false);

    const preventScroll = (e: TouchEvent): void => {
        e.preventDefault();
    };

    useEffect(() => {
        const body = document.body;

        if (isMobileDrawerOpened) {
            body.addEventListener('touchmove', preventScroll, { passive: false });
            lockBodyScroll();
        } else {
            unLockBodyScroll();
        }

        return () => {
            body.removeEventListener('touchmove', preventScroll);
        };
    }, [isMobileDrawerOpened]);

    useEffect(() => {
        if (isMoreThenMobileViewport && isMobileDrawerOpened) {
            setIsMobileDrawerOpened(false);
        }
    }, [isMoreThenMobileViewport, isMobileDrawerOpened]);

    if (isLoading) {
        return <PriceBreakdownShimmer />;
    }

    const onSwipingMobileDrawer = (eventData: EventData): void => {
        const { absY, deltaY } = eventData;

        setTranslateY(deltaY < 0 ? absY : 0);
    };

    const onSwipedMobileDrawer = (eventData: EventData): void => {
        if (eventData.deltaY <= MIN_SWIPE_DISTANCE) {
            setIsMobileDrawerOpened(false);
        } else {
            setTranslateY(0);
        }
    };

    const toggleMobileDrawer = (): void => {
        setTranslateY(0);
        setIsMobileDrawerOpened(!isMobileDrawerOpened);
    };

    const transactionAmount = formatMoney(Math.abs(totalPrice), {
        currency,
        signDisplay: SignDisplay.AUTO,
    });

    const paymentField = totalPriceLabelField || getPaymentField(fields, totalPrice, isTradePortal);
    const priceBreakdownTitleField = priceBreakdownTitle || fields.PriceBreakdownTitle;
    const totalCostOfChangeField = totalPriceLabelField || fields.TotalCostOfChange;

    const showTouristTax = isTouristTaxEnabled && !!touristTaxData?.hasTouristTax;
    const isRefund = totalPrice < 0;

    const touristTaxSummaryNode =
        showTouristTax && touristTaxData ? (
            <TouristTaxSummary
                currency={currency}
                newTaxesAndFees={touristTaxData.newTaxesAndFees}
                newTouristTaxConverted={touristTaxData.newTouristTaxConverted}
                prevTouristTax={touristTaxData.prevTouristTax}
                newTaxLabel={touristTaxFields?.newTaxLabel}
                newTaxPopupContent={touristTaxFields?.newTaxPopupContent}
                newTaxPopupTitle={touristTaxFields?.newTaxPopupTitle}
                prevTaxLabel={touristTaxFields?.prevTaxLabel}
            />
        ) : null;

    const paidToUsTextNode =
        showTouristTax && !isRefund && touristTaxFields?.paidToUsLabel ? (
            <span className={styles.paidToUs}>{touristTaxFields?.paidToUsLabel}</span>
        ) : null;

    const priceBreakdownProps: IPriceBreakdownDetailsProps = {
        totalPrice: subTotalPrice,
        feeChargePrice,
        fields,
        feesPerPersons,
        previousBalance,
        priceBreakdownItems,
        holidayCredit,
        currency,
        totalCostOfChangeField,
    };

    if (isMoreThenMobileViewport || !showStickyDesignOnMobile) {
        return (
            <section
                className={classNames(styles.desktopBreakdown, 'price-breakdown')}
                data-tid={`${DATA_TID}-desktop`}
            >
                <div className={classNames(containerClassName, styles.breakdownContainer)}>
                    <Text
                        field={priceBreakdownTitleField}
                        tag='h4'
                        data-tid={`${DATA_TID}-title`}
                        className={titleClassName}
                    />
                    <PriceBreakdownDetails {...priceBreakdownProps} />
                </div>
                <div
                    className={classNames(containerClassName, styles.breakdownSummary)}
                    data-tid={`${DATA_TID}-summary`}
                >
                    <div className={styles.summaryLeft}>
                        <Text tag='span' field={paymentField} data-tid={`${DATA_TID}-payment-instructions`} />
                        {paidToUsTextNode}
                    </div>
                    <span data-tid={`${DATA_TID}-transaction-amount`} className={styles.price}>
                        {transactionAmount}
                    </span>
                </div>
                {showTouristTax && (
                    <div className={classNames(containerClassName, styles.taxBreakdownContainer)}>
                        {touristTaxSummaryNode}
                    </div>
                )}
            </section>
        );
    }

    return (
        <>
            {isMobileDrawerOpened && <div className={styles.background} data-tid={`${DATA_TID}-background`} />}
            <StickyBox
                render={(): JSX.Element => (
                    <div
                        className={styles.priceBreakdownMobile}
                        data-tid={`${DATA_TID}-mobile-footer`}
                        ref={containerRef}
                    >
                        <HeightAnimatedContainer isOpened={isMobileDrawerOpened}>
                            <div
                                className={styles.contentContainer}
                                style={{ transform: `translateY(${translateY}px)` }}
                                data-tid={`${DATA_TID}-drawer`}
                            >
                                <Swipeable
                                    onSwiped={onSwipedMobileDrawer}
                                    onSwiping={onSwipingMobileDrawer}
                                    trackTouch
                                    trackMouse
                                    className={styles.swipe}
                                    delta={MIN_SWIPE_DISTANCE}
                                >
                                    <div className={styles.btnSwipe} data-tid={`${DATA_TID}-swipe`} />
                                    <Text
                                        field={priceBreakdownTitleField}
                                        tag='h4'
                                        data-tid={`${DATA_TID}-title`}
                                        className={styles.title}
                                    />
                                </Swipeable>
                                <PriceBreakdownDetails
                                    {...priceBreakdownProps}
                                    touristTaxSummaryNode={touristTaxSummaryNode}
                                />
                            </div>
                        </HeightAnimatedContainer>
                        <PriceBreakdownStickyBar
                            title={priceBreakdownTitleField}
                            paymentField={paymentField}
                            transactionAmount={transactionAmount}
                            isMobileDrawerOpened={isMobileDrawerOpened}
                            toggleMobileDrawer={toggleMobileDrawer}
                            paidToUsTextNode={paidToUsTextNode}
                        />
                    </div>
                )}
            />
        </>
    );
};

export default observer(PriceBreakdown);
