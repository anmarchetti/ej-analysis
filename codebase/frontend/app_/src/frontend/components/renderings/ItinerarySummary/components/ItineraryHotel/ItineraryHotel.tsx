import { FC, useState } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { copyToClipboard } from 'frontend/utils/clipboard.utils';
import { buildHotelDetailsUrl, getHotelAddress, getHotelCoordinates } from 'frontend/utils/getHotelLocation';
import { getRoomsMeta } from 'frontend/utils/HolidaySummaryRoom.utils';
import { buildGetDirectionsGoogleMapsUrl } from 'frontend/utils/map.utils';
import { IBookingInfo } from 'models/data/IBookingInfo';
import { IUnit } from 'models/data/IOffer';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import StarRating from 'frontend/components/common/StarRating';
import SvgChevronRight from 'frontend/components/icons-new/ChevronRight';
import SvgCopySimple from 'frontend/components/icons-new/CopySimple';
import SvgHotelFilled from 'frontend/components/icons-new/HotelFilled';
import TripadvisorInfo from 'frontend/components/renderings/HotelDetails/components/TripadvisorInfo';
import GetDirectionsPopup from 'frontend/components/renderings/ItinerarySummary/components/GetDirectionsPopup/GetDirectionsPopup';
import ItineraryItem from 'frontend/components/renderings/ItinerarySummary/components/ItineraryItem/ItineraryItem';
import ItineraryItemSubtitle from 'frontend/components/renderings/ItinerarySummary/components/ItineraryItemSubtitle/ItineraryItemSubtitle';
import { getHotelMeta } from 'frontend/components/renderings/ViewBooking/components/Hotel/ViewBookingHotel.utils';

import styles from './ItineraryHotel.module.scss';

export interface IItineraryHotelProps {
    AddressLabel: ISitecoreField<string>;
    AppleMapsLabel: ISitecoreField<string>;
    CloseDrawerLabel: ISitecoreField<string>;
    DirectionsLabel: ISitecoreField<string>;
    GoogleMapsLabel: ISitecoreField<string>;
    HotelDetailsLabel: ISitecoreField<string>;
    HotelTitle: ISitecoreField<string>;
    MapsApplicationLabel: ISitecoreField<string>;
    RoomsLabelPlural: ISitecoreField<string>;
    RoomsLabelSingular: ISitecoreField<string>;
    booking: IBookingInfo;
    isExpanded: boolean;
    setExpanded: () => void;
    className?: string;
}

