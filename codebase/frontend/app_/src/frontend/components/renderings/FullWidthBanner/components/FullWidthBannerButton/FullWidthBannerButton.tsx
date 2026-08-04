import { FC } from 'react';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { generateGenericValues } from 'frontend/utils/tracking/tracking.utils';
import { CTAThemeType, IFullWidthBannerFields } from 'models/data/IFullWithBanner';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventActions, EventCategories } from 'models/enum/tracking/GenericEventParams';
import RouterLink from 'frontend/components/common/RouterLink';
import styles from 'frontend/components/renderings/FullWidthBanner/FullWidthBanner.module.scss';

export interface IFullWidthBannerButtonProps {
    CTATheme: CTAThemeType;
    fields: IFullWidthBannerFields;
}

export const FullWidthBannerButton: FC<IFullWidthBannerButtonProps> = ({ CTATheme, fields }) => {
    const { trackEventWithParams } = useStore((stores: TStores) => ({
        trackEventWithParams: stores.trackingStore.trackEventWithParams,
    }));

    const { CTA, TrackingTitle } = fields;

    if (!CTA?.value.href || !CTA?.value.text) {
        return null;
    }

    const isCTAOutlined = CTATheme === CTAThemeType.Outlined;
    const isLinkCTA = CTATheme === CTAThemeType.Url;

    const onClick = (): void => {
        trackEventWithParams(
            EventTypes.GenericEvent,
            {
                eventAction: EventActions.ImpressionClicked,
                eventCategory: EventCategories.FullWidthBanner,
                eventLabel: TrackingTitle?.value,
                eventType: EventTypes.Interaction,
            },
            generateGenericValues({
                destinationUrl: null,
            }),
        );
    };

    return (
        <RouterLink
            dataId='full-width-banner-cta'
            link={CTA}
            className={classNames({
                btn: !isLinkCTA,
                'btn--outlined': isCTAOutlined,
                [styles.link]: isLinkCTA,
            })}
            onClick={onClick}
        >
            {CTA.value.text}
        </RouterLink>
    );
};

export default FullWidthBannerButton;
