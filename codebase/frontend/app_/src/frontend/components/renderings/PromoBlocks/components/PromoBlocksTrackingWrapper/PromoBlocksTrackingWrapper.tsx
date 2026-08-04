import React, { createContext, FC, PropsWithChildren, useCallback, useMemo } from 'react';
import { InView } from 'react-intersection-observer';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { getTextFromHtml } from 'frontend/utils/string.utils';
import { buildSitecoreLinkFullUrl } from 'frontend/utils/url.utils';
import { IPromoBlockFields } from 'models/data/IPromoBlockFields';
import { PromoBlocksThemes } from 'models/enum/PromoBlocksThemes';
import { IPromoBlocksParams } from 'frontend/components/renderings/PromoBlocks/PromoBlocks';

export const TrackingContext = createContext<{
    trackItemClick?: (item: IPromoBlockFields, ctaText?: string) => void;
}>({});

export interface IPromoBlocksTrackingWrapperProps {
    items: IPromoBlockFields[];
    shouldTrackAsPromoBlocks: boolean;
    theme: IPromoBlocksParams['Theme'];
    uid: any;
}

export const PromoBlocksTrackingWrapper: FC<PropsWithChildren<IPromoBlocksTrackingWrapperProps>> = ({
    uid,
    items,
    theme,
    shouldTrackAsPromoBlocks,
    children,
}) => {
    const { trackPromoBlockClick, sitePath, trackPromoBlocksImpression } = useStore((stores: TStores) => ({
        trackPromoBlockClick: stores.trackingStore.trackPromoBlockClick,
        sitePath: stores.layoutStore.sitePath,
        trackPromoBlocksImpression: stores.trackingStore.trackPromoBlocksImpression,
    }));

    const isBigTheme = theme === PromoBlocksThemes.Big;

    const getItemTitle = (item: IPromoBlockFields): string => {
        const title = item.fields?.Title?.value;
        const description = getTextFromHtml(item.fields?.Description?.value || '');

        return title || description || '';
    };

    const trackItemClick = useCallback(
        (item: IPromoBlockFields, ctaText?: string): void => {
            const { Link, PillText } = item.fields || {};

            trackPromoBlockClick(
                uid,
                theme,
                getItemTitle(item),
                (isBigTheme && PillText?.value) || 'null',
                ctaText || 'null',
                buildSitecoreLinkFullUrl(Link, sitePath),
            );
        },
        [uid, theme, sitePath, isBigTheme, trackPromoBlockClick],
    );

    const trackInteraction = useMemo(() => ({ trackItemClick }), [trackItemClick]);

    if (!shouldTrackAsPromoBlocks) {
        return <>{children}</>;
    }

    const itemTitles: string[] = items.map(getItemTitle);

    const trackComponent = (inView: boolean): void => {
        if (!items.length || !inView) return;

        let genericValue2 = 'null';

        if (isBigTheme) {
            const pillValues = items.map(item => item.fields?.PillText?.value || 'null');

            genericValue2 = pillValues.every(pill => pill === 'null') ? 'null' : pillValues.join('|');
        }

        trackPromoBlocksImpression(uid, theme, itemTitles.join('|'), genericValue2);
    };

    return (
        <TrackingContext.Provider value={trackInteraction}>
            <InView onChange={(inView: boolean): void => trackComponent(inView)} triggerOnce>
                {children}
            </InView>
        </TrackingContext.Provider>
    );
};

export default observer(PromoBlocksTrackingWrapper);
