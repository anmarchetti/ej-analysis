import React, { useState } from 'react';
import { InView } from 'react-intersection-observer';

import { scrollToElement } from 'frontend/utils/ui.utils';
import {
    AlphabetNav,
    AlphabetStickySelector,
    buildAlphabeticAnchors,
    IAlphabeticAnchor,
} from 'frontend/components/common/AlphabetIndex';
import { ISitemapPage } from 'frontend/components/renderings/Sitemap/SitemapBlock';

import SitemapAnchoredGroup from './SitemapAnchoredGroup';

interface ISitemapAnchoredGroupListProps {
    isSectionActive: boolean;
    pages: ISitemapPage[];
    sectionId: string;
    sectionTitle: string;
}

const SitemapAnchoredGroupList = ({
    pages,
    sectionTitle,
    sectionId,
    isSectionActive,
}: ISitemapAnchoredGroupListProps) => {
    const anchors = buildAlphabeticAnchors(pages, 'Name', (_p, letter) => `${letter}-${sectionId}`);
    const [activeAnchor, setActiveAnchor] = useState<IAlphabeticAnchor<ISitemapPage> | null>(anchors[0]);
    const [isLetterSelectorShown, setIsLetterSelectorShown] = useState(false);

    const onScrollToLetter = (anchor: IAlphabeticAnchor) => {
        setActiveAnchor(anchor);

        const element = document.getElementById(anchor.id);

        element && scrollToElement(element, 10);
    };

    const onHideLetterSelector = () => {
        setIsLetterSelectorShown(false);
    };

    const onShowLetterSelector = () => {
        // Show <AlphabetStickySelector/> for current section if top <AlphabetNav/> is hidden
        if (isSectionActive) {
            setIsLetterSelectorShown(true);
        }
    };

    const onChangeNav = (inView: boolean) => {
        if (inView) {
            onHideLetterSelector();
        } else {
            onShowLetterSelector();
        }
    };

    const onChangeItems = (inView: boolean) => {
        if (inView) {
            onShowLetterSelector();
        } else {
            onHideLetterSelector();
        }
    };

    return (
        <>
            <InView onChange={inView => onChangeNav(inView)}>
                <AlphabetNav
                    anchors={anchors}
                    activeAnchor={activeAnchor}
                    onAnchorClick={(event, anchor) => {
                        event.preventDefault();
                        setActiveAnchor(anchor);
                        onScrollToLetter(anchor);
                    }}
                />
            </InView>

            <InView onChange={inView => onChangeItems(inView)}>
                <ul className='sitemap-section__groups'>
                    {anchors.map(anchor => (
                        <li key={anchor.id}>
                            <SitemapAnchoredGroup anchor={anchor} pages={anchor.items} sectionTitle={sectionTitle} />
                        </li>
                    ))}
                </ul>
            </InView>

            {isLetterSelectorShown && (
                <AlphabetStickySelector
                    className='d-md-none'
                    anchors={anchors}
                    activeAnchor={activeAnchor}
                    onAnchorClick={(event, anchor) => {
                        event.preventDefault();
                        setActiveAnchor(anchor);
                        onScrollToLetter(anchor);
                    }}
                />
            )}
        </>
    );
};

export default SitemapAnchoredGroupList;
