import { FC, useContext } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { formatDateL10n } from 'frontend/utils/date.utils';
import { getParsedPath } from 'frontend/utils/getParsedPath';
import { IPromoBlockFields } from 'models/data/IPromoBlockFields';
import { MediaSize } from 'models/data/MediaSizeParams';
import { DestinationType } from 'models/enum/DestinationType';
import JSSImage from 'frontend/components/common/JSSImage';
import { JSSImageNext } from 'frontend/components/common/JSSImageNext/JSSImageNext';
import RouterLink from 'frontend/components/common/RouterLink';
import StarRating from 'frontend/components/common/StarRating';
import LivePrice from 'frontend/components/renderings/LivePrice/LivePrice';
import { TrackingContext } from 'frontend/components/renderings/PromoBlocks/components/PromoBlocksTrackingWrapper/PromoBlocksTrackingWrapper';

export interface IFeaturedDestinationCardProps {
    item: IPromoBlockFields;
    titleClassName: string;
}

export const FeaturedDestinationCard: FC<IFeaturedDestinationCardProps> = ({ item, titleClassName }) => {
    const { isEditMode, isLivePriceEnabled, isNumberOfNightsLabelsEnabled } = useStore((stores: TStores) => ({
        isEditMode: stores.layoutStore.isEditMode,
        isLivePriceEnabled: stores.layoutStore.isLivePriceEnabled,
        isNumberOfNightsLabelsEnabled: stores.layoutStore.isNumberOfNightsLabelsEnabled,
    }));
    const { trackItemClick } = useContext(TrackingContext);

    if (!item.fields) {
        return null;
    }

    const destination = item.fields.LinkedDestination?.[0];
    const isHotel = destination?.fields?.PageCategory?.value === DestinationType.Hotel;
    const hasLivePrice = isLivePriceEnabled && item.livePrice && item.livePrice.pricePP > 0;
    const hasLink = !!item.fields.Link?.value?.href;
    const title = item.fields.Title?.value || '';

    const renderHotelInfo = (): JSX.Element => {
        const starRating = Number(destination?.fields?.StarRating?.value) || 0;
        const [country, region] = destination?.url ? getParsedPath(destination.url) : [];

        return (
            <div className='hotel-info'>
                {country?.label && region?.label && (
                    <div className='destination text-bold'>
                        {region.label}, {country.label}
                    </div>
                )}
                {starRating > 0 && <StarRating rating={starRating} />}
            </div>
        );
    };

    const renderHotelBookDate = (): JSX.Element | null => {
        const { FeaturedHotelBookFromTitle, FeaturedHotelDate, FeaturedHotelDateText } = destination?.fields || {};
        const label = FeaturedHotelBookFromTitle?.value || '';

        // Check if date exists (if field empty sitecore returns 01.01.01)
        const date =
            FeaturedHotelDate?.value && new Date(FeaturedHotelDate.value).getFullYear() > 1
                ? formatDateL10n(FeaturedHotelDate.value, 'Do MMM')
                : FeaturedHotelDateText?.value;

        return date ? (
            <div className='departure-date'>
                {label} <span className='text-bold'>{date}</span>
            </div>
        ) : null;
    };

    if (isEditMode) {
        return (
            <div className='featured-destination-card'>
                <JSSImage field={item.fields.Image} />
                <div className='featured-destination-card__info'>
                    <Text field={item.fields.Title} tag='h3' className={classNames('title', titleClassName)} />
                    <RouterLink link={item.fields.Link} />
                </div>
            </div>
        );
    }

    return (
        <div className='featured-destination-card'>
            {!isEditMode && <JSSImageNext field={item.fields.Image} mediaSize={{ desktop: MediaSize.Medium }} fill />}
            <div className='featured-destination-card__info'>
                <h3 className={classNames('title', titleClassName)}>
                    {hasLink ? (
                        <RouterLink
                            link={item.fields.Link}
                            className='link-pseudo-overlay'
                            onClick={(): void => trackItemClick?.(item, title)}
                        >
                            {title}
                        </RouterLink>
                    ) : (
                        title
                    )}
                </h3>

                {(isHotel || hasLivePrice) && (
                    <div className='featured-destination-card__details'>
                        {isHotel && renderHotelInfo()}
                        <div className='book-info'>
                            <div>
                                {isHotel && renderHotelBookDate()}
                                {hasLivePrice && item.isLivePriceValid && (
                                    <LivePrice
                                        livePrice={item.livePrice}
                                        isNumberOfNightsLabelsEnabled={isNumberOfNightsLabelsEnabled}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default observer(FeaturedDestinationCard);
