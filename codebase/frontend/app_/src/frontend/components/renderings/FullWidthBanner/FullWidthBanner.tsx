import { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { generateGenericValues } from 'frontend/utils/tracking/tracking.utils';
import { ComponentVersion, TextAlignmentVariant, TFullWidthBannerProps } from 'models/data/IFullWithBanner';
import { MediaSize } from 'models/data/MediaSizeParams';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventActions, EventCategories } from 'models/enum/tracking/GenericEventParams';
import JSSImage from 'frontend/components/common/JSSImage';
import { JSSImageNext } from 'frontend/components/common/JSSImageNext/JSSImageNext';

import BannerWithKeySellingPoints from './BannerWithKeySellingPoints/BannerWithKeySellingPoints';
import { FullWidthBannerInfo } from './components/FullWidthBannerInfo/FullWidthBannerInfo';

import styles from './FullWidthBanner.module.scss';

export const FullWidthBanner: React.FC<TFullWidthBannerProps> = props => {
    const { isEditMode, trackEventWithParams } = useStore((stores: TStores) => ({
        isEditMode: stores.layoutStore.isEditMode,
        trackEventWithParams: stores.trackingStore.trackEventWithParams,
    }));

    const { fields, params } = props;
    const { TrackingTitle } = fields || {};

    const { ref, inView } = useInView({
        triggerOnce: true,
    });

    useEffect(() => {
        if (inView) {
            trackEventWithParams(
                EventTypes.GenericEvent,
                {
                    eventAction: EventActions.Impressions,
                    eventCategory: EventCategories.FullWidthBanner,
                    eventLabel: TrackingTitle?.value,
                    eventType: EventTypes.NonInteraction,
                },
                generateGenericValues({
                    destinationUrl: null,
                }),
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [inView]);

    if (!fields) {
        return null;
    }

    const { TextAlignment, Version } = params;

    if (Version === ComponentVersion.WithKeySellingPoints) {
        return <BannerWithKeySellingPoints ref={ref} fields={fields} params={params} />;
    }

    const { Image } = fields;
    const isLeftText = TextAlignment === TextAlignmentVariant.Left;
    const isShardShown = [ComponentVersion.SlimWithShard, ComponentVersion.NonSlimWithShard].includes(Version);
    const isBannerSlim = [ComponentVersion.SlimWithShard, ComponentVersion.SlimWithoutShard].includes(Version);
    const isShardMirrored = Version === ComponentVersion.SlimWithShardMirrored;
    const isGenericContent = Version === ComponentVersion.GenericContent;

    return (
        <div
            ref={ref}
            data-tid='full-width-banner'
            className={classNames(styles.banner, {
                [styles.leftText]: isLeftText,
                [styles.genericContentBanner]: isGenericContent,
                [styles.bannerSlim]: isBannerSlim,
                [styles.withShard]: isShardShown,
                [styles.shardMirrored]: isShardMirrored,
            })}
        >
            {isEditMode ? (
                <div data-tid='banner-media-edit' className={classNames(styles.media, 'exp-editor-bg-image')}>
                    <JSSImage field={Image} />
                </div>
            ) : (
                <div data-tid='banner-media' className={styles.media}>
                    <JSSImageNext
                        className={styles.image}
                        field={Image}
                        fill
                        mediaSize={{
                            desktop: MediaSize.Big,
                            mobile: MediaSize.Medium,
                        }}
                    />
                </div>
            )}
            <div data-tid='banner-info' className={styles.info}>
                <FullWidthBannerInfo {...props} />
            </div>
        </div>
    );
};

export default observer(FullWidthBanner);
