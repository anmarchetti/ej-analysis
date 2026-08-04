import { INestedObject } from '@sitecore/engage/types/lib/utils/flatten-object';
import { LayoutServiceContext, LayoutServiceData, PlaceholdersData } from '@sitecore-jss/sitecore-jss-nextjs';

import { TCmsLang } from 'code/cmsLang';
import SitecoreTemplateId from 'models/enum/SitecoreTemplateId';
import TradePortalSitecoreTemplateId from 'models/enum/tradePortal/TradePortalSitecoreTemplateId';
import { IOptimizelyDecision } from 'models/optimizely';
import { ISitecorePersonalizeExperiment } from 'models/sitecore/ISitecorePersonalizeExperiment';

import { IBreadcrumb } from './IBreadcrumb';
import { IDestination } from './IDestination';

export interface ISitecoreLayoutRoute {
    displayName: string;
    fields: any;
    itemId: string;
    name: string;
    placeholders: PlaceholdersData;
    templateId: SitecoreTemplateId | TradePortalSitecoreTemplateId;
}

export interface ISitecoreLayout extends LayoutServiceData {
    sitecore: {
        context: ISitecoreLayoutContext;
        route: ISitecoreLayoutRoute;
    };
    /** Extra data for route (for meta tags) */
    extraRouteData?: {
        pageDescription: string;
        pageImage: string;
        pageTitle: string;
    };
    meta?: {
        shouldRedirect: boolean;
        url: string;
    };
}

export interface ISitecoreLayoutContext extends LayoutServiceContext {
    baseTemplates: SitecoreTemplateId[] | TradePortalSitecoreTemplateId[];
    isFullMode: boolean;
    isSoftMode: boolean;
    pageProfile: INestedObject;
    // EDI-228: used after redirect from the hotel preview page in query of the get packages request
    accommodationCodes?: string[];
    countryName?: string; // exists on only hotel browse pages
    experiments?: ISitecorePersonalizeExperiment[];
    imageUrl?: string; // exists on only hotel browse pages
    optimizelyDecisions?: IOptimizelyDecision[];
    optimizelyUserAttributes?: Record<string, any>;
    optimizelyUserId?: string;
    pageUrls?: Record<TCmsLang, string>; // Page Urls in other languages. Object with language as key and url as value, e.g. { en: '/spain', 'fr-CH': '/espagne' }
    parentPages?: IBreadcrumb[];
    parents?: IDestination[];
    redirect?: {
        preserveQueryString?: boolean;
        redirectType?: number;
        redirectUrl?: string;
    };
    trackingId?: string;
}
