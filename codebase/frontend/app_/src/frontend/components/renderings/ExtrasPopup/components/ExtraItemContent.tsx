import React, { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { generateGenericValues } from 'frontend/utils/tracking/tracking.utils';
import { getBookingDestinationForTracking } from 'frontend/utils/viewBooking.utils';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventActions, EventCategories } from 'models/enum/tracking/GenericEventParams';
import { ISitecoreField, ISitecoreLink, TSitecoreMultiList } from 'models/sitecore/generic/ISitecoreField';
import Link from 'frontend/components/common/Link';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import SvgTick from 'frontend/components/icons-new/Tick';
import { TExtraHighlight } from 'frontend/components/renderings/ExtrasPopup/ExtrasPopup';

import styles from './ExtraItemContent.module.scss';

export type TExtraItemContentProps = {
    CTA: ISitecoreField<ISitecoreLink>;
    Description: ISitecoreField<string>;
    Highlights: TSitecoreMultiList<TExtraHighlight>;
    Subtitle: ISitecoreField<string>;
    TrackingLabel: ISitecoreField<string>;
    index: number;
};

export const ExtraItemContent: FC<TExtraItemContentProps> = ({
    index,
    Description,
    Subtitle,
    Highlights,
    CTA,
    TrackingLabel,
}) => {
    const { trackEventWithParams, booking } = useStore((stores: IHolidaysStores) => ({
        trackEventWithParams: stores.trackingStore.trackEventWithParams,
        booking: stores.bookingStore.booking,
    }));

    const linkURL = Tokenizer.replaceTokens(CTA.value?.href || '', {
        [Tokens.ReferenceNumber]: booking?.bookingReference ?? '',
        [Tokens.Destination]: getBookingDestinationForTracking(booking),
    });

    const onLinkClick = (trackingLabel: string, index: number): void => {
        trackEventWithParams(
            EventTypes.GenericEvent,
            {
                eventAction: EventActions.PopupCTAClick,
                eventCategory: EventCategories.ExternalExtrasModule,
                eventLabel: trackingLabel,
                eventType: EventTypes.Interaction,
            },
            generateGenericValues({
                genericValue1: index + 1,
                destinationUrl: linkURL,
            }),
        );
    };

    return (
        <div className={styles.tileContentContainer}>
            <div className={styles.tileTextContainer}>
                <Text field={Subtitle} tag='h3' className={styles.title} data-tid='tile-subtitle' />
                <RichTextWithLinks field={Description} dataId='tile-description' />
                {Highlights?.length > 0 && (
                    <div className={styles.highlightsContainer} data-tid='tile-highlights'>
                        {Highlights?.map(({ fields, id }) => (
                            <div key={id} className={styles.highlight} data-tid='highlight'>
                                <SvgTick className={styles.tickIcon} />
                                <Text field={fields.Title} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <Link
                href={linkURL}
                target={CTA.value?.target}
                className={classNames('btn', styles.cta)}
                onClick={(): void => onLinkClick(TrackingLabel.value, index)}
                data-tid='tile-cta'
            >
                {CTA.value?.text}
            </Link>
        </div>
    );
};

export default ExtraItemContent;
