import * as React from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { getSitecoreImageBackgroundStyles } from 'frontend/utils/getImage';
import { MediaSize } from 'models/data/MediaSizeParams';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import RouteInfoBlock from 'frontend/components/common/DestinationGuides/RouteInfoBlock';

import styles from './ItineraryItem.module.scss';

interface IItineraryItemProps {
    Description: ISitecoreField<string>;
    Duration: ISitecoreField<string>;
    Image: ISitecoreField<ISitecoreImage>;
    Name: ISitecoreField<string>;
    TotalDistance: ISitecoreField<string>;
    itinerary: {
        fields: {
            RouteType: ISitecoreField<string>;
        };
    }[];
    onOpenRouteMap: (ev: any) => void;
    id?: string;
}

const ItineraryItem = (props: IItineraryItemProps) => {
    const { isScreenLessMedium, isEditMode, getPhrase } = useStore(stores => ({
        isScreenLessMedium: stores.appStore.isScreenLessMedium,
        isEditMode: stores.layoutStore.isEditMode,
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const routeType = () => Array.from(new Set(props.itinerary.map(itin => itin.fields.RouteType.value)));

    const getBackgroundStyles = (): React.CSSProperties | undefined =>
        getSitecoreImageBackgroundStyles(props.Image, MediaSize.Small, isScreenLessMedium, isEditMode);

    const { Name, Duration, TotalDistance, itinerary, Description, onOpenRouteMap, id } = props;

    return (
        <div className={`card title-under-image-block ${styles.tourRoutesCard}`}>
            <div className={styles.background} style={getBackgroundStyles()} />
            <div className={styles.content}>
                <Text field={Name} tag='h3' className={styles.title} />
                <RouteInfoBlock
                    info={{
                        duration: Duration.value,
                        routeType: routeType(),
                        distance: TotalDistance.value,
                        stops: itinerary.length,
                    }}
                    containerClassName={styles.routeInfo}
                    itemClassName={styles.routeInfoItem}
                    getPhrase={getPhrase}
                />
                <div className='hr' />
                <Text
                    field={Description}
                    tag='p'
                    className={classNames('tour-route_description', styles.description)}
                />
                <Button
                    isFullWidth
                    isOutlined
                    isWide
                    onClick={onOpenRouteMap}
                    dataTid={id}
                    className={classNames('tour-route_map-button', styles.button)}
                >
                    {getPhrase(SitecoreDictionary.ItineraryOpenButtonText)}
                </Button>
            </div>
        </div>
    );
};

export default ItineraryItem;
