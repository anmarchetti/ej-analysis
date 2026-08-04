import React, { FC, useCallback, useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventActions, EventCategories, GENERIC_CUSTOM_PARAMS_EMPTY } from 'models/enum/tracking/GenericEventParams';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreImage, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import CountdownTimer from 'frontend/components/common/CountdownTimer/CountdownTimer';
import JSSImage from 'frontend/components/common/JSSImage';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import RouterLink from 'frontend/components/common/RouterLink';
import { withRerender } from 'frontend/components/hoc';
import { IComponentWithRerenderProps } from 'frontend/components/hoc/withRerender';
import IconChevronDown from 'frontend/components/icons/ChevronDown';
import IconChevronUp from 'frontend/components/icons/ChevronUp';

interface IMerchandisingAlertBannerFields {
    Countdown: ISitecoreField<string>;
    CountdownDateTime: ISitecoreField<string>;
    Icon: ISitecoreField<ISitecoreImage>;
    Link: ISitecoreField<ISitecoreLink>;
    Text: ISitecoreField<string>;
    Title: ISitecoreField<string>;
}

interface IMerchandisingAlertBannerProps
    extends ISitecoreComponent<IMerchandisingAlertBannerFields>,
        IComponentWithRerenderProps {}

export const MerchandisingAlertBanner: FC<IMerchandisingAlertBannerProps> = ({ fields, wasRerendered }) => {
    const [isOpened, setIsOpened] = useState<boolean>(false);
    const { trackEventWithParams, isScreenMedium } = useStore((stores: TStores) => ({
        trackEventWithParams: stores.trackingStore.trackEventWithParams,
        isScreenMedium: stores.appStore.isScreenMedium,
    }));

    const { ref, inView } = useInView({
        triggerOnce: true,
    });

    const toggleOpen = (isOpened: boolean): void => setIsOpened(!isOpened);

    const trackingEvents = useCallback(
        (isClick?: boolean): void => {
            trackEventWithParams(
                EventTypes.GenericEvent,
                {
                    eventAction: isClick ? EventActions.AlertBannerClicked : EventActions.AlertBanner,
                    eventLabel: 'Header',
                    eventType: isClick ? EventTypes.Interaction : EventTypes.NonInteraction,
                    eventCategory: EventCategories.AlertBanner,
                    eventValue: null,
                },
                {
                    ...GENERIC_CUSTOM_PARAMS_EMPTY,
                    destinationUrl: null,
                    genericValue1: fields?.Title?.value,
                    genericValue2: fields?.Text?.value,
                    genericValue3: fields?.Link.value.text,
                    genericValue4: null,
                },
            );
        },
        [fields, trackEventWithParams],
    );

    useEffect(() => {
        if (inView) trackingEvents(false);
    }, [inView, trackingEvents]);

    if (!fields?.Title.value) return null;

    const { Title, Text, Icon, Link, Countdown, CountdownDateTime } = fields;

    return (
        <div ref={ref} className='merchandising-alert-banner'>
            <div className='wrapper-container wrapper-container--px'>
                <div className='merchandising-banner__bg-wrapper'>
                    <div className='merchandising-banner__bg' />
                </div>
                <div className={classNames('merchandising-banner__content', isOpened && 'expanded')}>
                    {!!Icon?.value?.src && (
                        <div className='merchandising-banner__icon-wrapper'>
                            <JSSImage field={Icon} className='merchandising-banner__icon' />
                        </div>
                    )}
                    <div className='merchandising-banner__wrapper'>
                        {Title?.value && <RichTextWithLinks className='merchandising-banner__title' field={Title} />}
                        {Text?.value && (
                            <RichTextWithLinks className='merchandising-banner__description' field={Text} />
                        )}
                        {Countdown?.value && CountdownDateTime?.value && (
                            <CountdownTimer
                                className='merchandising-banner__countdown'
                                date={CountdownDateTime}
                                field={Countdown}
                            />
                        )}
                        {Link?.value && (
                            <RouterLink onClick={trackingEvents} className='merchandising-banner__link' link={Link}>
                                {Link.value.text}
                            </RouterLink>
                        )}
                        {wasRerendered && !isScreenMedium && Text?.value && (
                            <span onClick={() => toggleOpen(isOpened)} className='icon-arrow'>
                                {isOpened ? <IconChevronUp /> : <IconChevronDown />}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default withRerender(observer(MerchandisingAlertBanner));
