import { FC, useEffect, useRef } from 'react';
import { RichText } from '@sitecore-jss/sitecore-jss-react';
import { observer } from 'mobx-react';
import sanitize from 'sanitize-html';

import { Anchor } from 'code/anchors';
import settings from 'code/settings';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { purifyUrl } from 'frontend/utils/url.utils';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';

export interface IRichTextWithLinksProps {
    className?: string;
    dataId?: string;
    disableLinkFocus?: boolean; //uses to fix a11y when component is visually hidden but still in the DOM
    enableClickEventForEmptyLinks?: boolean;
    field?: ISitecoreField<string>;
    id?: string;
    onLinkClick?: (e: MouseEvent) => void;
    tag?: React.ElementType;
    useEmptyLink?: boolean;
}

export const RichTextWithLinks: FC<IRichTextWithLinksProps> = ({
    field,
    className,
    dataId,
    onLinkClick,
    tag: Container = 'div',
    useEmptyLink,
    disableLinkFocus,
    enableClickEventForEmptyLinks,
    id,
}) => {
    const { isEditMode, redirectTo, basePath, toggleOfferConditions } = useStore((stores: TStores) => ({
        isEditMode: stores.layoutStore.isEditMode,
        redirectTo: stores.routerStore.redirectTo,
        basePath: stores.layoutStore.basePath,
        toggleOfferConditions: stores.appStore.toggleOfferConditions,
    }));
    const containerRef = useRef<HTMLDivElement>(null);
    const isRichEditorMode = (isEditMode || !field?.value?.includes('href=')) && !enableClickEventForEmptyLinks;

    useEffect(() => {
        const container = containerRef.current;

        if (isRichEditorMode) {
            return;
        }

        if (container) {
            container.addEventListener('click', onContainerClick);
        }

        return () => {
            if (!isRichEditorMode && container) {
                container.removeEventListener('click', onContainerClick);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!field?.value) {
        return null;
    }

    const onContainerClick = (e: MouseEvent): void => {
        const target = e.target as Nullable<HTMLElement>;

        if (target?.tagName === 'A') {
            onLinkClick?.(e);

            // By default click on internal links reload the app.
            // To avoid it use router redirect (don't redirect if event was prevented in props handler)
            if (target.dataset?.internal !== undefined && !e.defaultPrevented) {
                e.preventDefault();
                const href = target.dataset.path ?? (target as HTMLAnchorElement).href;

                // If it's offer conditions anchor, then scroll to bottom and open offer conditions
                if (href === Anchor.OfferConditions) {
                    toggleOfferConditions(true);

                    return;
                }

                redirectTo(href);
            }
        }
    };

    const transformLinkTag = (
        attribs,
    ): {
        attribs: any;
        tagName: string;
    } => {
        {
            const { href: hrefAttr, class: classAttr, style, rel, target, id } = attribs;
            const defaultParams = {
                class: classAttr ?? '',
                style: style ?? '',
                tabindex: disableLinkFocus ? '-1' : '0',
                id: id ?? '',
            };

            // external links
            if (hrefAttr?.startsWith('http') && !hrefAttr?.includes(`${settings.Default.baseDotCom}${basePath}`)) {
                return {
                    tagName: 'a',
                    attribs: {
                        ...defaultParams,
                        target: settings.Default.overloadedAttributes.target,
                        href: hrefAttr,
                        rel: rel ?? settings.Default.overloadedAttributes.rel,
                    },
                };
            }

            if (hrefAttr?.indexOf('tel:') > -1 || hrefAttr?.indexOf('mailto:') > -1) {
                return {
                    tagName: 'a',
                    attribs: {
                        ...defaultParams,
                        href: hrefAttr,
                    },
                };
            }

            // TODO: check case where href will be start from de/holidays and etc.
            const url = hrefAttr?.replace(settings.Default.baseDotCom, ''); // Trim prod from urls that have been added via sitecore
            const pureHref = purifyUrl(url);
            const basePathPosition = pureHref.indexOf(basePath);
            const href = basePathPosition >= 0 ? pureHref : basePath + pureHref;
            const purePath =
                basePathPosition >= 0
                    ? pureHref.replace(pureHref.substr(basePathPosition, basePath.length), '')
                    : pureHref;

            // fix for EJH-8835
            if (pureHref.indexOf('-/jssmedia') >= 0) {
                return {
                    tagName: 'a',
                    attribs: {
                        ...attribs,
                        ...defaultParams,
                        href: pureHref,
                    },
                };
            }

            if (target === '_blank') {
                return {
                    tagName: 'a',
                    attribs: {
                        ...defaultParams,
                        href,
                        target: target,
                    },
                };
            }

            if (useEmptyLink) {
                return {
                    tagName: 'a',
                    attribs: {
                        ...defaultParams,
                        role: 'button',
                    },
                };
            }

            return {
                tagName: 'a',
                attribs: {
                    ...defaultParams,
                    href,
                    'data-path': purePath,
                    'data-internal': true,
                },
            };
        }
    };

    return (
        <>
            {isRichEditorMode ? (
                <RichText field={field} className={className} tag={Container as string} data-tid={dataId} id={id} />
            ) : (
                <Container
                    ref={containerRef}
                    className={className}
                    data-tid={dataId}
                    id={id}
                    dangerouslySetInnerHTML={{
                        __html: sanitize(field.value, {
                            allowedTags: settings.Default.allowedTags,
                            allowedAttributes: settings.Default.allowedAttributes,
                            allowedSchemes: settings.Default.allowedSchemes,
                            allowVulnerableTags: true,
                            transformTags: {
                                a: (tagName, attribs) => transformLinkTag(attribs),
                            },
                        }),
                    }}
                />
            )}
        </>
    );
};

export default observer(RichTextWithLinks);
