import { render, screen } from '@testing-library/react';

import SitemapSection, { ISitemapSectionProps } from './SitemapSection';

const mockedSitemapAnchoredGroupList = jest.fn();
jest.mock('./SitemapAnchoredGroupList', () => ({
    __esModule: true,
    default: props => {
        mockedSitemapAnchoredGroupList(props);

        return <div data-tid='sitemap-anchored-group-list' />;
    },
}));

const mockedSitemapLinksList = jest.fn();
jest.mock('./SitemapLinksList', () => ({
    __esModule: true,
    default: props => {
        mockedSitemapLinksList(props);

        return <div data-tid='sitemap-links-list' />;
    },
}));

const mockedAccordion = jest.fn();
jest.mock('frontend/components/common/Accordion/Accordion', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockedAccordion(props);

        return <div data-tid='accordion'>{children}</div>;
    },
}));

const mockedAccordionPanel = jest.fn();
jest.mock('frontend/components/common/Accordion/AccordionPanel', () => ({
    __esModule: true,
    default: ({ content, ...props }) => {
        mockedAccordionPanel(props);

        return <div data-tid='accordion-panel'>{content}</div>;
    },
}));

const resetMocks = () =>
    ({
        isActive: true,
        SectionId: 'sectionId',
        IsGroupedAlphabetically: false,
        Pages: [
            { Id: 'Spain', Url: 'Spain', Name: 'Spain', PageTitle: 'Spain' },
            { Id: 'Austria', Url: 'Austria', Name: 'Austria', PageTitle: 'Austria' },
            { Id: 'Turkey', Url: 'Turkey', Name: 'Turkey', PageTitle: 'Turkey' },
            { Id: 'Sweden', Url: 'Sweden', Name: 'Sweden', PageTitle: 'Sweden' },
        ],
        Title: 'Countries',
    } as ISitemapSectionProps);

let mocks;

describe('<SitemapSection />', () => {
    beforeEach(() => {
        mocks = resetMocks();
    });

    it('Should render sorted links in one list', () => {
        const { container } = render(<SitemapSection {...mocks} />);

        expect(container.querySelector('.sitemap-section__title')).toHaveTextContent(mocks.Title);
        expect(screen.queryByTestId('sitemap-anchored-group-list')).not.toBeInTheDocument();
        expect(screen.getAllByTestId('sitemap-links-list').length).toEqual(1);
        expect(mockedSitemapLinksList).toHaveBeenCalledWith({
            pages: mocks.Pages,
        });
    });

    it('Should render sorted links in different groups', () => {
        mocks.IsGroupedAlphabetically = true;
        const { container } = render(<SitemapSection {...mocks} />);

        expect(container.querySelector('.sitemap-section__title')).toHaveTextContent(mocks.Title);
        expect(screen.queryByTestId('sitemap-links-list')).not.toBeInTheDocument();
        expect(screen.getByTestId('sitemap-anchored-group-list')).toBeInTheDocument();
        expect(mockedSitemapAnchoredGroupList).toHaveBeenCalledWith({
            isSectionActive: mocks.isActive,
            pages: mocks.Pages,
            sectionId: mocks.SectionId,
            sectionTitle: mocks.Title,
        });
    });

    it('Should render sitemap section with d-none class name when isActive props equal false', () => {
        mocks.isActive = false;
        render(<SitemapSection {...mocks} />);

        expect(screen.getByTestId('sitemap-section')).toHaveClass('d-none');
    });

    describe('Should render accordion with grouped pages', () => {
        const groupedPages = [
            {
                Id: 'group1',
                Title: 'Group One',
                Pages: [
                    { Id: 'page1', Url: '/page1', Name: 'Page 1', PageTitle: 'Page 1' },
                    { Id: 'page2', Url: '/page2', Name: 'Page 2', PageTitle: 'Page 2' },
                ],
            },
            {
                Id: 'group2',
                Title: 'Group Two',
                Pages: [{ Id: 'page3', Url: '/page3', Name: 'Page 3', PageTitle: 'Page 3' }],
            },
        ];

        beforeEach(() => {
            mocks.GroupedPages = groupedPages;
        });

        it('Should render an AccordionPanel for each GroupedPages entry', () => {
            render(<SitemapSection {...mocks} />);

            expect(screen.getByTestId('accordion')).toBeInTheDocument();
            expect(screen.getAllByTestId('accordion-panel').length).toEqual(groupedPages.length);

            expect(mockedAccordionPanel).toHaveBeenCalledTimes(groupedPages.length);
            expect(mockedAccordionPanel).toHaveBeenNthCalledWith(1, {
                panelId: groupedPages[0].Id,
                title: groupedPages[0].Title,
            });
            expect(mockedAccordionPanel).toHaveBeenNthCalledWith(2, {
                panelId: groupedPages[1].Id,
                title: groupedPages[1].Title,
            });
        });

        it('Should pass a SitemapLinksList as content to each AccordionPanel', () => {
            render(<SitemapSection {...mocks} />);

            expect(mockedSitemapLinksList).toHaveBeenCalledTimes(groupedPages.length);
            expect(mockedSitemapLinksList).toHaveBeenNthCalledWith(1, {
                pages: groupedPages[0].Pages,
            });
            expect(mockedSitemapLinksList).toHaveBeenNthCalledWith(2, {
                pages: groupedPages[1].Pages,
            });
        });

        it('Should not render SitemapAnchoredGroupList or standalone SitemapLinksList', () => {
            render(<SitemapSection {...mocks} />);

            expect(screen.queryByTestId('sitemap-anchored-group-list')).not.toBeInTheDocument();
        });

        it('Should render Accordion with isMultiple set to true', () => {
            render(<SitemapSection {...mocks} />);

            expect(mockedAccordion).toHaveBeenCalledWith(expect.objectContaining({ isMultiple: true }));
        });
    });
});
