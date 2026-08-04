import { useEffect, useMemo, useState } from 'react';

import { cmsUrls } from 'code/endpoints';
import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { MarketStore } from 'frontend/store/base';
import { BaseLayoutStore } from 'frontend/store/base/layout/BaseLayoutStore';
import { LayoutStore } from 'frontend/store/holidays';
import { BookingStore } from 'frontend/store/holidays/booking/BookingStore';
import RouterStore from 'frontend/store/holidays/router/RouterStore';
import { isTradeStore } from 'frontend/store/tradePortal';
import { distanceInfo, distanceTextFromSitecore } from 'frontend/utils/getHotelLocation';
import { containsLuxuryPromoCode } from 'frontend/utils/offer.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { getTouristTaxFieldsFromOffer } from 'frontend/utils/touristTax.utils';
import { IHotel, IImage } from 'models/data/IHotel';
import { IOffer, IOfferWithHotelData } from 'models/data/IOffer';
import { IStop } from 'models/data/map/IItinerary';
import { IGeoPoint } from 'models/data/map/IMap';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SiteSettings from 'models/enum/SiteSettings';
import { getFormattedPrice } from 'frontend/components/common/MapComponent/Clusters/ClusteredMarkers.utils';
import { TouristTaxPriceLabel } from 'frontend/components/common/TouristTaxPriceLabel/TouristTaxPriceLabel';
import { TouristTaxPriceTooltip } from 'frontend/components/common/TouristTaxPriceTooltip/TouristTaxPriceTooltip';
import SvgHotelBedFilled from 'frontend/components/icons-new/HotelBedFilled';
import SvgLocationPinFilled from 'frontend/components/icons-new/LocationPinFilled';

import styles from './MapCard.module.scss';

export const onWheel = e => (e.nativeEvent['cancelBubble'] = true);

interface IGetOptionsArgs {
    formatMoney: MarketStore['formatMoney'];
    getFormattedNumber: MarketStore['getFormattedNumber'];
    getPhrase: BaseLayoutStore['getPhrase'];
    isPricePerPerson: boolean;
    deposit?: string;
    hotel?: IHotel;
    offer?: IOfferWithHotelData;
}

export interface IMapConfigOptions {
    content: string | React.ReactElement;
    key: number;
    contentClassName?: string;
    dataTid?: string;
    icon?: JSX.Element | string;
    itemClassName?: string;
}

export const DEPOSIT_KEY = 6;
export const PRICE_KEY = 7;
export const PRICE_PP_KEY = 8;
export const TOURIST_TAX_KEY = 9;

export const addPriceToOptions = ({
    deposit,
    options,
    getPhrase,
    formatMoney,
    offer,
    isPricePerPerson,
}: {
    formatMoney: MarketStore['formatMoney'];
    getPhrase: BaseLayoutStore['getPhrase'];
    isPricePerPerson: boolean;
    offer: IOfferWithHotelData;
    options: IMapConfigOptions[];
    deposit?: string;
}): IMapConfigOptions[] => {
    const { price, pricePP, priceExcludingTouristTax, pricePPExcludingTouristTax } = offer;

    if (deposit) {
        options.push({
            content: Tokenizer.replaceToken(
                getPhrase(SitecoreDictionary.SearchResultsLabelsHotelDeposit),
                Tokens.DepositPrice,
                deposit,
            ),
            contentClassName: styles.pill,
            key: DEPOSIT_KEY,
        });
    }

    if (priceExcludingTouristTax) {
        options.push({
            content: getFormattedPrice({
                price: priceExcludingTouristTax,
                isPricePerPerson: false,
                getPhrase,
                formatMoney,
            }),
            itemClassName: styles.price,
            dataTid: 'map-card-price',
            key: PRICE_KEY,
        });
    }

    if (pricePPExcludingTouristTax) {
        options.push({
            content: `${getPhrase(SitecoreDictionary.GlobalsLabelsFrom)} ${getFormattedPrice({
                price: pricePPExcludingTouristTax,
                isPricePerPerson: true,
                getPhrase,
                formatMoney,
            })}`,
            itemClassName: styles.pricePP,
            dataTid: 'map-card-price-pp',
            key: PRICE_PP_KEY,
        });
    }

    if (priceExcludingTouristTax) {
        const { touristTax, touristTaxPP, taxesAndFees } = getTouristTaxFieldsFromOffer(offer);

        options.push({
            content: (
                <TouristTaxPriceTooltip touristTax={touristTax} taxesAndFees={taxesAndFees}>
                    <TouristTaxPriceLabel
                        isPricePP={isPricePerPerson}
                        touristTax={touristTax}
                        touristTaxPP={touristTaxPP}
                        price={price}
                        pricePP={pricePP}
                    />
                </TouristTaxPriceTooltip>
            ),
            itemClassName: styles.tax,
            dataTid: 'map-card-tourist-tax',
            key: TOURIST_TAX_KEY,
        });
    }

    return options;
};

