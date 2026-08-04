import { FC } from 'react';
import { Link as JSSLink } from '@sitecore-jss/sitecore-jss-nextjs';
import { inject } from 'mobx-react';

import { Anchor } from 'code/anchors';
import { isHolidayStore } from 'frontend/store/holidays';
import { TStores } from 'frontend/store/IStores';
import isBackend from 'frontend/utils/isBackend';
import { containsSubstring } from 'frontend/utils/string.utils';
import { purifyUrl } from 'frontend/utils/url.utils';
import { QueryParamName } from 'models/enum/QueryParamName';
import SitecoreLinkType from 'models/enum/SitecoreLinkType';
import SitePath from 'models/enum/SitePath';
import { ISitecoreField, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';

import Link from './Link';

export interface IAppLinkProps {
    isEditMode: boolean;
    link: ISitecoreField<ISitecoreLink>;
    setLoginTabActive: (value: boolean) => void;
    showOfferConditions: () => void;
    ariaLabel?: string;
    children?: React.ReactNode;
    className?: string;
    dataId?: string;
    isNoFollowTagEnabled?: boolean;
    onClick?: (e: React.MouseEvent) => void;
    replace?: boolean;
    style?: React.CSSProperties;
    title?: string;
}

// TODO: Maybe remove props children and use only props field
export const RouterLink: FC<IAppLinkProps> = props => {
    let additionalFunc: any;

    const { isEditMode, link, className, style, children, isNoFollowTagEnabled, onClick, dataId } = props;

    if (!link) {
        return null;
    }

    let href = link.value.href;

    if (link.value.linktype === SitecoreLinkType.Internal && link.value.querystring) {
        href = href ? `${href}?${link.value.querystring}` : '';
    } else {
        href = href || link.value.url || '';
    }

    let pureHref = purifyUrl(href);

    const currentHref = '';

    if (containsSubstring(href, SitePath.Login)) {
        if (containsSubstring(currentHref, SitePath.Login)) {
            pureHref = currentHref;
        } else if (href.indexOf(QueryParamName.RedirectUrl) < 0) {
            // add redirectUrl only if it's not already coming from sitecore
            let redirectUrlQuery = '';
            const arr = pureHref.split('?');

            if (arr.length > 1 && arr[1].split('=').length > 1 && redirectUrlQuery.indexOf('?') === 0) {
                redirectUrlQuery = '&' + redirectUrlQuery.slice(1);
            }

            pureHref = `${pureHref}${redirectUrlQuery}`;
        }

        additionalFunc = (): void =>
            props.setLoginTabActive(!containsSubstring(link.value.querystring, QueryParamName.ViewMyBooking));
    }

    if (isEditMode) {
        return <JSSLink field={link} className={className} />;
    }

    if (
        link.value.linktype === SitecoreLinkType.External ||
        link.value.linktype === SitecoreLinkType.SyntheticExternal
    ) {
        return (
            <a
                href={href}
                className={className}
                style={style}
                target={link.value.target}
                rel={
                    isNoFollowTagEnabled
                        ? 'nofollow'
                        : link.value.linktype === SitecoreLinkType.External
                        ? link.value.rel
                            ? link.value.rel
                            : 'noopener noreferrer'
                        : undefined
                }
                title={props.title}
                onClick={(e: React.MouseEvent<HTMLAnchorElement>): void => {
                    !link.value.url && e.preventDefault();
                    onClick?.(e);
                }}
                data-tid={dataId}
                aria-label={props.ariaLabel}
            >
                {children}
            </a>
        );
    }

    let shouldPreventDefault = false;

    if (link.value.linktype === SitecoreLinkType.Anchor) {
        // if it's offer conditions anchor, then open offer conditions and scroll to bottom
        if (pureHref === Anchor.OfferConditions) {
            shouldPreventDefault = true;

            additionalFunc = (): void => {
                // we prevent native scroll to remove jumping when we have sticky header
                !isBackend() && window.history.pushState({}, '', Anchor.OfferConditions);
                props.showOfferConditions();
            };
        } else {
            // return a simple link if it's an anchor, so page will scroll to anchor
            return (
                <a
                    href={pureHref}
                    title={props.title}
                    className={className}
                    style={style}
                    target={link.value.target}
                    onClick={(e: React.MouseEvent<HTMLAnchorElement>): void => {
                        onClick?.(e);
                    }}
                    data-tid={dataId}
                >
                    {children}
                </a>
            );
        }
    }

    // if have replace props, we need to hard-refresh the app. Needed for click on logo
    if (!!props.replace) {
        return (
            <a
                href={pureHref}
                title={props.title}
                className={className}
                style={style}
                target={link.value.target}
                data-tid={dataId}
            >
                {children}
            </a>
        );
    }

    return (
        // Fix for EJH-17416 - Firefox error caused by page reload on RouterLink.
        <Link href={pureHref} legacyBehavior passHref>
            <a
                className={className}
                style={style}
                title={props.title}
                onClick={(e: React.MouseEvent<HTMLAnchorElement>): void => {
                    shouldPreventDefault && e.preventDefault();
                    onClick?.(e);
                    additionalFunc?.();
                }}
                target={link.value.target}
                rel={isNoFollowTagEnabled ? 'nofollow' : undefined}
                data-tid={dataId}
                tabIndex={0}
                role={pureHref ? undefined : 'button'}
                aria-label={props.ariaLabel}
            >
                {children}
            </a>
        </Link>
    );
};

export default inject((stores: TStores) => ({
    isEditMode: stores.layoutStore.isEditMode,
    setLoginTabActive: isHolidayStore(stores) ? stores.userStore.setLoginTabActive : () => {},
    showOfferConditions: (): void => {
        stores.appStore.toggleOfferConditions(true);
    },
}))(RouterLink);
