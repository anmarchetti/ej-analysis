import { useEffect, useState } from 'react';

import { cmsUrls } from 'code/endpoints';
import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import {
    FreeForKidsChangeState,
    NewOfferState,
} from 'frontend/store/base/comparePricesCalendar/ComparePricesCalendarStore';
import { TStores } from 'frontend/store/IStores';
import { getDate } from 'frontend/utils/date.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { IAlternativeOffer } from 'models/data/IAlternativeOffers';
import { IUnit } from 'models/data/IOffer';
import ComparePriceModuleContentType from 'models/enum/ComparePriceModuleContentType';
import ComparePriceModuleVariant from 'models/enum/ComparePriceModuleVariant';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SiteSettings from 'models/enum/SiteSettings';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import { IAlterationResults } from 'frontend/components/common/BookingAlterationDrawer/BookingAlterationDrawer';
import { getHolidayDates } from 'frontend/components/common/PriceGraph/priceGraphUtils';
import { ITab } from 'frontend/components/common/Tabs/Tabs';
import { ISelectOfferOnPriceGraphProps } from 'frontend/components/renderings/AlternativeFlights/AlternativeFlights';
import CalendarTabContent, {
    CalendarTabTitle,
} from 'frontend/components/renderings/ComparePriceModule/components/CalendarTabContent/CalendarTabContent';
import { getComparePriceLabels } from 'frontend/components/renderings/ComparePriceModule/components/ComparePriceModuleToggle/ComparePriceModuleToggle.utils';
import {
    PriceGraphTabContent,
    PriceGraphTabTitle,
} from 'frontend/components/renderings/ComparePriceModule/components/PriceGraphTabContent/PriceGraphTabContent';

export interface IComparePriceModuleFields {
    ApplyWithChangesButtonText: ISitecoreField<string>;
    BackButtonText: ISitecoreField<string>;
    BoardChangeSubtitle: ISitecoreField<string>;
    BoardChangeTitle: ISitecoreField<string>;
    ChangingFromBoardLabel: ISitecoreField<string>;
    ChangingFromRoomLabel: ISitecoreField<string>;
    CheapestRoomPluralLabel: ISitecoreField<string>;
    CheapestRoomSingularLabel: ISitecoreField<string>;
    ConfirmationPopupIcon: ISitecoreField<ISitecoreImage>;
    ConfirmationPopupSubtitle: ISitecoreField<string>;
    ConfirmationPopupTitle: ISitecoreField<string>;
    ErrorPopupIcon: ISitecoreField<ISitecoreImage>;
    ErrorPopupSubtitle: ISitecoreField<string>;
    ErrorPopupTitle: ISitecoreField<string>;
    GainFreeChildPlaceSubtitle: ISitecoreField<string>;
    GainFreeChildPlaceTitle: ISitecoreField<string>;
    IsBestValueEnabled: ISitecoreField<string>;
    IsCheapestPriceDefault: ISitecoreField<boolean>;
    IsFreeForKidsIconEnabled: ISitecoreField<boolean>;
    IsPriceToggleEnabled: ISitecoreField<boolean>;
    KeepRoomPluralLabel: ISitecoreField<string>;
    KeepRoomSingularLabel: ISitecoreField<string>;
    LoadingErrorPopupSubtitle: ISitecoreField<string>;
    LoadingErrorPopupTitle: ISitecoreField<string>;
    LoadingText: ISitecoreField<string>;
    LoseFreeChildPlaceSubtitle: ISitecoreField<string>;
    LoseFreeChildPlaceTitle: ISitecoreField<string>;
    NewBoardLabel: ISitecoreField<string>;
    NewRoomLabel: ISitecoreField<string>;
    ReservationNotificationDescription: ISitecoreField<string>;
    ReservationNotificationTitle: ISitecoreField<string>;
    ReviewChangesSubTitle: ISitecoreField<string>;
    ReviewChangesTitle: ISitecoreField<string>;
    RoomChangeSubtitle: ISitecoreField<string>;
    RoomChangeTitle: ISitecoreField<string>;
    RoomOrBoardChangesAreRequiredLabel: ISitecoreField<string>;
    Variant: ISitecoreField<ComparePriceModuleVariant>;
}

