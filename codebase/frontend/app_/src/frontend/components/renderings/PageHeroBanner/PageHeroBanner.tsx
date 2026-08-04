import React, { FC, useEffect, useState } from 'react';
import { useComponentProps } from '@sitecore-jss/sitecore-jss-nextjs';

import { ENGLISH, getCMSLang, TSitecoreLangs } from 'code/cmsLang';
import usePrevious from 'frontend/hooks/usePrevious';
import useStore from 'frontend/hooks/useStore';
import hotelsService from 'frontend/services/offers.service';
import { TStores } from 'frontend/store/IStores';
import { onlyUnique } from 'frontend/utils/array.utils';
import { getCheapestLivePrice, isLivePriceEnabledForDestinationPage } from 'frontend/utils/livePrice.utils';
import { getRelatedDestinationsCodes } from 'frontend/utils/search/search.utils';
import { ISSRPageHeroBannerProps, THeroBannerProps } from 'models/data/IHeroBanner';
import PageHeroBannerVariants from 'models/enum/PageHeroBannerVariants';
import SitecoreTemplateId from 'models/enum/SitecoreTemplateId';
import { TGetServerSideComponentProps } from 'models/sitecore/TGetServerSideComponentProps';

import DestinationHead from './components/DestinationHead/DestinationHead';
import FloatingBanner from './components/FloatingBanner/FloatingBanner';
import StaticBanner from './components/StaticBanner/StaticBanner';
import { isField } from './PageHeroBanner.utils';

const PageHeroBanner: FC<THeroBannerProps> = props => {
    const {
        isDestinationPage,
        isEditMode,
        isDestinationHeroBannerLivePriceEnabled,
        isLivePriceEnabledForDestination,
        getLivePrice,
        isVirtualResortBrowsePage,
        isVirtualRegionBrowsePage,
    } = useStore((stores: TStores) => ({
        isDestinationPage: stores.layoutStore.isDestinationPage,
        isEditMode: stores.layoutStore.isEditMode,
        isDestinationHeroBannerLivePriceEnabled: stores.layoutStore.isDestinationHeroBannerLivePriceEnabled,
        isVirtualRegionBrowsePage: stores.layoutStore.isVirtualRegionBrowsePage,
        isVirtualResortBrowsePage: stores.layoutStore.isVirtualResortBrowsePage,
        isLivePriceEnabledForDestination: stores.layoutStore.isLivePriceEnabledForDestination,
        getLivePrice: stores.hotelsStore.getLivePrice,
    }));

    const { Variant } = props.params;
    const destinationCode = isDestinationPage ? props.fields?.Code?.value : null;
    const relatedCodes = getRelatedDestinationsCodes(
        props.fields,
        isVirtualRegionBrowsePage,
        isVirtualResortBrowsePage,
    );

    const { cheapestLivePriceForDestinationPage: ssrPrice } =
        useComponentProps<ISSRPageHeroBannerProps>(props.rendering.uid) || {};

    const [livePrice, setLivePrice] = useState(ssrPrice);
    const prevDestinationCode = usePrevious(destinationCode);

    useEffect(() => {
        const loadPrices = async (): Promise<void> => {
            if (
                isEditMode ||
                !isDestinationHeroBannerLivePriceEnabled ||
                !isDestinationPage ||
                !destinationCode ||
                !isLivePriceEnabledForDestination(destinationCode, undefined, relatedCodes)
            ) {
                return;
            }

            const codes = relatedCodes.length ? relatedCodes : [destinationCode];
            const prices = await getLivePrice(codes);
            const cheapestLivePrice = getCheapestLivePrice(prices);

            setLivePrice(cheapestLivePrice);
        };

        if (prevDestinationCode && prevDestinationCode !== destinationCode) {
            setLivePrice(null);
        }

        if (ssrPrice) {
            return; // to prevent double load on first render
        }

        loadPrices();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [destinationCode]);

    return (
        <>
            {isDestinationPage && <DestinationHead cheapestLivePriceForDestinationPage={livePrice} />}

            {Variant === PageHeroBannerVariants.ShadowFullBannerNoShard ? (
                <FloatingBanner {...props} cheapestLivePriceForDestinationPage={livePrice} />
            ) : (
                <StaticBanner {...props} cheapestLivePriceForDestinationPage={livePrice} />
            )}
        </>
    );
};

export const getServerSideProps: TGetServerSideComponentProps<ISSRPageHeroBannerProps> = async (
    rendering,
    layout,
    context,
) => {
    const { baseTemplates, isFullMode, isSoftMode, parents } = layout?.sitecore?.context ?? {};
    const { IsLivePriceEnabled, DestinationHeroBannerLivePrice, ExcludeLivePriceForDestinations } =
        context.res.settings;

    const isDestinationPage = (baseTemplates as string[]).includes(SitecoreTemplateId.DestinationPage);

    const isEditMode = context.preview;
    const fields = rendering?.fields;
    const destinationCode: string | null =
        isDestinationPage && isField(fields?.Code) && typeof fields?.Code?.value === 'string'
            ? fields?.Code?.value
            : null;

    const isFullMaintenance = isFullMode ?? false;
    const isSoftMaintenance = isSoftMode ?? false;
    const isMaintenance = isSoftMaintenance || isFullMaintenance;

    const isVirtualRegionBrowsePage = layout?.sitecore?.route.templateId === SitecoreTemplateId.VirtualRegionBrowsePage;
    const isVirtualResortBrowsePage = layout?.sitecore?.route.templateId === SitecoreTemplateId.VirtualResortBrowsePage;

    const relatedEntitiesCodes: string[] = getRelatedDestinationsCodes(
        fields,
        isVirtualRegionBrowsePage,
        isVirtualResortBrowsePage,
    );

    const isDestinationHeroBannerLivePriceEnabled =
        !!IsLivePriceEnabled && !isMaintenance && !!DestinationHeroBannerLivePrice;

    if (
        isEditMode ||
        !isDestinationPage ||
        !destinationCode ||
        !isDestinationHeroBannerLivePriceEnabled ||
        !isLivePriceEnabledForDestinationPage(
            destinationCode,
            parents,
            relatedEntitiesCodes,
            ExcludeLivePriceForDestinations,
        )
    ) {
        return {
            cheapestLivePriceForDestinationPage: null,
        };
    }

    const codes: string[] = relatedEntitiesCodes.length ? relatedEntitiesCodes : [destinationCode];
    const lang = context?.res?.locals?.lang ?? (context.locale as TSitecoreLangs) ?? ENGLISH;
    const market = getCMSLang(lang);

    const prices = await hotelsService.getLivePrice(codes.filter(onlyUnique).join(','), true, false, {
        headers: { Cookie: `holidays#lang=${market}` },
    });
    const cheapestLivePrice = getCheapestLivePrice(prices);

    return {
        cheapestLivePriceForDestinationPage: cheapestLivePrice,
    };
};

export default PageHeroBanner;
