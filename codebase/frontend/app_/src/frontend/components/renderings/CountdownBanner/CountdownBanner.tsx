import * as React from 'react';
import { observer } from 'mobx-react';

import { TIME_UNITS } from 'code/dates';
import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { getCountdownTime } from 'frontend/utils/date.utils';
import { getSitecoreImageBackgroundStyles } from 'frontend/utils/getImage';
import { getTextFromHtml } from 'frontend/utils/string.utils';
import { buildSitecoreLinkFullUrl } from 'frontend/utils/url.utils';
import { ICountdownTime } from 'models/data/ICountdownBaner';
import { ICountdownBannerFields } from 'models/data/IHeroBannerFields';
import { MediaSize } from 'models/data/MediaSizeParams';
import CountdownBannerVariant from 'models/enum/CountdownBannerVariant';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventLocations } from 'models/enum/tracking/GenericEventParams';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';

import ColoredStripeCountdownBanner from './components/ColoredStripeCountdownBanner';
import CountdownWithinLightboxBanner from './components/CountdownWithinLightboxBanner';
import FullImageCountdownBanner from './components/FullImageCountdownBanner';
import SearchpodCountdownBanner from './components/SearchpodCountdownBanner';

export interface ICountdownBannerProps extends ISitecoreComponent<ICountdownBannerFields> {
    isLower?: boolean;
    singleSlide?: boolean;
    toggleShowCountdownBanner?: (state: boolean) => void;
}

export const CountdownBanner: React.FC<ICountdownBannerProps> = props => {
    const { fields, rendering, toggleShowCountdownBanner } = props;
    const { sitePath, getTimeUnitLabel, trackHomepageAction, trackPersonalizedClick, saveHeroBannerClickEvent } =
        useStore((stores: TStores) => ({
            sitePath: stores.layoutStore.sitePath,
            getTimeUnitLabel: stores.layoutStore.getTimeUnitLabel,
            trackHomepageAction: stores.trackingStore.trackHomepageAction,
            trackPersonalizedClick: stores.trackingStore.trackPersonalizedClick,
            saveHeroBannerClickEvent: stores.engageStore.saveHeroBannerClickEvent,
        }));
    const [now, setNow] = React.useState<Date>(new Date());
    const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
    const isMobile = useMobileViewport();

    const futureDate = React.useMemo(
        () => (fields?.DateTime?.value ? new Date(fields.DateTime.value) : new Date()),
        [fields?.DateTime?.value],
    );

    React.useEffect(() => {
        setNow(new Date());

        timerRef.current = setInterval(() => {
            setNow(currentNow => {
                if (currentNow.getTime() > futureDate.getTime()) {
                    if (timerRef.current) {
                        globalThis.clearInterval(timerRef.current);
                    }

                    if (fields?.HideAfterTimeElapsed?.value && toggleShowCountdownBanner) {
                        toggleShowCountdownBanner(false);
                    }

                    return currentNow;
                }

                return new Date();
            });
        }, TIME_UNITS.millisecondsInSecond);

        return () => {
            if (timerRef.current) {
                globalThis.clearInterval(timerRef.current);
            }
        };
    }, [fields?.HideAfterTimeElapsed?.value, futureDate, toggleShowCountdownBanner]);

    const timeBeforeStart = React.useMemo(
        (): ICountdownTime[] => getCountdownTime(futureDate, now, getTimeUnitLabel),
        [futureDate, now, getTimeUnitLabel],
    );

    const backgroundStyles = React.useMemo(
        (): React.CSSProperties | undefined =>
            getSitecoreImageBackgroundStyles(
                isMobile && !!fields?.MobileOnlyImage?.value?.src ? fields.MobileOnlyImage : fields?.Image,
                MediaSize.Large,
                isMobile,
            ),
        [fields, isMobile],
    );

    const onClickButton = React.useCallback(
        (e: React.MouseEvent, link: ISitecoreField<ISitecoreLink>): void => {
            saveHeroBannerClickEvent(rendering?.uid, EventTypes.HeroBannerClick);
            trackPersonalizedClick(
                EventTypes.HeroBannerButtonClick,
                rendering?.uid,
                EventLocations.HeroBannerButton,
                link.value.text,
                buildSitecoreLinkFullUrl(link, sitePath),
                { section: getTextFromHtml(fields?.Title?.value || '') },
            );

            //shouldn't be handled by parent component onClick action
            e.stopPropagation();
        },
        [fields?.Title?.value, rendering?.uid, saveHeroBannerClickEvent, sitePath, trackPersonalizedClick],
    );

    const onClickComponent = React.useCallback((): void => {
        trackHomepageAction(EventTypes.HeroBannerClick, {
            location: EventLocations.HeroBannerImage,
            name: getTextFromHtml(fields?.Title?.value || ''),
            section: getTextFromHtml(fields?.Subtitle?.value || ''),
        });
    }, [fields, trackHomepageAction]);

    if (!fields) {
        return null;
    }

    const bannerProps = {
        ...props,
        time: timeBeforeStart,
        backgroundStyles,
        onClickButton,
        onClickComponent,
    };

    if (fields?.CountdownVariant?.value === CountdownBannerVariant.WithSearchpod) {
        return <SearchpodCountdownBanner {...bannerProps} />;
    }

    if (fields?.CountdownVariant?.value === CountdownBannerVariant.Lightbox) {
        return <CountdownWithinLightboxBanner {...bannerProps} />;
    }

    return fields?.CountdownVariant?.value === CountdownBannerVariant.FullImage ? (
        <FullImageCountdownBanner {...bannerProps} />
    ) : (
        <ColoredStripeCountdownBanner
            {...bannerProps}
            isTransparent={fields?.CountdownVariant.value === CountdownBannerVariant.Transparent}
        />
    );
};

export default observer(CountdownBanner);
