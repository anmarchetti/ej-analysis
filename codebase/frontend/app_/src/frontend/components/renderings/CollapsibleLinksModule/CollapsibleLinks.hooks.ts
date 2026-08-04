import { useXSMobileViewport } from 'frontend/hooks/useMediaQuery';
import { splitArrayIntoNChunks } from 'frontend/utils/chunkArray';
import isBackend from 'frontend/utils/isBackend';
import { sortBy } from 'frontend/utils/sort.utils';
import SitecoreLinkType from 'models/enum/SitecoreLinkType';
import { ISitecoreField, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';

import { ICollapsibleLinksModuleFields, ICollapsibleLinksModuleParams } from './CollapsibleLinksModule';

export const useCollapsibleLinksByColumns = (
    fields: Nullable<ICollapsibleLinksModuleFields>,
    params: ICollapsibleLinksModuleParams,
): {
    links: ISitecoreField<ISitecoreLink>[];
    linksByColumns: ISitecoreField<ISitecoreLink>[][];
    numberOfColumns: number;
} => {
    const isExtraSmall = useXSMobileViewport();

    const getLinks = (): ISitecoreField<ISitecoreLink>[] => {
        const { Pages, Links } = fields || {};
        const links: ISitecoreField<ISitecoreLink>[] = [];

        if (Pages?.length) {
            // Convert Pages to ISitecoreField<ISitecoreLink>[]
            Pages.forEach(({ Url, Name, Id }) => {
                const href = Url;
                const text = Name;

                if (href && text) {
                    links.push({
                        value: { href, text, id: Id, linktype: SitecoreLinkType.Internal, target: '_blank' },
                    });
                }
            });
        } else if (Links?.length) {
            // Convert NavLinks[] to ISitecoreField<ISitecoreLink>[]
            Links.forEach(navLink => {
                const link = navLink.fields?.Link;

                if (link?.value?.text && link?.value?.href) {
                    links.push(link);
                }
            });
        }

        links.sort((link1, link2) => sortBy(link1, link2, link => link.value.text));

        return links;
    };
    const getNumberOfColumns = (): number => {
        const { ColumnsOnMobile, Columns } = params;

        return Number(isExtraSmall ? ColumnsOnMobile : Columns) || 1;
    };
    const getLinksColumns = () => splitArrayIntoNChunks(links, getNumberOfColumns());

    const links = getLinks();
    const numberOfColumns = getNumberOfColumns();
    const linksByColumns = getLinksColumns();

    return { links, linksByColumns, numberOfColumns };
};

export const useMaxVisibleLinksInColumn = (
    isBlockExpanded: boolean,
    totalLinksNumber: number,
    totalInitialVisibleLinks: number,
    numberOfColumns: number,
): number => {
    const isExtraSmall = useXSMobileViewport();
    // Show all links if it's SSR (for SEO) or the block is expanded on desktop.
    // On mobile always show only initial visible links (all links will be shown in drawer)
    const total = isBackend() || (isBlockExpanded && !isExtraSmall) ? totalLinksNumber : totalInitialVisibleLinks;

    return Math.ceil(total / numberOfColumns);
};
