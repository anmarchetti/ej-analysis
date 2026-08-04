import React from 'react';
import { render } from '@testing-library/react';

import { getCMSLang, TCmsLang } from 'code/cmsLang';

import HeadHrefLang from './HeadHrefLang';

jest.mock('next/head', () => ({ children }: { children: Array<React.ReactElement> }) => <>{children}</>);

const createStores = () => ({
    layoutStore: {
        lang: 'ch-fr',
        pageFields: {
            ManualHreflangTag: {
                value: `<link rel="alternate" href="https://www.easyjet.com/en/holidays/spain" hreflang="en" /><link rel="alternate" href="https://www.easyjet.com/ch-de/ferien/spanien" hreflang="de-ch" />`,
            },
        },
        pageUrls: {
            en: '/destinations/malta',
            'de-CH': '/destinations/malta',
        } as Record<TCmsLang, string>,
        fullUrl: 'https://www.easyjet.com/ch-fr/holidays/malta',
        getSitePathInLang: jest.fn(lang => `https://www.easyjet.com/${lang}/holidays`),
    },
});

let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('HeadHreflang', () => {
    beforeEach(() => {
        mockStores = createStores();
    });

    it('should render nothing when no other page versions and no ManualHreflangTags', () => {
        mockStores.layoutStore.pageUrls = undefined;
        mockStores.layoutStore.pageFields.ManualHreflangTag.value = '';
        const { container } = render(<HeadHrefLang />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render hreflang tags by sitecore ManualHreflangTag field when page versions does not exist', () => {
        mockStores.layoutStore.pageUrls = undefined;
        const { container } = render(<HeadHrefLang />, {
            container: document.head,
        });
        const links = container.querySelectorAll('link[rel=alternate]');

        const COUNT_OF_LINKS_BY_WHICH_MANUAL_HREFLANG_TAG_IS_DIVIDED = 2;
        expect(links).toHaveLength(COUNT_OF_LINKS_BY_WHICH_MANUAL_HREFLANG_TAG_IS_DIVIDED);

        expect(links[0]).toHaveAttribute('href', 'https://www.easyjet.com/en/holidays/spain');
        expect(links[0]).toHaveAttribute('hreflang', 'en');

        expect(links[1]).toHaveAttribute('href', 'https://www.easyjet.com/ch-de/ferien/spanien');
        expect(links[1]).toHaveAttribute('hreflang', 'de-ch');
    });

    it('should render hreflang tags by sitecore ManualHreflangTag field even when page versions exist', () => {
        const { container } = render(<HeadHrefLang />, {
            container: document.head,
        });
        const links = container.querySelectorAll('link[rel=alternate]');

        const COUNT_OF_LINKS_BY_WHICH_MANUAL_HREFLANG_TAG_IS_DIVIDED = 2;
        expect(links).toHaveLength(COUNT_OF_LINKS_BY_WHICH_MANUAL_HREFLANG_TAG_IS_DIVIDED);

        expect(links[0]).toHaveAttribute('href', 'https://www.easyjet.com/en/holidays/spain');
        expect(links[0]).toHaveAttribute('hreflang', 'en');

        expect(links[1]).toHaveAttribute('href', 'https://www.easyjet.com/ch-de/ferien/spanien');
        expect(links[1]).toHaveAttribute('hreflang', 'de-ch');
    });

    it('should render hreflang tags that are built dynamically with hreflang from current lang in CMS format', () => {
        mockStores.layoutStore.pageFields.ManualHreflangTag.value = undefined;
        const { container } = render(<HeadHrefLang />, {
            container: document.head,
        });
        const links = container.querySelectorAll('link[rel=alternate]');

        // page urls in other languages + current one
        expect(links).toHaveLength(Object.keys(mockStores.layoutStore.pageUrls).length + 1);

        expect(links[0]).toHaveAttribute('href', 'https://www.easyjet.com/ch-fr/holidays/malta');
        expect(links[0]).toHaveAttribute('hreflang', `${getCMSLang(mockStores.layoutStore.lang)}`);

        expect(links[1]).toHaveAttribute('href', 'https://www.easyjet.com/en/holidays/malta');
        expect(links[1]).toHaveAttribute('hreflang', 'en');

        expect(links[2]).toHaveAttribute('href', 'https://www.easyjet.com/ch-de/holidays/malta');
        expect(links[2]).toHaveAttribute('hreflang', 'de-CH');
    });
});
