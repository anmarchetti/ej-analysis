import { render, screen } from '@testing-library/react';

import Sitemap from './SitemapBlock';

const mockSiteMapSectionProps = jest.fn();
jest.mock('./components/SitemapSection', () => ({
    __esModule: true,
    default: props => {
        mockSiteMapSectionProps(props);

        return <div data-tid='sitemap-section' />;
    },
}));

jest.mock('./components/SitemapTabList', () => ({
    __esModule: true,
    default: () => <div data-tid='sitemap-tab-list' />,
}));

const resetMocks = () => ({
    fields: {
        items: [
            {
                IsGroupedAlphabetically: true,
                Title: 'Countries',
                SectionId: 'countriesId',
                Pages: [],
            },
            {
                IsGroupedAlphabetically: false,
                Title: 'Deals',
                SectionId: 'dealsId',
                Pages: [],
            },
            {
                IsGroupedAlphabetically: false,
                Title: 'Helpful links',
                SectionId: 'helpId',
                Pages: [],
            },
        ],
    },
});

let mocks;

describe('<Sitemap />', () => {
    beforeEach(() => {
        mocks = resetMocks();
    });

    it('Should standard render', () => {
        const { container } = render(<Sitemap {...mocks} />);

        expect(container).not.toBeEmptyDOMElement();
        expect(screen.getAllByTestId('sitemap-section').length).toEqual(mocks.fields.items.length);
        expect(screen.getByTestId('sitemap-tab-list')).toBeInTheDocument();
    });

    it('Should empty render', () => {
        mocks.fields = null;
        const { container } = render(<Sitemap {...mocks} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('Should pass correct props to each SitemapSection', () => {
        render(<Sitemap {...mocks} />);

        expect(mockSiteMapSectionProps).toHaveBeenCalledTimes(mocks.fields.items.length);

        expect(mockSiteMapSectionProps).toHaveBeenNthCalledWith(1, {
            Title: 'Countries',
            SectionId: 'countriesId',
            IsGroupedAlphabetically: true,
            Pages: [],
            isActive: true,
        });

        expect(mockSiteMapSectionProps).toHaveBeenNthCalledWith(2, {
            Title: 'Deals',
            SectionId: 'dealsId',
            IsGroupedAlphabetically: false,
            Pages: [],
            isActive: false,
        });

        expect(mockSiteMapSectionProps).toHaveBeenNthCalledWith(3, {
            Title: 'Helpful links',
            SectionId: 'helpId',
            IsGroupedAlphabetically: false,
            Pages: [],
            isActive: false,
        });
    });
});
