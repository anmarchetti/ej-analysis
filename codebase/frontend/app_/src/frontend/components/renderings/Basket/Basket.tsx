import React, { FunctionComponent, useEffect, useState } from 'react';
import { Transition } from 'react-transition-group';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import settings from 'code/settings';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { isTradeStore, ITradePortalStores } from 'frontend/store/tradePortal';
import { ExperimentTestIds, ExperimentVariants } from 'models/enum/cro/Experiment';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import StickyBox from 'frontend/components/common/StickyBox';
import BasketDiagonalCellsAB from 'frontend/components/cro/BasketAB/components/BasketDiagonalCellsAB';
import BasketVerticalCellsAB from 'frontend/components/cro/BasketVerticalCellsAB/BasketVerticalCellsAB';
import { Experiment, Variant } from 'frontend/components/cro/Experiment';
import { ISummaryBarSitecoreFields } from 'frontend/components/renderings/SummaryBar/SummaryBar.interfaces';

import BasketDiagonalCells from './components/BasketDiagonalCells';
import BasketVerticalCells from './components/BasketVerticalCells/BasketVerticalCells';
import NavigationTabs from './components/NavigationTabs/NavigationTabs';
import { INavigationTab, useNavigationTabsList } from './components/NavigationTabs/NavigationTabs.utils';

import styles from './Basket.module.scss';

export interface IBasketSitecoreFields extends ISummaryBarSitecoreFields {
    NavigationTabs: INavigationTab[];
}
interface IBasketSitecoreParams {
    IsNextButtonHidden: boolean;
}

export interface IBasketProps extends Partial<ISitecoreComponent<IBasketSitecoreFields, IBasketSitecoreParams>> {
    className?: string;
    isNotSticky?: boolean;
}

