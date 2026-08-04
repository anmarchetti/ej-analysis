import React, { FC, useEffect, useMemo, useRef, useState } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { TWO } from 'code/commonNumbers';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { ISitecoreChildren } from 'models/data/ISitecoreChildren';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import BannerCard, { TBannerCardFields } from 'frontend/components/common/BannerCard/BannerCard';
import HeaderTextWithIcon from 'frontend/components/common/HeaderTextWIthIcon/HeaderTextWithIcon';
import ReadMoreButton from 'frontend/components/common/ReadMoreButton';
import SvgParkingLined from 'frontend/components/icons-new/ParkingLined';

import styles from './ExternalExtrasBanner.module.scss';

interface IExternalExtrasBannerFields {
    Children: ISitecoreChildren<TBannerCardFields>[];
    Hide: ISitecoreField<string>;
    Show: ISitecoreField<string>;
    Title: ISitecoreField<string>;
}

export type TExternalExtrasBannerProps = ISitecoreComponent<IExternalExtrasBannerFields>;

const DESKTOP_HEIGHT = 400;
const MOBILE_HEIGHT = 550;
const INITIAL_VISIBLE_CARDS_NUMBER = 4;
const PARKING_BANNER_NAME = 'Airport parking';

export const ExternalExtrasBanner: FC<TExternalExtrasBannerProps> = ({ fields }) => {
    const {
        getPhrase,
        isScreenLessMedium,
        isViewBookingPage,
        isConfirmationPage,
        isBookingsListPage,
        trackExternalExtrasTileImpression,
        trackExternalExtrasClickHide,
        trackExternalExtrasClickViewExtras,
        isAirportParkingBooked,
    } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        isScreenLessMedium: stores.appStore.isScreenLessMedium,
        isViewBookingPage: stores.layoutStore.isViewBookingPage,
        isConfirmationPage: stores.layoutStore.isConfirmationPage,
        isBookingsListPage: stores.layoutStore.isBookingsListPage,
        trackExternalExtrasTileImpression: stores.trackingStore.trackExternalExtrasTileImpression,
        trackExternalExtrasClickViewExtras: stores.trackingStore.trackExternalExtrasClickViewExtras,
        trackExternalExtrasClickHide: stores.trackingStore.trackExternalExtrasClickHide,
        isAirportParkingBooked:
            !!stores.bookingStore.booking?.airportParking || !!stores.viewBookingStore.booking?.airportParking,
    }));

    const extrasContainerRef = useRef<null | HTMLDivElement>(null);
    const titleRef = useRef<null | HTMLDivElement>(null);

    const [isExpanded, setIsExpanded] = useState<boolean>(false);
    const [isHeightOverSize, setIsHeightOverSize] = useState<boolean>(true);
    const [maxHeight, setMaxHeight] = useState<number>(0);

    const isChildrenCountMoreThanFour = fields?.Children && fields.Children.length > INITIAL_VISIBLE_CARDS_NUMBER;

    const filteredChildren = useMemo(() => {
        if (!fields?.Children.length) {
            return [];
        }

        if ((isConfirmationPage || isViewBookingPage) && isAirportParkingBooked) {
            return fields.Children?.filter(child => child.name !== PARKING_BANNER_NAME);
        }

        return fields.Children;
    }, [isAirportParkingBooked, isConfirmationPage, isViewBookingPage, fields]);

    useEffect(() => {
        filteredChildren.slice(0, INITIAL_VISIBLE_CARDS_NUMBER).forEach(({ fields }, index) => {
            trackExternalExtrasTileImpression(fields.Title?.value, index + 1, fields.CTA?.value?.href);
        });
    }, [filteredChildren.length, trackExternalExtrasTileImpression]);

    useEffect(() => {
        setIsExpanded(false);

        const textHeight = extrasContainerRef?.current?.scrollHeight ?? 0;

        setMaxHeight(isScreenLessMedium ? MOBILE_HEIGHT : DESKTOP_HEIGHT);
        setIsHeightOverSize(textHeight > maxHeight);
    }, [maxHeight, isScreenLessMedium]);

    if (!fields || filteredChildren.length === 0) {
        return null;
    }

    const { Hide, Show, Title } = fields;

    const shouldApplyDifferentMaxHeight = isHeightOverSize && !isExpanded && filteredChildren.length > TWO;
    const shouldRenderReadMoreButton = filteredChildren.length > TWO;
    const shouldShowAllContent = isExpanded || !shouldRenderReadMoreButton;

    const onReadMoreButtonClick = (): void => {
        if (titleRef.current && isExpanded) {
            titleRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            trackExternalExtrasClickHide();
        } else {
            trackExternalExtrasClickViewExtras();

            if (isChildrenCountMoreThanFour) {
                filteredChildren
                    .slice(INITIAL_VISIBLE_CARDS_NUMBER, filteredChildren.length)
                    .forEach(({ fields }, index) => {
                        trackExternalExtrasTileImpression(
                            fields.Title?.value,
                            index + INITIAL_VISIBLE_CARDS_NUMBER + 1,
                            fields.CTA?.value?.href,
                        );
                    });
            }
        }

        setIsExpanded(!isExpanded);
    };

    return (
        <div className={styles.noPrint}>
            {isViewBookingPage || isConfirmationPage ? (
                <HeaderTextWithIcon
                    title={getPhrase(SitecoreDictionary.BookingSummaryTitlesExtras)}
                    Icon={SvgParkingLined}
                />
            ) : (
                <div ref={titleRef} tabIndex={-1}>
                    <Text field={Title} tag='h2' className={styles.title} data-tid='external-extras-banner-title' />
                </div>
            )}
            <div
                data-tid='external-extras-grid-wrapper'
                className={classNames(styles.gridWrapper, {
                    [styles.confirmationPageGridWrapper]: isConfirmationPage,
                    [styles.viewBookingPageGridWrapper]: isViewBookingPage,
                    [styles.bookingsListPageGridWrapper]: isBookingsListPage,
                })}
            >
                <div
                    className={classNames(styles.grid, {
                        [styles.noAfter]: shouldShowAllContent,
                        [styles.noPaddingTop]: isViewBookingPage || isConfirmationPage,
                    })}
                    ref={extrasContainerRef}
                    data-tid='external-extras-grid'
                    style={{ maxHeight: shouldApplyDifferentMaxHeight ? maxHeight : '100%' }}
                >
                    {filteredChildren.map(({ fields, id }, index) => (
                        <div
                            key={id}
                            className={classNames(styles.item, {
                                [styles.gridSingleItem]: !filteredChildren[index + 1] && index % TWO === 0,
                            })}
                            data-tid='external-extras-grid-item'
                        >
                            <BannerCard
                                index={index}
                                fields={fields}
                                isExternalExtras
                                childrenCount={filteredChildren.length}
                            />
                        </div>
                    ))}
                </div>
                {shouldRenderReadMoreButton && (
                    <div className={classNames('read-more-box', styles.readMoreBox)}>
                        <ReadMoreButton
                            isReadLess={isExpanded}
                            onClick={onReadMoreButtonClick}
                            readLessText={Hide?.value}
                            readMoreText={Show?.value}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default observer(ExternalExtrasBanner);