export interface IComparePriceContentProps extends ISitecoreComponent<IComparePriceModuleFields> {
    holidayDuration: number;
    isResetingSelectedOffer: boolean;
    onClose: () => void;
    resetSelectedOffer: (offerInfo: ISelectOfferOnPriceGraphProps) => void;
    selectedDate: Date;
}

export interface IPopupProps {
    fullWidth: boolean;
    onClose: () => void;
}

export interface ITabsProps {
    onChange: (v: string) => void;
    tabs: ITab[];
}

export interface IUseComparePriceContentData {
    backButtonText: string;
    hideFreeChildPlaceInfoBox: boolean;
    isMobileView: boolean;
    isReviewPopupOpened: boolean;
    newTotalPrice: number;
    alterationResults?: IAlterationResults[];
    fallback?: string;
    footerProps?: {
        confirmButtonText: string;
        disabled: boolean;
        getPhrase: (key: string) => string;
        isCancelTransparent: boolean;
        isDisabled: boolean;
        onCancel: () => void;
        onClick: () => void;
    };
    freeChildPlaceInfoText?: ISitecoreField<string>;
    freeChildPlaceInfoTitle?: ISitecoreField<string>;
    onReviewPopupApply?: () => void;
    onReviewPopupClose?: () => void;
    popupProps?: IPopupProps;
    tabsProps?: ITabsProps;
}

