import { FC, FunctionComponent } from 'react';
import { RichText } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { DATE_FORMATS } from 'code/dates';
import { Tokens } from 'code/tokens';
import { usePoster } from 'frontend/hooks/usePoster';
import useStore from 'frontend/hooks/useStore';
import { ITradePortalStores } from 'frontend/store/tradePortal';
import { addDays, parseDateL10n } from 'frontend/utils/date.utils';
import { getGuestsAmountByType, getRoomTypes } from 'frontend/utils/luggage.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { IPreBookingInfo } from 'models/data/IBookingInfo';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import LuxuryWrapper from 'frontend/components/common/LuxuryWrapper/LuxuryWrapper';
import { BookingQuoteLogos } from 'frontend/components/renderings/ExportHolidayDetails/components/BookingQuoteLogos/BookingQuoteLogos';
import { IExportHolidayQuoteFields } from 'frontend/components/renderings/ExportHolidayDetails/ExportHolidayDetails';
import BookingDetailsQuote from 'frontend/components/renderings/Payment/components/BookingDetailsExpanded/BookingDetailsQuote';
import PriceSummary from 'frontend/components/renderings/PriceSummary/PriceSummary';
import TradePortalViewBookingQuote from 'frontend/components/renderings/TradePortalViewBooking/TradePortalViewBookingQuote';
import { useSelectedTransfers } from 'frontend/components/renderings/Transfer/hooks/useTransfers';

import styles from './ExtrasLayout.module.scss';

interface IExtrasLayoutProps {
    dateText: string;
    fields: IExportHolidayQuoteFields;
    timeText: string;
    UMLogoImage?: string;
}

interface IExportHolidayFooterProps {
    footerContent?: ISitecoreField<string>;
    offerDate?: string;
    offerTime?: string;
}

const ExportHolidayFooter: FC<IExportHolidayFooterProps> = ({ footerContent, offerTime, offerDate }) => {
    const finalValue = Tokenizer.replaceTokens(footerContent?.value, {
        [Tokens.Date]: offerDate || '',
        [Tokens.Time]: offerTime || '',
    });

    return (
        <footer data-tid='export-holiday-details-footer'>
            <RichText field={{ value: finalValue }} />
        </footer>
    );
};

const ExtrasLayout: FunctionComponent<IExtrasLayoutProps> = ({ fields, timeText, dateText, UMLogoImage }) => {
    const {
        alternativeTransfers,
        hotelInfo,
        offer,
        packageInfo,
        selectedTransfers,
        agentInfo,
        isLuxuryPackage,
        getPhrase,
    } = useStore((stores: ITradePortalStores) => ({
        alternativeTransfers: stores.bookingStore.alternativeTransfers,
        hotelInfo: stores.bookingStore.hotel,
        offer: stores.bookingStore.selectedOffer,
        packageInfo: stores.bookingStore.packageInfo,
        selectedTransfers: stores.bookingStore.transfers,
        agentInfo: stores.userStore.agentInfo,
        isLuxuryPackage: stores.bookingStore.isLuxuryPackage,
        getPhrase: stores.layoutStore.getPhrase,
    }));
    const { posterId, hasEjLogo, hasUMLogo } = usePoster();

    const transfers = useSelectedTransfers(selectedTransfers, alternativeTransfers, packageInfo?.guests?.length || 0);

    if (!fields || !hotelInfo || !offer?.hotel || !packageInfo) {
        return null;
    }

    const { LogoImage, Logos } = fields;
    const startDate = parseDateL10n(offer.date, DATE_FORMATS.query);
    const endDate = addDays(offer.stay, startDate).toDateString();

    if (!startDate) {
        return null;
    }

    /**
     * Prepare IPreBookingInfo from existing data
     */
    const booking: IPreBookingInfo = {
        ...packageInfo,
        transfers,
        extraLuggageInfo: packageInfo.extraLuggageInfo || { items: [] },
        guests: packageInfo.guests || [],
        hotel: { ...hotelInfo },
        package: {
            ...offer,
            location: {
                country: hotelInfo.country?.name,
                region: hotelInfo.location?.name,
                city: hotelInfo.city,
            },
            accom: {
                ...offer.accom,
                hotel: offer.hotel,
                startDate: startDate?.toDateString(),
                rooms: offer.accom?.unit?.map(unit => ({ isFreeForKids: false, ...unit })),
                endDate,
            },
        },
        isLoggedInAsLeadPassenger: true,
    };

    const rooms = getRoomTypes(true, booking.package.accom);
    const transport = booking.package.transport;
    const hotel = booking.hotel;
    const transfer = booking.transfers[0];
    const board = offer?.accom?.unit?.[0]?.boardType;
    const guestsAmountByType = getGuestsAmountByType(booking, booking.package.accom);
    const luggageItems = booking.extraLuggageInfo.items;

    return (
        <div
            className={classNames(styles.poster, styles.globals, isLuxuryPackage && styles.posterLuxury)}
            id={posterId}
            data-tid='poster'
        >
            <div
                className={classNames([
                    styles.viewBookingToolbar,
                    { [styles.viewBookingToolbarLuxury]: isLuxuryPackage },
                ])}
                data-tid='poster-toolbar'
            >
                <div className={styles.viewBookingQuoteContainer}>
                    <BookingQuoteLogos
                        extraLogo={Logos}
                        logoImage={LogoImage}
                        UMLogoImage={UMLogoImage}
                        hasEjLogo={hasEjLogo}
                        hasUMLogo={hasUMLogo}
                        fields={fields}
                        dateText={dateText}
                        timeText={timeText}
                        agentName={agentInfo?.name}
                    />
                </div>
            </div>
            <LuxuryWrapper
                label={getPhrase(SitecoreDictionary.GlobalsLabelsLuxuryCollection)}
                renderChildrenOnly={!isLuxuryPackage}
                wrapperClassName={styles.luxuryWrapper}
                contentClassName={styles.luxuryContent}
                bannerClassName={styles.luxuryBanner}
            >
                <div className={styles.viewBookingContainer}>
                    <TradePortalViewBookingQuote booking={booking} />
                </div>
                <div>
                    <BookingDetailsQuote
                        rooms={rooms}
                        transport={transport}
                        hotel={hotel}
                        isShown
                        transfer={transfer}
                        board={board}
                        lateRoomCheckout={offer?.lateRoomCheckout}
                        guestsAmountByType={guestsAmountByType}
                        luggageItems={luggageItems}
                        fields={fields}
                    />
                </div>
                <div className={styles.priceBreakdownContainer}>
                    <PriceSummary isPrintPreview />
                </div>
                <ExportHolidayFooter
                    footerContent={fields.YourHolidayDisclaimerText}
                    offerTime={timeText}
                    offerDate={dateText}
                />
            </LuxuryWrapper>
        </div>
    );
};

export default observer(ExtrasLayout);
