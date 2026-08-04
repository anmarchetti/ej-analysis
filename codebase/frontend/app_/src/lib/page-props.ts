import { ComponentPropsCollection, DictionaryPhrases } from '@sitecore-jss/sitecore-jss-nextjs';
import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { GetServerSidePropsContext } from 'next';

import { TSitecoreLangs } from 'code/cmsLang';
import { TInitialStoresState } from 'frontend/store/IStores';
import { TAllMarketsSettings } from 'models/data/MarketSettings';
import { ISitecoreTooltipSettings } from 'models/data/PriceTooltip';
import { ISitecoreLayout } from 'models/data/SitecoreLayout';

/**
 * Sitecore page props
 */
export type TSitecorePageProps = {
    componentProps: ComponentPropsCollection;
    layout: ISitecoreLayout;
    locale: string;
    allMarketsSettings?: Nullable<TAllMarketsSettings>;
    dictionary?: DictionaryPhrases;
    initMobxState?: TInitialStoresState;
    isInit?: boolean;
    query?: any;
    settings?: any;
    ssoAuthenticated?: boolean; // used only for TradePortal SSO
    tooltipSettings?: Nullable<ISitecoreTooltipSettings>; // flag to check if it's initial load of react app (not moving between pages)
};

export type TResponseLocals = {
    basePath?: string;
    isAPPDScriptDisabled?: boolean;
    isExperienceEditor?: boolean;
    isIframe?: boolean;
    isPromoCarouselIframe?: boolean;
    lang?: TSitecoreLangs;
    noAnalytics?: boolean;
    path?: string;
    publicIp?: string;
    sameSession?: boolean;
};

export type TServerSidePageContextResProps = GetServerSidePropsContext['res'] &
    Omit<ExpressResponse, 'locals'> & {
        // local variables that we set in express server
        settings: {
            DestinationHeroBannerLivePrice?: string;
            ExcludeLivePriceForDestinations?: string[];
            IsLivePriceEnabled?: string;
        };
        locals?: TResponseLocals;
    };

/**
 * Extend Next Server Side Context with Express res and req
 */
export type TServerSidePageContext = GetServerSidePropsContext & {
    req: GetServerSidePropsContext['req'] & ExpressRequest;
    res: TServerSidePageContextResProps;
};