export const useComparePriceContent = ({
    selectedDate,
    holidayDuration,
    onClose,
    resetSelectedOffer,
    fields,
    ...props
}: IComparePriceContentProps): IUseComparePriceContentData => {
    const {
        getPhrase,
        middleDate,
        isMobileView,
        resetToInitial,
        resetToInitialComparePricesCalendar,
        clearAlternativeOffers,
        changesRequired,
        freeForKidsChangeState,
        getAlternativeOfferPrice,
        getSetting,
        newOfferState,
        setNewOfferState,
        getBoardAlteration,
        getRoomAlterations,
        alternativeOffersMap,
        offerRoomsAllocationFromUrl,
        childrenQuantity,
        isCheapest,
        setIsCheapest,
        loadAlternativeOffersCalendar,
        loadAlternativeOffersPriceGraph,
        selectedOffer,
        priceGraphAlternativeOffers,
        isTouristTaxEnabled,
    } = useStore((stores: TStores) => ({
        isMobileView: stores.priceGraphStore.isMobileView,
        middleDate: stores.priceGraphStore.middleDate,
        getPhrase: stores.layoutStore.getPhrase,
        resetToInitial: stores.priceGraphStore.resetToInitial,
        clearAlternativeOffers: stores.priceGraphStore.clearAlternativeOffers,
        resetToInitialComparePricesCalendar: stores.comparePricesCalendarStore.resetToInitial,
        changesRequired: stores.comparePricesCalendarStore.changesRequired,
        freeForKidsChangeState: stores.comparePricesCalendarStore.freeForKidsChangeState,
        alternativeOffersMap: stores.comparePricesCalendarStore.alternativeOffersMap,
        getBoardAlteration: stores.comparePricesCalendarStore.getBoardAlteration,
        getRoomAlterations: stores.comparePricesCalendarStore.getRoomAlterations,
        getAlternativeOfferPrice: stores.comparePricesCalendarStore.getAlternativeOfferPrice,
        newOfferState: stores.comparePricesCalendarStore.newOfferState,
        setNewOfferState: stores.comparePricesCalendarStore.setNewOfferState,
        getSetting: stores.layoutStore.getSetting,
        offerRoomsAllocationFromUrl: stores.queryParamStore.offerRoomsAllocationFromUrl,
        childrenQuantity: stores.searchStore.searchWho.childrenQuantity,
        isCheapest: stores.layoutStore.isCheapestComparePriceOption,
        setIsCheapest: stores.layoutStore.setIsCheapestComparePriceOption,
        loadAlternativeOffersCalendar: stores.comparePricesCalendarStore.loadAlternativeOffers,
        loadAlternativeOffersPriceGraph: stores.priceGraphStore.loadAlternativeOffers,
        selectedOffer: stores.bookingStore.selectedOffer,
        priceGraphAlternativeOffers: stores.priceGraphStore.alternativeOffers,
        isTouristTaxEnabled: stores.layoutStore.isTouristTaxEnabled,
    }));

    const {
        Variant: { value: variant } = { value: ComparePriceModuleVariant.NothingVariant },
        IsBestValueEnabled: { value: IsBestValueEnabledValue } = { value: '' },
        RoomOrBoardChangesAreRequiredLabel: { value: changesLabel } = { value: '' },
        BackButtonText: { value: backButtonText } = { value: '' },
        RoomChangeTitle,
        RoomChangeSubtitle,
        BoardChangeTitle,
        BoardChangeSubtitle,
        NewBoardLabel,
        NewRoomLabel,
        IsFreeForKidsIconEnabled: { value: IsFreeForKidsIconEnabled } = { value: false },
        GainFreeChildPlaceTitle: { value: GainFreeChildPlaceTitle } = { value: '' },
    } = fields as IComparePriceModuleFields;

    const { PriceGraphFirstVariant: PriceFirst, PriceGraphOnlyVariant: PriceOnly } = ComparePriceModuleVariant;

    const initialActiveTab =
        variant === PriceOnly || variant === PriceFirst
            ? ComparePriceModuleContentType.Graph
            : ComparePriceModuleContentType.Calendar;

    const [activeDate, setActiveDate] = useState(new Date(selectedDate));
    const [activeTab, setActiveTab] = useState<ComparePriceModuleContentType>(initialActiveTab);
    const [isReviewPopupOpened, setIsReviewPopupOpened] = useState<boolean>(false);
    const fallbackImage = cmsUrls.media(getSetting(SiteSettings.HotelFallbackImage));

    useEffect(() => {
        const defaultValue = fields?.IsCheapestPriceDefault?.value ?? false;
        setIsCheapest(defaultValue);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(
        () => () => {
            resetToInitial();
            clearAlternativeOffers();

            resetToInitialComparePricesCalendar();
        },

        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    );

    if (variant === ComparePriceModuleVariant.NothingVariant)
        return {
            isMobileView,
            footerProps: undefined,
            popupProps: undefined,
            tabsProps: undefined,
            isReviewPopupOpened: false,
            hideFreeChildPlaceInfoBox: true,
            newTotalPrice: 0,
            backButtonText: '',
        };

    const getOfferForDate = (date: Date): IAlternativeOffer | undefined => {
        if (activeTab === ComparePriceModuleContentType.Graph) {
            return priceGraphAlternativeOffers.find(offer => getDate(offer.date).getTime() === date.getTime());
        }

        return alternativeOffersMap.get(date.getTime());
    };

    const applyNewOffer = (): void => {
        const altOffer = getOfferForDate(activeDate);
        const rooms = altOffer?.rooms?.map(r => r.roomCode);
        const roomsWithNewCodes = offerRoomsAllocationFromUrl;

        if (rooms && rooms.length >= offerRoomsAllocationFromUrl.length) {
            roomsWithNewCodes.forEach((room, i) => (room.roomCode = rooms[i] ?? room.roomCode));
        }

        isReviewPopupOpened && setIsReviewPopupOpened(false);
        resetSelectedOffer({
            newDate: activeDate,
            board: altOffer?.boardType?.code,
            rooms: roomsWithNewCodes,
            inboundRouteId: altOffer?.inboundRouteId,
            outboundRouteId: altOffer?.outboundRouteId,
            newAccommodationId: altOffer?.accommodationId,
            handleError: () => setNewOfferState(NewOfferState.Error),
        });
        onClose();
        newOfferState !== NewOfferState.Error && setNewOfferState(NewOfferState.Accepted);
    };

    const isDisabled = activeDate.getTime() === selectedDate.getTime();

    const dates = getHolidayDates(activeDate, holidayDuration);
    const holidayDurationLabel = isMobileView
        ? `${dates.departure} -  ${dates.return}`
        : Tokenizer.replaceTokens(getPhrase(SitecoreDictionary.PriceGraphLabelsHolidayDates), {
              [Tokens.Departure]: dates.departure,
              [Tokens.Return]: dates.return,
          });

    const touristTaxLabel = getPhrase(SitecoreDictionary.TouristTaxLabelsPricesIncludeLocalTax);

    const { keepRoomLabel, cheapestRoomLabel } = getComparePriceLabels(selectedOffer, fields);

    const offer = getOfferForDate(activeDate);
    const { unit: items } = selectedOffer?.accom ?? { unit: [] as IUnit[] };

    const defaultToggleProps = {
        keepRoomLabel,
        cheapestRoomLabel,
        isEnabled: fields?.IsPriceToggleEnabled?.value ?? false,
        selectedDate,
        setActiveDate,
        hasTouristTaxLabel: isTouristTaxEnabled && !!touristTaxLabel,
    };

    const priceGraphTab =
        variant !== ComparePriceModuleVariant.CalendarOnlyVariant
            ? {
                  title: <PriceGraphTabTitle />,
                  key: ComparePriceModuleContentType.Graph,
                  content: (
                      <PriceGraphTabContent
                          {...{
                              holidayDurationLabel,
                              selectedDate,
                              changeActiveDate: setActiveDate,
                              middleDate: middleDate || selectedDate,
                              isDisplayed: activeTab === ComparePriceModuleContentType.Graph,
                              touristTaxLabel: touristTaxLabel,
                              toggleProps: {
                                  ...defaultToggleProps,
                                  onReload: loadAlternativeOffersPriceGraph,
                              },
                          }}
                      />
                  ),
              }
            : null;

    const calendarTab =
        variant !== ComparePriceModuleVariant.PriceGraphOnlyVariant
            ? {
                  title: <CalendarTabTitle />,
                  key: ComparePriceModuleContentType.Calendar,
                  content: (
                      <CalendarTabContent
                          {...{
                              getPhrase,
                              holidayDurationLabel,
                              holidayDuration,
                              isMobileView,
                              fields,
                              activeDate,
                              selectedDate,
                              isResetingSelectedOffer: props.isResetingSelectedOffer,
                              setActiveDate,
                              isPromoDisplayed: !!IsBestValueEnabledValue,
                              isFreeForKidsDisplayed: IsFreeForKidsIconEnabled && !!childrenQuantity,
                              isDisplayed: activeTab === ComparePriceModuleContentType.Calendar,
                              changesLabel,
                              freeForKidsLabel: GainFreeChildPlaceTitle,
                              touristTaxLabel: touristTaxLabel,
                              isCheapest,
                              toggleProps: {
                                  ...defaultToggleProps,
                                  onReload: loadAlternativeOffersCalendar,
                              },
                          }}
                      />
                  ),
              }
            : null;

    const tabs = [priceGraphTab, calendarTab].filter(Boolean) as ITab[];

    const freeChildStatus = freeForKidsChangeState(offer, items);

    const isChanged = changesRequired(offer, items, activeDate);

    const freeChildPlaceInfoTitle =
        freeChildStatus === FreeForKidsChangeState.Removed
            ? fields?.LoseFreeChildPlaceTitle
            : fields?.GainFreeChildPlaceTitle;

    const freeChildPlaceInfoText =
        freeChildStatus === FreeForKidsChangeState.Removed
            ? fields?.LoseFreeChildPlaceSubtitle
            : fields?.GainFreeChildPlaceSubtitle;

    return {
        isMobileView,
        popupProps: {
            fullWidth: true,
            onClose,
        },
        tabsProps: {
            onChange: (v: ComparePriceModuleContentType): void => {
                setActiveTab(v);
                setActiveDate(selectedDate);
            },
            tabs: variant === PriceFirst ? tabs : tabs.reverse(),
        },
        isReviewPopupOpened,
        onReviewPopupClose: () => setIsReviewPopupOpened(false),
        onReviewPopupApply: applyNewOffer,
        freeChildPlaceInfoTitle,
        freeChildPlaceInfoText,
        hideFreeChildPlaceInfoBox: freeChildStatus === FreeForKidsChangeState.Stable,
        newTotalPrice: getAlternativeOfferPrice(offer),
        backButtonText: backButtonText,
        fallback: fallbackImage,
        alterationResults: [
            ...getBoardAlteration(offer, items, BoardChangeTitle, BoardChangeSubtitle, NewBoardLabel),
            ...getRoomAlterations(offer, items, RoomChangeTitle, RoomChangeSubtitle, NewRoomLabel),
        ],
        footerProps: {
            isCancelTransparent: true,
            onCancel: onClose,
            isDisabled,
            disabled: isDisabled,
            onClick: isChanged ? (): void => setIsReviewPopupOpened(true) : applyNewOffer,
            getPhrase,
            confirmButtonText: isChanged
                ? getPhrase(SitecoreDictionary.PriceGraphButtonsReview)
                : getPhrase(SitecoreDictionary.PriceGraphButtonsApply),
        },
    };
};

export default useComparePriceContent;