export const Basket: FunctionComponent<IBasketProps> = props => {
    const {
        offer,
        board,
        room,
        isPackageValid,
        totalPricePP,
        totalPrice,
        isScreenLessLarge,
        isScreenLessMedium,
        currency,
        setIsSearchPodExpanded,
        isSearchPodExpanded,
        isPriceVisible,
        isLoading,
        isLoadingOffer,
        isSummaryBarEnabled,
        isSummaryBarHidden,
        isExtrasPage,
        isGuestDetailsPage,
        isHotelDetailsPage,
    } = useStore((stores: TStores | ITradePortalStores) => ({
        offer: stores.bookingStore.selectedOffer,
        board: stores.bookingStore.boardType,
        room: stores.bookingStore.room,
        isPackageValid: stores.bookingStore.isPackageValid,
        totalPricePP: stores.bookingStore.totalPricePP,
        totalPrice: stores.bookingStore.totalPrice,
        isScreenLessLarge: stores.appStore.isScreenLessLarge,
        isScreenLessMedium: stores.appStore.isScreenLessMedium,
        currency: stores.bookingStore.currency,
        getPhrase: stores.layoutStore.getPhrase,
        setIsSearchPodExpanded: stores.searchStore.setIsSearchPodExpanded,
        isSearchPodExpanded: stores.searchStore.isSearchPodExpanded,
        isPriceVisible: !isTradeStore(stores) || !stores.layoutStore.isPricesHidden,
        isLoading: stores.appStore.isLoading,
        isLoadingOffer: stores.bookingStore.isLoadingOffer,
        isSummaryBarEnabled: stores.layoutStore.isSummaryBarEnabled,
        isSummaryBarHidden: stores.layoutStore.isSummaryBarHidden,
        isExtrasPage: stores.layoutStore.isExtrasPage,
        isGuestDetailsPage: stores.layoutStore.isGuestDetailsPage,
        isHotelDetailsPage: stores.layoutStore.isHotelDetailsBookPage,
    }));

    const [isExpanded, setIsExpanded] = useState<boolean>(false);
    const isSummaryBarShown = isSummaryBarEnabled && (isExtrasPage || isGuestDetailsPage);
    const minimumScreenSize = !isSummaryBarShown || isHotelDetailsPage ? isScreenLessMedium : isScreenLessLarge;
    const isDesktopBasketDisabled = !minimumScreenSize && isSummaryBarShown && !isSummaryBarHidden;

    useEffect(() => {
        if (minimumScreenSize) {
            document.querySelector('footer')?.setAttribute('style', `padding-bottom: 60px`);

            /** Calculate basket height based on UI. need to move chat bot icon to the top */
            const height = (document.querySelector('.basket') as any)?.offsetHeight || 60;
            document
                .querySelector('df-messenger')
                ?.shadowRoot?.querySelector('.df-messenger-wrapper')
                ?.setAttribute('style', `margin-bottom: ${height}px; z-index: 9999;`);
        }

        return () => {
            setIsSearchPodExpanded(false);

            if (minimumScreenSize) {
                document.querySelector('footer')?.removeAttribute('style');
                document
                    .querySelector('df-messenger')
                    ?.shadowRoot?.querySelector('.df-messenger-wrapper')
                    ?.removeAttribute('style');
            }
        };
    }, [minimumScreenSize, setIsSearchPodExpanded]);

    const { isNotSticky = false, params, className } = props;
    const { IsNextButtonHidden } = params || {};
    const tabsList = useNavigationTabsList(props.fields?.NavigationTabs);

    if ((isLoading || isLoadingOffer) && !offer) {
        return <div className={classNames(styles.placeholderBasket, 'placeholder-shimmer')} data-tid='shimmer' />;
    }

    if (!offer || isPackageValid === false || isDesktopBasketDisabled) {
        return null;
    }

    const toggleIsExpanded = (): void => setIsExpanded(st => !st);

    const basketClassName = (isNewSummaryBar: boolean = false): string =>
        classNames(
            'basket',
            IsNextButtonHidden && 'basket--booked',
            !!className && className,
            isNewSummaryBar ? styles.summaryBarBasket : '',
        );

    const isPricePPShown = totalPrice !== totalPricePP;

    const basketDiagonalCellsProps = {
        offer,
        board,
        room,
        className: 'diagonal',
        totalPricePP,
        isNextButtonVisible: !IsNextButtonHidden,
        isPricePPShown,
        isPriceVisible,
    };

    const renderDesktopBasket = (tabs: JSX.Element | null): JSX.Element => (
        <div className={classNames(styles.wrapper, basketClassName())}>
            <div className='basket__side-left' />
            <Experiment testId={ExperimentTestIds.Non}>
                <Variant testVariant={ExperimentVariants.VariantA}>
                    <BasketDiagonalCellsAB {...basketDiagonalCellsProps}>{tabs}</BasketDiagonalCellsAB>
                </Variant>

                <Variant default>
                    <BasketDiagonalCells {...basketDiagonalCellsProps}>{tabs}</BasketDiagonalCells>
                </Variant>
            </Experiment>
            <div className='basket__side-right' />
        </div>
    );

    const renderMobileBasket = (
        tabs: JSX.Element | null,
        isNewSummaryBar: boolean = true,
        isHidden: boolean = false,
    ): JSX.Element => (
        <>
            {tabs}
            <div
                className={classNames(basketClassName(isNewSummaryBar), {
                    [styles.isHidden]: isHidden,
                })}
                data-tid={isNewSummaryBar ? 'summary-bar' : 'summary-bar-old'}
            >
                <div className='basket__side-left' />
                <Experiment testId={ExperimentTestIds.Basket}>
                    <Variant testVariant={ExperimentVariants.VariantA}>
                        <BasketVerticalCellsAB
                            offer={offer}
                            board={board}
                            room={room}
                            className='vertical'
                            totalPricePP={totalPricePP}
                            openBoxDetails={toggleIsExpanded}
                            isNextButtonVisible={!IsNextButtonHidden}
                            isOpenSummaryBoxDetails={isExpanded}
                            isPricePPShown={isPricePPShown}
                            isPriceVisible={isPriceVisible}
                            currency={currency}
                        />
                    </Variant>

                    <Variant default>
                        <BasketVerticalCells
                            isNewSummaryBar={isNewSummaryBar}
                            offer={offer}
                            board={board}
                            room={room}
                            className='vertical'
                            totalPricePP={totalPricePP}
                            isExpanded={isExpanded}
                            toggleIsExpanded={toggleIsExpanded}
                            isNextButtonVisible={!IsNextButtonHidden}
                            isPricePPShown={isPricePPShown}
                            isPriceVisible={isPriceVisible}
                            currency={currency}
                            fields={props.fields}
                        />
                    </Variant>
                </Experiment>
                <div className='basket__side-right' />
            </div>

            {isExpanded && isNewSummaryBar && <div className={styles.summaryBarBasketBackground} />}
        </>
    );

    const renderBasket = (isSticky: boolean = false): JSX.Element => {
        const tabs = isSticky && isHotelDetailsPage && tabsList.length ? <NavigationTabs list={tabsList} /> : null;

        if (!minimumScreenSize) return renderDesktopBasket(tabs);

        if (isSummaryBarShown && isSummaryBarHidden) {
            return (
                <>
                    {renderMobileBasket(tabs, true, true)}
                    {renderMobileBasket(tabs, false, false)}
                </>
            );
        }

        return renderMobileBasket(tabs, isSummaryBarShown);
    };

    return (
        <div data-tid='basket-container'>
            <Transition
                in={minimumScreenSize || !isSearchPodExpanded}
                timeout={settings.Animation.DurationMs}
                mountOnEnter
                unmountOnExit
            >
                {(): JSX.Element =>
                    isNotSticky ? (
                        renderBasket()
                    ) : (
                        <StickyBox
                            render={(_, { isSticky }: { isSticky: boolean }): JSX.Element => renderBasket(isSticky)}
                        />
                    )
                }
            </Transition>
        </div>
    );
};

export default observer(Basket);
