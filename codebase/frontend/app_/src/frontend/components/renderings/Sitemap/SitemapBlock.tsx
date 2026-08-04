import React, { useState } from 'react';

import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';

import SitemapSection from './components/SitemapSection';
import SitemapTabList from './components/SitemapTabList';

export interface ISitemapPage {
    Id: string;
    Name: string;
    PageTitle: string;
    Url: string;
}

export interface ISitemapGroup {
    Id: string;
    Pages: ISitemapPage[];
    Title: string;
}

export interface ISitemapSection {
    IsGroupedAlphabetically: boolean;
    Pages: ISitemapPage[];
    SectionId: string;
    Title: string;
    GroupedPages?: ISitemapGroup[];
}

interface ISitemapFields {
    items: ISitemapSection[];
}

type TSitemapProps = ISitecoreComponent<ISitemapFields>;

const Sitemap = ({ fields }: TSitemapProps) => {
    const [activeTabIndex, setActiveTabIndex] = useState<number>(0);

    // Render only sections that has Title
    const items = (fields?.items || []).filter(el => !!el.Title);

    if (!items.length) {
        return null;
    }

    return (
        <div className='sitemap'>
            <SitemapTabList items={items} activeTabIndex={activeTabIndex} setActiveTabIndex={setActiveTabIndex} />

            <div className='wrapper-container--px py-0'>
                {items.map((section, i) => (
                    <SitemapSection key={section.SectionId} {...section} isActive={activeTabIndex === i} />
                ))}
            </div>
        </div>
    );
};

export default Sitemap;
