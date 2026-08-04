import { FunctionComponent } from 'react';
import classNames from 'classnames';

import { SignDisplay } from 'code/currency';
import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { getPricePostfix } from 'frontend/utils/amendBooking.utils';
import { isFreeForKids } from 'frontend/utils/offer.utils';
import { IAmendHotelOffer } from 'models/data/bookingAmendment/AmendHotel';
import { IHotel } from 'models/data/IHotel';
import { IOffer } from 'models/data/IOffer';
import { CalloutOrientation, CalloutPosition } from 'models/enum/Callout';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import HotelPreviewLink from 'frontend/components/common/AmendSummary/HotelPreviewLink/HotelPreviewLink';
import Button from 'frontend/components/common/Button';
import Callout from 'frontend/components/common/Callout/Callout';
import FreeForKidsPill from 'frontend/components/common/Pills/FreeForKidsPill/FreeForKidsPill';

import styles from './AmendHotelOfferCardFooter.module.scss';

export interface IHotelOfferCardFields {
    BookHotelCTA: ISitecoreField<string>;
    PriceTooltip: ISitecoreField<string>;
    ViewHotelCTA: ISitecoreField<string>;
}

interface IAmendHotelOfferCardFooterProps {
    amendHotelOffer: IAmendHotelOffer;
    offer: IOffer;
    onSelectHotel: (e: React.MouseEvent) => void;
    fields?: IHotelOfferCardFields;
}

const AmendHotelOfferCardFooter: FunctionComponent<IAmendHotelOfferCardFooterProps> = ({
    onSelectHotel,
    offer,
    amendHotelOffer,
    fields,
}) => {
    const { getPhrase, formatMoney, redirectTo, setSelectedHotelDetailsOffer, trackClickViewBookingFromAmendHotel } =
        useStore((stores: IHolidaysStores) => ({
            getPhrase: stores.layoutStore.getPhrase,
            formatMoney: stores.marketStore.formatMoney,
            redirectTo: stores.routerStore.redirectTo,
            setSelectedHotelDetailsOffer: stores.amendHotelStore.setSelectedHotelDetailsOffer,
            trackClickViewBookingFromAmendHotel: stores.trackingStore.changeHotel.clickViewBookingFromAmendHotel,
        }));
    const isMobile = useMobileViewport();

    if (!fields) {
        return null;
    }

    const countryCode = offer.hotel?.country?.code;
    const isFreeForKidsPillShown = isFreeForKids(offer);

    const amendPriceLabel = formatMoney(offer.price, {
        currency: offer.currency?.code,
        maximumFractionDigits: 0,
        signDisplay: SignDisplay.ExceptZero,
    });

    const { PriceTooltip, BookHotelCTA, ViewHotelCTA } = fields;

    const { hotel } = offer;

    const handleMobileHotelPreviewClick = (hotelPreviewLink: string, hotel: IHotel): void => {
        setSelectedHotelDetailsOffer(amendHotelOffer, hotel);

        redirectTo(hotelPreviewLink);
    };

    const handleHotelPreviewClick = (hotelPreviewLink: string): void => {
        if (!amendHotelOffer || !hotel) return;

        trackClickViewBookingFromAmendHotel(amendHotelOffer, hotelPreviewLink);

        if (isMobile) {
            handleMobileHotelPreviewClick(hotelPreviewLink, hotel);
        }
    };

    return (
        <div className={styles.footer}>
            <div className={styles.pillContainer}>
                {isFreeForKidsPillShown && (
                    <FreeForKidsPill
                        countryCode={countryCode}
                        tooltipMessage={getPhrase(SitecoreDictionary.HolidayCardPromotionPillTooltipsFreeForKids)}
                    />
                )}
            </div>
            <div className={styles.greyBackground}>
                <div className={styles.price}>
                    <p data-tid='amend-hotel-price'>
                        {amendPriceLabel}
                        <span className={styles.pricePostFix}>
                            {getPricePostfix(getPhrase(SitecoreDictionary.PriceSummaryLabelsTotal), offer.price)}
                        </span>
                    </p>
                    {PriceTooltip && (
                        <Callout
                            content={<div data-tid='price-tooltip'>{PriceTooltip.value}</div>}
                            orientation={CalloutOrientation.Top}
                            position={CalloutPosition.Right}
                            isShownOnHover
                        />
                    )}
                </div>
                {ViewHotelCTA && hotel && amendHotelOffer && (
                    <HotelPreviewLink
                        clickHandler={handleHotelPreviewClick}
                        hotel={hotel}
                        className={classNames('btn btn--outlined btn--full-width', styles.viewHotelButton)}
                    >
                        {ViewHotelCTA.value}
                    </HotelPreviewLink>
                )}
                {BookHotelCTA && (
                    <Button onClick={onSelectHotel} data-tid='book-hotel-cta'>
                        {BookHotelCTA.value}
                    </Button>
                )}
            </div>
        </div>
    );
};

export default AmendHotelOfferCardFooter;
