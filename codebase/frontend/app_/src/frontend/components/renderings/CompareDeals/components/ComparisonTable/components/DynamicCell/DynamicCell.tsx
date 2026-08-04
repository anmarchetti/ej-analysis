import React, { FC, ReactElement } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import useStore from 'frontend/hooks/useStore';
import { isHolidayStore } from 'frontend/store/holidays';
import { TStores } from 'frontend/store/IStores';
import { distanceInfo, distanceTextFromSitecore } from 'frontend/utils/getHotelLocation';
import { roomTitleNormalize } from 'frontend/utils/string.utils';
import { CompareOption } from 'models/data/IComparison';
import { IOffer } from 'models/data/IOffer';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import StarRating from 'frontend/components/common/StarRating';
import TripadvisorInfo from 'frontend/components/renderings/HotelDetails/components/TripadvisorInfo';

import Mapper from './components/Mapper';
import {
    getBagsData,
    getDates,
    getFacilityData,
    getFlightTime,
    getStayData,
    getTransferName,
} from './DynamicCell.utils';

import styles from './DynamicCell.module.scss';

export interface IDynamicRowsProps {
    FallbackLabel: ISitecoreField<string>;
    MissingDataLabel: ISitecoreField<string>;
    offer: IOffer;
    option: CompareOption;
}

const DynamicCell: FC<IDynamicRowsProps> = ({ offer, option, FallbackLabel, MissingDataLabel }) => {
    const { getPhrase, isEditMode, getFormattedNumber, isOfferFromAnotherMarket } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        isEditMode: stores.layoutStore.isEditMode,
        getFormattedNumber: stores.marketStore.getFormattedNumber,
        isOfferFromAnotherMarket: isHolidayStore(stores)
            ? stores.shortlistStore.isOfferFromAnotherMarket
            : (): boolean => false,
    }));

    const getFallback = (): ReactElement => {
        if (MissingDataLabel.value) {
            return <Text field={MissingDataLabel} className={styles.missingData} tag='span' />;
        }

        return <Text field={FallbackLabel} />;
    };

    const getComparedComponent = (): string | ReactElement => {
        let info: ReactElement | string | null | undefined = null;

        switch (option) {
            case CompareOption.TripAdvisor:
                info = offer.hotel?.rating ? (
                    <TripadvisorInfo
                        rating={offer.hotel.rating}
                        reviews={offer.hotel.numberOfReviews}
                        className={styles.tripadvisor}
                    />
                ) : null;
                break;

            case CompareOption.CustomerRating:
                info = offer.hotel?.starRating ? (
                    <StarRating
                        rating={Number.parseInt(offer.hotel.starRating.substring(-1, 1))}
                        className={styles.starRating}
                    />
                ) : null;
                break;

            case CompareOption.Dates:
                info = getDates(offer);
                break;

            case CompareOption.Duration:
                info = getStayData(offer, getPhrase);
                break;

            case CompareOption.DepartureAirport:
                info = offer.transport.routes[0].depName;
                break;

            case CompareOption.OutboundFlightTime:
                info = getFlightTime(offer, 0);
                break;

            case CompareOption.ReturnFlightTime:
                info = getFlightTime(offer, 1);
                break;

            case CompareOption.BoardType:
                info = offer.accom.unit[0].boardType.title;
                break;

            case CompareOption.RoomType:
                info = offer.accom.unit[0].roomType.title
                    ? roomTitleNormalize(offer.accom.unit[0].roomType.title as string)
                    : null;
                break;

            case CompareOption.TransferType:
                info = getTransferName(offer.livePrice, offer, isOfferFromAnotherMarket(offer), getPhrase);
                break;
            case CompareOption.Bags:
                info = getBagsData(offer, isOfferFromAnotherMarket(offer), getPhrase).length ? (
                    <Mapper
                        dataTid={CompareOption.Bags}
                        items={getBagsData(offer, isOfferFromAnotherMarket(offer), getPhrase)}
                    />
                ) : null;
                break;

            case CompareOption.Facilities:
                info = <Mapper dataTid={CompareOption.Facilities} items={getFacilityData(offer.hotel?.facilities)} />;
                break;

            case CompareOption.Location:
                info = distanceInfo(
                    offer.hotel?.closestFacility,
                    distanceTextFromSitecore(offer.hotel?.closestFacility, getPhrase, offer?.accom?.theme),
                    isEditMode,
                    getFormattedNumber,
                );
                break;

            default:
                break;
        }

        return info || getFallback();
    };

    return <>{getComparedComponent()}</>;
};

export default DynamicCell;