export const getOptions = ({
    offer,
    hotel,
    deposit,
    getPhrase,
    getFormattedNumber,
    formatMoney,
    isPricePerPerson,
}: IGetOptionsArgs): IMapConfigOptions[] => {
    if (!offer && !hotel) return [];

    const options: IMapConfigOptions[] = [];

    const { accom, price } = offer || {};
    const unit = accom?.unit?.[0];
    const { code: unitCode = '', board: boardCode = '' } = unit || {};
    const [roomCode = ''] = unitCode.split('!');

    const { strapline, boardTypes = [], roomTypes = [] } = hotel as IHotel;

    const boardType = boardTypes.find(({ code }) => code === boardCode) || unit?.boardType;
    const roomType = roomTypes.find(({ code }) => code === roomCode) || unit?.roomType;

    if (strapline) {
        options.push({
            content: strapline,
            key: 0,
        });
    }

    const { closestFacility, theme, hotelTheme } = hotel as IHotel;

    if (closestFacility?.distance) {
        options.push({
            content: distanceInfo(
                closestFacility,
                distanceTextFromSitecore(closestFacility, getPhrase, theme || hotelTheme),
                false,
                getFormattedNumber,
            ),
            icon: <SvgLocationPinFilled />,
            key: 1,
        });
    }

    if (roomType?.title || roomType?.name) {
        options.push({
            content: (roomType.title || roomType.name) as string,
            icon: roomType.iconUrl ? cmsUrls.media(roomType.iconUrl) : <SvgHotelBedFilled />,
            key: 2,
        });
    }

    if (boardType?.title || boardType?.name) {
        options.push({
            content: (boardType.title || boardType.name) as string,
            icon: cmsUrls.media(boardType.iconUrl),
            key: 3,
        });
    }

    if (!roomType && !boardType) {
        if (hotel?.ksp1 || hotel?.keySellingPoint1) {
            options.push({
                content: hotel.ksp1 || hotel.keySellingPoint1,
                key: 4,
            });
        }

        if (hotel?.ksp2 || hotel?.keySellingPoint2) {
            options.push({
                content: hotel.ksp2 || hotel.keySellingPoint2,
                key: 5,
            });
        }
    }

    if (!price) return options;

    return addPriceToOptions({ offer: offer!, options, formatMoney, getPhrase, deposit, isPricePerPerson });
};

export interface IUseMapCardProps {
    cache: Map<string, IOfferWithHotelData>;
    setSelected: (d) => void;
    hotel?: IGeoPoint;
    stop?: IStop;
}

export interface IUseMapCardData {
    content: {
        description?: string;
        duration?: string[];
        fallbackImage?: string;
        hidden?: boolean;
        images?: IImage[];
        list?: IMapConfigOptions[];
        name?: string;
        numberOfReviews?: number;
        rating?: number;
        starRating?: number;
    };
    isLoading: boolean;
    isLuxury: boolean;
    onClose: () => void;
    button?: {
        link: string;
        onClick: (e) => void;
        title: string;
    };
}

export const getContent = ({
    stop,
    hotel,
    list,
    hidden,
    fallbackImage,
    getPhrase,
}: {
    fallbackImage: string;
    getPhrase: BaseLayoutStore['getPhrase'];
    hidden: boolean;
    hotel?: Nullable<IHotel>;
    list?: IMapConfigOptions[];
    stop?: IStop;
}): IUseMapCardData['content'] => {
    if (!stop && !hotel) return {};

    if (stop) {
        const { name, description, duration, images } = stop;
        const fallbackImageUrl = cmsUrls.media(fallbackImage);

        return {
            name,
            description,
            duration: [
                getPhrase(SitecoreDictionary.ItineraryTooltipTextStart).replace('...', ' '),
                `${duration} ${getPhrase(
                    Number(duration) == 1
                        ? SitecoreDictionary.GlobalsLabelsTimeHourSingularAbbr
                        : SitecoreDictionary.GlobalsLabelsTimeHoursPluralAbbr,
                )}`,
                getPhrase(SitecoreDictionary.ItineraryTooltipTextEnd),
            ],
            images,
            fallbackImage: fallbackImageUrl,
        };
    }

    const { name, rating, numberOfReviews, starRating, images } = hotel as IHotel;

    return {
        name,
        rating,
        numberOfReviews,
        starRating: +starRating,
        list,
        hidden,
        images,
        fallbackImage: cmsUrls.media(fallbackImage),
    };
};

