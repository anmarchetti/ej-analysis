import { Redirect } from 'next';

import { TServerSidePageContext, TSitecorePageProps } from 'lib/page-props';
import { getPagePathFromContext } from 'lib/page-props-factory';
import { ISitecoreLayout } from 'models/data/SitecoreLayout';

import { purifyUrl } from './url.utils';

export function getRedirectFromLayout(layout: ISitecoreLayout, path: string): Nullable<Redirect> {
    const fields = layout.sitecore?.route?.fields || {};
    const contextRedirect = layout.sitecore?.context?.redirect;
    const redirect =
        fields.RedirectUrl?.value?.href && fields.RedirectType?.value
            ? {
                  destination: purifyUrl(fields.RedirectUrl.value.href, true),
                  statusCode: Number(fields.RedirectType.value),
              }
            : {
                  destination: contextRedirect?.redirectUrl,
                  statusCode: contextRedirect?.redirectType,
              };

    // Redirect only if the url doesn't equal the current path
    if (redirect.statusCode && redirect.destination && redirect.destination !== path) {
        return redirect as Redirect;
    }

    return null;
}

export function getServerSidePageRedirect(
    { layout }: TSitecorePageProps,
    context: TServerSidePageContext,
): Nullable<Redirect> {
    if (!layout) return null;

    const path = context.res.locals?.path || getPagePathFromContext(context);
    const redirect = getRedirectFromLayout(layout, path);

    if (redirect) {
        return {
            ...redirect,
            destination: redirect.destination.startsWith('http')
                ? redirect.destination
                : `${context.res.locals?.basePath || ''}${redirect.destination}`,
        };
    }

    return null;
}
