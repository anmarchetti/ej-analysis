import React from 'react';
import classNames from 'classnames';

import { sortBy } from 'frontend/utils/sort.utils';
import Accordion from 'frontend/components/common/Accordion/Accordion';
import AccordionPanel from 'frontend/components/common/Accordion/AccordionPanel';
import { ISitemapSection } from 'frontend/components/renderings/Sitemap/SitemapBlock';

import SitemapAnchoredGroupList from './SitemapAnchoredGroupList';
import SitemapLinksList from './SitemapLinksList';

export interface ISitemapSectionProps extends ISitemapSection {
    isActive: boolean;
}

const SitemapSection = ({
    SectionId,
    Title,
    Pages,
    GroupedPages,
    IsGroupedAlphabetically,
    isActive,
}: ISitemapSectionProps) => {
    const renderContent = () => {
        if (GroupedPages?.length) {
            return (
                <div className='sitemap-links-group'>
                    <Accordion isMultiple>
                        {GroupedPages.map(group => (
                            <AccordionPanel
                                key={group.Id}
                                panelId={group.Id}
                                title={group.Title}
                                content={<SitemapLinksList pages={group.Pages} />}
                            />
                        ))}
                    </Accordion>
                </div>
            );
        }

        const sortedPages = (Pages || []).sort((a, b) =>
            sortBy(a, b, page => (page.Name || page.PageTitle || '').toLowerCase()),
        );

        if (IsGroupedAlphabetically) {
            return (
                <SitemapAnchoredGroupList
                    pages={sortedPages}
                    sectionTitle={Title}
                    sectionId={SectionId}
                    isSectionActive={isActive}
                />
            );
        }

        return (
            <div className='sitemap-links-group'>
                <SitemapLinksList pages={sortedPages} />
            </div>
        );
    };

    return (
        <section
            className={classNames('sitemap-section', !isActive && 'd-none')}
            data-tid='sitemap-section'
            role='tabpanel'
            id={`sitemap-section-${SectionId}`}
            aria-labelledby={`sitemap-tab-${SectionId}`}
        >
            {!!Title && <h2 className='sitemap-section__title'>{Title}</h2>}
            {renderContent()}
        </section>
    );
};

export default SitemapSection;
