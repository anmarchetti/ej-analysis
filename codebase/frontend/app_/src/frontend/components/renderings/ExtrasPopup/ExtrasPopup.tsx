import React, { FC, useEffect, useMemo, useState } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { useMoreThenMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { generateGenericValues } from 'frontend/utils/tracking/tracking.utils';
import { ISitecoreChildren } from 'models/data/ISitecoreChildren';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventActions, EventCategories } from 'models/enum/tracking/GenericEventParams';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import {
    ISitecoreField,
    ISitecoreImage,
    ISitecoreLink,
    TSitecoreMultiList,
} from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import ExpandableItem from 'frontend/components/common/ExpandableItem/ExpandableItem';
import FloatingPopup from 'frontend/components/common/FloatingPopup/FloatingPopup';
import JSSImage from 'frontend/components/common/JSSImage';
import PopupCloseButton from 'frontend/components/common/Popup/PopupCloseButton';

import ExtraItemContent from './components/ExtraItemContent';

import styles from './ExtrasPopup.module.scss';

const AIRPORT_PARKING_TILE_KEY = 'airport-parking';

export type TExtraHighlight = {
    Title: ISitecoreField<string>;
};
export type TExtraItemFields = {
    CTA: ISitecoreField<ISitecoreLink>;
    Description: ISitecoreField<string>;
    Highlights: TSitecoreMultiList<TExtraHighlight>;
    Logo: ISitecoreField<ISitecoreImage>;
    ShowPopularTag: ISitecoreField<boolean>;
    Subtitle: ISitecoreField<string>;
    Title: ISitecoreField<string>;
    TrackingLabel: ISitecoreField<string>;
    UniqueKey: ISitecoreField<string>;
};

export interface IExtrasPopupFields {
    Children: ISitecoreChildren<TExtraItemFields>[];
    CloseButtonLabel: ISitecoreField<string>;
    CloseButtonScreenReaderLabel: ISitecoreField<string>;
    PopularTagLabel: ISitecoreField<string>;
    Subtitle: ISitecoreField<string>;
    Title: ISitecoreField<string>;
}

