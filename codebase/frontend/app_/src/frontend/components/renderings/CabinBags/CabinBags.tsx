import { FC, useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { useLuxuryInternalFlight } from 'frontend/hooks/useLuxuryInternalFlight';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { isTradeStore } from 'frontend/store/tradePortal';
import { getLCBPriceLabel } from 'frontend/utils/seatAndBags.utils';
import { removeWebStorageItem } from 'frontend/utils/webStorage.utils';
import { IAncillariesContentItem } from 'models/data/IAncillariesContentItem';
import { ICabinBagsFields } from 'models/data/ICabinBagsFields';
import ScrollAnchorId from 'models/enum/ScrollAnchorId';
import { WebStorageKeys } from 'models/enum/WebStorageKeys';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import Ancillaries, { IAncillariesParams } from 'frontend/components/common/Ancillaries/Ancillaries';
import { OutlineBannerContext } from 'frontend/components/common/OutlineBanner/OutlineBanner';
import { OutlineBannerTheme } from 'frontend/components/common/OutlineBanner/OutlineBannerTheme';
import CabinBagsActionPanel from 'frontend/components/renderings/CabinBags/components/CabinBagsActionPanel/CabinBagsActionPanel';
import CabinBagsDropdown from 'frontend/components/renderings/CabinBags/components/CabinBagsDropdown/CabinBagsDropdown';
import CabinBagsRouteInfo from 'frontend/components/renderings/CabinBags/components/CabinBagsRouteInfo/CabinBagsRouteInfo';

import CabinBagsBanners from './components/CabinBagsBanners/CabinBagsBanners';

import styles from './CabinBags.module.scss';

export type TCabinBagsProps = ISitecoreComponent<ICabinBagsFields, IAncillariesParams>;

export const CabinBags: FC<TCabinBagsProps> = ({ fields, params }) => {
    const {
        adultsAndChildrenNumber,
        getLargeCabinBagsFormattedPrice,
        isPriceVisible,
        isPostBookingPages,
        isViewBookingPage,
        isLCBUnavailable,
        isFlightExternal,
        isLoading,
        isExtrasPage,
        isBookingOutOfSync,
        isLuxuryPackage,
        shouldPromoteBags,
        setLCBGreenPromoShown,
    } = useStore((stores: TStores) => ({
        isFlightExternal: stores.bookingStore.isFlightExternal || stores.viewBookingStore.isFlightExternal,
        adultsAndChildrenNumber: stores.guestDetailsStore.adultsAndChildrenNumber,
        isLCBUnavailable: stores.bookingStore.extraLuggage.isLCBAddingUnavailable,
        getLargeCabinBagsFormattedPrice: stores.bookingStore.extraLuggage.getLargeCabinBagsFormattedPrice,
        isPriceVisible: !isTradeStore(stores) || !stores.layoutStore.isPricesHidden,
        isPostBookingPages: stores.layoutStore.isPostBookingPages,
        isExtrasPage: stores.layoutStore.isExtrasPage,
        isViewBookingPage: stores.layoutStore.isViewBookingPage,
        isLoading: stores.appStore.isLoading,
        isBookingOutOfSync: stores.viewBookingStore.isBookingOutOfSync,
        isLuxuryPackage: stores.bookingStore.isLuxuryPackage,
        shouldPromoteBags: stores.layoutStore.shouldPromoteBags,
        setLCBGreenPromoShown: stores.bookingStore.extraLuggage.setLCBGreenPromoShown,
    }));

    const [isCabinBagsDropdownExpanded, setIsCabinBagsDropdownExpanded] = useState(isPostBookingPages);
    const isLuxuryInternalFlight = useLuxuryInternalFlight();
    const outlineTheme = useMemo(() => {
        if (isLuxuryPackage && isExtrasPage) {
            return { theme: OutlineBannerTheme.LuxuryTheme };
        }

        if (shouldPromoteBags && !isLCBUnavailable && isExtrasPage) {
            return { theme: OutlineBannerTheme.PromoTheme };
        }

        return { theme: OutlineBannerTheme.NoTheme };
    }, [isLuxuryPackage, isExtrasPage, shouldPromoteBags, isLCBUnavailable]);

    useEffect(() => {
        setLCBGreenPromoShown(outlineTheme.theme === OutlineBannerTheme.PromoTheme);
    }, [outlineTheme.theme, setLCBGreenPromoShown]);

    if (!fields || isLuxuryInternalFlight) {
        return null;
    }

    if (isLoading && isExtrasPage) {
        return (
            <div
                className={classNames(styles.container, styles.placeholderCabinBags, 'placeholder-shimmer')}
                data-tid='shimmer'
            />
        );
    }

    const {
        Icon,
        OutboundIcon,
        ReturnIcon,
        Title,
        OutlineBannerTextContent,
        DefaultContent,
        LuxuryContent,
        UnavailableLCBContent,
    } = fields;

    const formattedPrice = getLargeCabinBagsFormattedPrice(false, true);
    const hasPrice = Boolean(formattedPrice);

    const onCabinBagsDropdownExpandedChange = (isExpanded: boolean): void => {
        setIsCabinBagsDropdownExpanded(isExpanded);
    };

    const contentItem = (): IAncillariesContentItem | undefined => {
        if (isLuxuryPackage) {
            return LuxuryContent?.fields;
        }

        if (isLCBUnavailable) {
            return UnavailableLCBContent?.fields;
        }

        const priceLabel = getLCBPriceLabel(formattedPrice, DefaultContent?.fields.Description);

        return {
            Subtitle: DefaultContent?.fields.Subtitle || { value: '' },
            Description: !isPriceVisible ? fields.DescriptionWithoutPrice : { value: priceLabel },
        };
    };

    const content = contentItem();

    const ancillariesFields = {
        Icon,
        OutboundIcon,
        ReturnIcon,
        Title,
        OutlineBannerTextContent,
    };

    if (isExtrasPage) {
        removeWebStorageItem(WebStorageKeys.CabinBagsUrgencyMessageText, sessionStorage);
    }

    return (
        <div
            className={classNames(
                isPostBookingPages ? styles.containerAlt : styles.container,
                !isFlightExternal && styles.internalFlightContainer,
            )}
            data-tid='large-cabin-bags'
        >
            <div id={ScrollAnchorId.CabinBags} aria-hidden='true' data-tid='cabin-bags-scroll-anchor' />
            {isViewBookingPage && !isBookingOutOfSync && <CabinBagsBanners fields={fields} hasPrice={hasPrice} />}
            <OutlineBannerContext.Provider value={outlineTheme}>
                <Ancillaries
                    fields={ancillariesFields}
                    Subtitle={content?.Subtitle}
                    Description={content?.Description}
                    params={params}
                    actionPanel={!isLCBUnavailable && !isLuxuryPackage && <CabinBagsActionPanel fields={fields} />}
                    outboundSelection={
                        <CabinBagsRouteInfo
                            numberOfBags={adultsAndChildrenNumber}
                            fields={fields}
                            isOverheadShown={!isLCBUnavailable}
                        />
                    }
                    inboundSelection={
                        <CabinBagsRouteInfo
                            numberOfBags={adultsAndChildrenNumber}
                            fields={fields}
                            isOverheadShown={!isLCBUnavailable}
                        />
                    }
                    isCabinBags
                    banners={
                        !isPostBookingPages && isFlightExternal ? (
                            <CabinBagsBanners fields={fields} hasPrice={hasPrice} />
                        ) : null
                    }
                >
                    {(!isLCBUnavailable || isPostBookingPages) && (
                        <CabinBagsDropdown
                            fields={fields}
                            isExpanded={isCabinBagsDropdownExpanded}
                            onExpandChange={onCabinBagsDropdownExpandedChange}
                        />
                    )}
                </Ancillaries>
            </OutlineBannerContext.Provider>
        </div>
    );
};

export default observer(CabinBags);