const ItineraryHotel: FC<IItineraryHotelProps> = ({
    RoomsLabelSingular,
    RoomsLabelPlural,
    booking,
    HotelDetailsLabel,
    HotelTitle,
    isExpanded,
    setExpanded,
    AddressLabel,
    DirectionsLabel,
    AppleMapsLabel,
    GoogleMapsLabel,
    MapsApplicationLabel,
    CloseDrawerLabel,
    className,
}) => {
    const { basePath, getPhrase, isLuxuryPackage, isFlightAndHotelPackage } = useStore((store: IHolidaysStores) => ({
        basePath: store.layoutStore.basePath,
        getPhrase: store.layoutStore.getPhrase,
        isLuxuryPackage: store.viewBookingStore.isLuxuryPackage,
        isFlightAndHotelPackage: store.viewBookingStore.isFlightAndHotelPackage,
    }));

    const [isPopupShown, setIsPopupShown] = useState(false);

    const isMobile = useMobileViewport();

    const {
        hotelName,
        taRating,
        starRating,
        numberOfReviews,
        accom: { rooms },
    } = getHotelMeta(booking);

    const { hotel } = booking;
    const [roomsMeta] = getRoomsMeta(rooms as IUnit[], getPhrase);

    const hotelPath = buildHotelDetailsUrl(hotel);

    const hotelDetailsUrl = hotelPath ? `${basePath}${hotelPath}` : '';

    const hotelAddress = getHotelAddress(booking);
    const hotelCoordinates = getHotelCoordinates(hotel);

    const roomsTitle = roomsMeta?.rooms?.length > 1 ? RoomsLabelPlural : RoomsLabelSingular;

    const onGetDirectionsClick = () => {
        if (isMobile) {
            setIsPopupShown(true);

            return;
        }

        window.open(buildGetDirectionsGoogleMapsUrl(hotelCoordinates));
    };

    const onPopupClose = () => setIsPopupShown(false);

    return (
        <>
            <ItineraryItem
                title={HotelTitle}
                icon={<SvgHotelFilled />}
                className={className}
                isExpanded={isExpanded}
                setExpanded={setExpanded}
            >
                <ItineraryItemSubtitle
                    subtitle={{ value: hotelName ?? '' }}
                    content={hotelAddress}
                    showContent={!isExpanded}
                    className={styles.subtitleItem}
                    contentClassName={styles.hotelAddressSubtitle}
                    subtitleClassName={styles.hotelNameSubtitle}
                />

                {isExpanded && (
                    <div
                        data-tid='itinerary-hotel-extended'
                        className={classNames(styles.content, {
                            [styles.withoutMarginTop]: isLuxuryPackage,
                        })}
                    >
                        <div className={styles.tripAdvisorWrapper} data-tid='itinerary-hotel-trip-advisor'>
                            <StarRating rating={starRating} />
                            {!!(taRating && numberOfReviews) && (
                                <TripadvisorInfo rating={taRating} reviews={numberOfReviews} />
                            )}
                        </div>
                        <div className={styles.hotelInfo}>
                            <div>
                                <Text field={AddressLabel} className={styles.hotelAddressTitle} tag='h6' />
                                <div className={styles.hotelAddressWrapper}>
                                    <div className={styles.hotelInfoAddress}>{hotelAddress}</div>
                                    <Button
                                        isTransparent
                                        dataTid='itinerary-summary-copy-to-clipboard-btn'
                                        onClick={(): Promise<string> => copyToClipboard(hotelAddress)}
                                    >
                                        <SvgCopySimple />
                                    </Button>
                                </div>
                                <Button
                                    isText
                                    className={styles.link}
                                    dataTid='itinerary-summary-get-directions-btn'
                                    onClick={onGetDirectionsClick}
                                >
                                    <Text field={DirectionsLabel} className={styles.hotelInfoTitle} tag='span' />
                                    <SvgChevronRight />
                                </Button>
                            </div>
                            <div>
                                {roomsMeta?.rooms && (
                                    <>
                                        <Text field={roomsTitle} className={styles.hotelInfoTitle} tag='h6' />
                                        <div>
                                            {roomsMeta.rooms.map(({ title, roomNumber, room }, roomIdx) => (
                                                <div
                                                    key={`itinerary-summary-unit-${room.code}-${roomIdx}`}
                                                    data-tid='itinerary-summary-room'
                                                >{`${roomNumber}: ${title}`}</div>
                                            ))}
                                        </div>
                                    </>
                                )}
                                {!isFlightAndHotelPackage && (
                                    <a
                                        href={hotelDetailsUrl}
                                        className={styles.link}
                                        target='_blank'
                                        rel='noopener noreferrer'
                                        data-tid='itinerary-summary-hotel-view-link'
                                    >
                                        <Text field={HotelDetailsLabel} className={styles.hotelInfoTitle} tag='span' />
                                        <SvgChevronRight />
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </ItineraryItem>
            {isPopupShown && (
                <GetDirectionsPopup
                    coordinates={hotelCoordinates}
                    directionsLabel={DirectionsLabel}
                    mapsApplicationLabel={MapsApplicationLabel}
                    appleMapsLabel={AppleMapsLabel}
                    googleMapsLabel={GoogleMapsLabel}
                    closeDrawerLabel={CloseDrawerLabel}
                    onClose={onPopupClose}
                />
            )}
        </>
    );
};

export default observer(ItineraryHotel);
