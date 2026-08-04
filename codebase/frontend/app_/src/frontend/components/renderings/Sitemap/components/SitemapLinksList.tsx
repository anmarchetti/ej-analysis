import React from 'react';

import { purifyUrl } from 'frontend/utils/url.utils';
import Link from 'frontend/components/common/Link';
import { ISitemapPage } from 'frontend/components/renderings/Sitemap/SitemapBlock';

interface ISitemapLinksListProps {
    pages: ISitemapPage[];
    numberOfHiddenLinks?: number;
    onLinkClick?: (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void;
}

export const SitemapLinksList = ({ pages, numberOfHiddenLinks, onLinkClick }: ISitemapLinksListProps) => (
    <ul className='sitemap-links-list'>
        {pages.map(page => (
            <li key={page.Id}>
                <Link href={purifyUrl(page.Url || '')} legacyBehavior>
                    <a className='sitemap-link' onClick={onLinkClick}>
                        {page.Name || page.PageTitle}
                    </a>
                </Link>
            </li>
        ))}
        {!!numberOfHiddenLinks && <li>+{numberOfHiddenLinks}</li>}
    </ul>
);

export default SitemapLinksList;
