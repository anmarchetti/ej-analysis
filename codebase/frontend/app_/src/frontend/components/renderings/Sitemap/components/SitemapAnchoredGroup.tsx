import React, { useRef, useState } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { IAlphabeticAnchor } from 'frontend/components/common/AlphabetIndex';
import Button from 'frontend/components/common/Button';
import Drawer from 'frontend/components/common/Drawer';
import SvgChevronLeft from 'frontend/components/icons-new/ChevronLeft';
import SvgChevronRight from 'frontend/components/icons-new/ChevronRight';
import { ISitemapPage } from 'frontend/components/renderings/Sitemap/SitemapBlock';

import SitemapLinksList from './SitemapLinksList';

interface ISitemapAnchoredGroupList {
    anchor: IAlphabeticAnchor;
    pages: ISitemapPage[];
    sectionTitle: string;
}

const MAX_VISIBLE_LINKS_ON_MOBILE = 2;

const SitemapAnchoredGroup = ({ anchor, pages, sectionTitle }: ISitemapAnchoredGroupList) => {
    const { isScreenLessMedium, getPhrase } = useStore(stores => ({
        isScreenLessMedium: stores.appStore.isScreenLessMedium,
        getPhrase: stores.layoutStore.getPhrase,
    }));
    const [isDrawerOpened, setIsDrawerOpened] = useState(false);
    const drawerRef = useRef<HTMLDivElement | null>(null);
    const drawerTitleId = `drawer-title-${anchor.id}`;

    const hasDrawer = isScreenLessMedium && pages.length > 1;
    const visibleLinks = hasDrawer ? pages.slice(0, MAX_VISIBLE_LINKS_ON_MOBILE) : pages;

    const openDrawer = () => {
        setIsDrawerOpened(true);

        if (drawerRef.current) {
            drawerRef.current.scrollTop = 0;
        }
    };

    const closeDrawer = () => {
        setIsDrawerOpened(false);
    };

    const onDrawerLinkClick = () => {
        closeDrawer();

        setTimeout(() => {
            window.scrollTo(0, 0);
        });
    };

    return (
        <div id={anchor.id} className='sitemap-links-group sitemap-links-group--anchor'>
            <span className='sitemap-links-group__letter'>{anchor.letter}</span>

            <SitemapLinksList pages={visibleLinks} numberOfHiddenLinks={pages.length - visibleLinks.length} />

            {hasDrawer && (
                <Button
                    className='sitemap-links-group__toggle'
                    isText
                    onClick={openDrawer}
                    aria-label={`${getPhrase(SitecoreDictionary.GlobalsLabelsShowMore)} "${sectionTitle} - ${
                        anchor.letter
                    }"`}
                >
                    <SvgChevronRight />
                </Button>
            )}

            {hasDrawer && (
                <Drawer
                    open={isDrawerOpened}
                    className='sitemap-links-drawer'
                    aria-labelledby={drawerTitleId}
                    containerRef={drawerRef}
                >
                    <div className='drawer__content wrapper-container--px'>
                        <h3 className='sitemap-section__title' id={drawerTitleId}>
                            {sectionTitle} - {anchor.letter}
                        </h3>

                        <SitemapLinksList pages={pages} onLinkClick={onDrawerLinkClick} />
                    </div>

                    <div className='drawer__actions'>
                        <Button isText onClick={closeDrawer}>
                            <SvgChevronLeft className='me-1' />
                            {getPhrase(SitecoreDictionary.GlobalsButtonsBack)}
                        </Button>
                    </div>
                </Drawer>
            )}
        </div>
    );
};

export default observer(SitemapAnchoredGroup);