export const ExtrasPopup: FC<ISitecoreComponent<IExtrasPopupFields>> = ({ fields }) => {
    const { trackEventWithParams, booking } = useStore((stores: IHolidaysStores) => ({
        trackEventWithParams: stores.trackingStore.trackEventWithParams,
        booking: stores.bookingStore.booking,
    }));

    const [isPopupOpen, setIsPopupOpen] = useState(true);
    const [expandedTile, setExpandedTile] = useState<string>('');
    const isMoreThanMobileViewport = useMoreThenMobileViewport();

    const sortedTiles = useMemo(() => {
        if (!fields?.Children?.length) {
            return [];
        }

        const filteredTiles = fields.Children.filter(tile => {
            const uniqueKey = tile?.fields?.UniqueKey?.value;

            if (uniqueKey === AIRPORT_PARKING_TILE_KEY) {
                return !booking?.airportParking;
            }

            return true;
        });

        return filteredTiles.sort((a, b) => {
            const aShowPopularTag = a?.fields?.ShowPopularTag?.value;
            const bShowPopularTag = b?.fields?.ShowPopularTag?.value;

            if (aShowPopularTag && !bShowPopularTag) {
                return -1;
            }

            if (!aShowPopularTag && bShowPopularTag) {
                return 1;
            }

            return 0;
        });
    }, [fields, booking]);

    useEffect(() => {
        if (sortedTiles?.length && booking) {
            setExpandedTile(sortedTiles[0].id);

            trackEventWithParams(
                EventTypes.GenericEvent,
                {
                    eventAction: EventActions.PopupImpression,
                    eventCategory: EventCategories.ExternalExtrasModule,
                    eventLabel: null,
                    eventType: EventTypes.NonInteraction,
                },
                generateGenericValues({
                    destinationUrl: null,
                }),
            );
        }
    }, [sortedTiles.length, booking, trackEventWithParams]);

    if (!fields || !sortedTiles?.length || !isPopupOpen || !booking) {
        return null;
    }

    const onClose = (): void => {
        setIsPopupOpen(false);
        trackEventWithParams(
            EventTypes.GenericEvent,
            {
                eventAction: EventActions.PopupClose,
                eventCategory: EventCategories.ExternalExtrasModule,
                eventLabel: null,
                eventType: EventTypes.Interaction,
            },
            generateGenericValues({
                destinationUrl: null,
            }),
        );
    };

    const onTileClick = (tileId: string, trackingLabel: string): void => {
        setExpandedTile(expandedTile === tileId ? '' : tileId);

        if (expandedTile === tileId) {
            return;
        }

        trackEventWithParams(
            EventTypes.GenericEvent,
            {
                eventAction: EventActions.PopupAccordionOpen,
                eventCategory: EventCategories.ExternalExtrasModule,
                eventLabel: trackingLabel,
                eventType: EventTypes.Interaction,
            },
            generateGenericValues({
                destinationUrl: null,
            }),
        );
    };

    const { Title, Subtitle, PopularTagLabel, CloseButtonLabel, CloseButtonScreenReaderLabel } = fields;

    return (
        <FloatingPopup
            onClose={onClose}
            footerContent={
                <Button
                    className={styles.closeButton}
                    isLabel
                    onClick={onClose}
                    aria-label={CloseButtonScreenReaderLabel.value}
                    data-tid='extras-popup-close-button'
                >
                    {CloseButtonLabel.value}
                </Button>
            }
            footerClass={styles.footerContainer}
            containerClass={styles.contentContainer}
            bodyClass={styles.bodyContainer}
            contentClass={styles.container}
            id='extras-popup'
        >
            <div className={styles.extrasPopupContent}>
                <div className={styles.header}>
                    <Text field={Title} tag='h2' className={styles.title} data-tid='extras-popup-title' />
                    <Text field={Subtitle} tag='span' className={styles.subtitle} data-tid='extras-popup-subtitle' />
                </div>
                {isMoreThanMobileViewport && (
                    <PopupCloseButton
                        onClick={onClose}
                        className={styles.closeIcon}
                        aria-label={CloseButtonScreenReaderLabel.value}
                        data-tid='extras-popup-close-icon'
                    />
                )}

                {sortedTiles.map((tile, index) => {
                    const { Title, TrackingLabel, ShowPopularTag, Logo, UniqueKey } = tile.fields;
                    const isTileExpanded = expandedTile === tile.id;

                    return (
                        <ExpandableItem
                            key={tile.id}
                            titleWrapperClassName={styles.tileTitleWrapper}
                            isOpened={isTileExpanded}
                            onOpen={(): void => onTileClick(tile.id, TrackingLabel.value)}
                            className={styles.expandableItem}
                            expandButtonChildren={
                                <>
                                    <div className={styles.titleIconContainer}>
                                        <JSSImage field={Logo} dataTid='tile-logo' className={styles.tileIcon} />
                                        <Text
                                            field={Title}
                                            tag='h3'
                                            className={styles.tileTitle}
                                            data-tid='tile-title'
                                        />
                                    </div>
                                    {ShowPopularTag.value && (
                                        <div className={styles.tagContainer}>
                                            <span className={styles.tag} data-tid='popular-tag'>
                                                {PopularTagLabel.value}
                                            </span>
                                        </div>
                                    )}
                                    <div
                                        className={classNames({
                                            [styles.animatedBackground]: true,
                                            [styles.isActive]: isTileExpanded,
                                        })}
                                    />
                                </>
                            }
                            expandButtonClassName={classNames({
                                [styles.expandButton]: true,
                                [styles.isActive]: isTileExpanded,
                            })}
                            expandArrowClassName={styles.expandArrow}
                            dataTid={`extra-tile-${UniqueKey.value}`}
                        >
                            <ExtraItemContent index={index} {...tile.fields} />
                        </ExpandableItem>
                    );
                })}
            </div>
        </FloatingPopup>
    );
};

export default observer(ExtrasPopup);