export const getButtonData = ({
    ignore,
    getMapCardLink,
    onClick,
    data,
    booking,
    getPhrase,
}: {
    booking: boolean;
    data: IOffer;
    getMapCardLink: RouterStore['getMapCardLink'];
    getPhrase: LayoutStore['getPhrase'];
    ignore: boolean;
    onClick: BookingStore['onMapCardButtonClick'];
}): IUseMapCardData['button'] => {
    if (ignore) return undefined;

    const url = getMapCardLink({
        offer: data,
        isSelected: booking,
        url: (data?.hotel || data)?.['url'],
    });

    return {
        link: url,
        title: booking
            ? getPhrase(SitecoreDictionary.GlobalsButtonsBookNow)
            : getPhrase(SitecoreDictionary.GlobalsButtonsView),
        onClick: (e): void => {
            e.preventDefault();
            e.stopPropagation();

            onClick({
                booking,
                url,
                data,
            });
        },
    };
};

const useMapCard = ({ hotel, stop, setSelected, cache }: IUseMapCardProps): IUseMapCardData => {
    const [data, setData] = useState<IOfferWithHotelData | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const {
        getPhrase,
        getSetting,
        getFormattedNumber,
        formatMoney,
        offer,
        defaultDepositPrice,
        hidden,
        fetchMapItem,
        getMapCardLink,
        onClick,
        isPricePerPerson,
    } = useStore(stores => ({
        fetchMapItem: stores.hotelsStore.fetchMapItem,
        getMapCardLink: stores.routerStore.getMapCardLink,
        offer: stores.bookingStore.selectedOffer,
        isHotelDetailsBrowsePage: stores.layoutStore.isHotelDetailsBrowsePage,
        getPhrase: stores.layoutStore.getPhrase,
        getSetting: stores.layoutStore.getSetting,
        getFormattedNumber: stores.marketStore.getFormattedNumber,
        formatMoney: stores.marketStore.formatMoney,
        defaultDepositPrice: stores.marketStore.defaultDepositPrice,
        validateSearchParameters: stores.searchStore.validateSearchParameters,
        hidden: isTradeStore(stores) && stores.layoutStore.isPricesHidden,
        onClick: stores.bookingStore.onMapCardButtonClick,
        isPricePerPerson: stores.layoutStore.isSearchResultsPage
            ? stores.searchFiltersStore.isPriceFilterPerPerson
            : true,
    }));

    useEffect(() => {
        if (!hotel) return;

        const { id: hotelId } = hotel.properties;
        const isOffer = hotelId === offer?.accom?.id;

        // if hotel data is already in cache or selected-offer is the same hotel
        // not needed to fetch it again
        if (cache.has(hotelId) || isOffer) {
            setData(cache.get(hotelId)! || offer);

            return;
        }

        setIsLoading(true);

        fetchMapItem(hotelId)
            .then(res => {
                const item = res['offers'] ? res['offers'][0] : res;

                cache.set(hotelId, item);

                setData(item);
                setIsLoading(false);
            })
            .catch(() => setSelected(null));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const list = useMemo(() => {
        if (!hotel || !data) return [];

        return getOptions({
            offer: data,
            hotel: (data.hotel || data) as IHotel,
            deposit: data.deposit ? defaultDepositPrice : '',
            getPhrase,
            getFormattedNumber,
            formatMoney,
            isPricePerPerson,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, isPricePerPerson]);

    return {
        isLoading: isLoading || (!data && !stop),
        onClose: () => setSelected(null),
        isLuxury: stop ? false : containsLuxuryPromoCode(data?.promoCollections),
        content: getContent({
            stop,
            hotel: (data?.hotel || data) as IHotel,
            list,
            hidden,
            fallbackImage: getSetting(SiteSettings.HotelFallbackImage) || '',
            getPhrase,
        }),
        button: getButtonData({
            ignore: !!stop,
            getMapCardLink,
            onClick,
            data: data as IOffer,
            booking: !!hotel?.properties.name,
            getPhrase,
        }),
    };
};

export default useMapCard;
