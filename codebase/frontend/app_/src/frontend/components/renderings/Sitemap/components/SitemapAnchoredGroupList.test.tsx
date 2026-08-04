import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { scrollToElement } from 'frontend/utils/ui.utils';
import * as utils from 'frontend/components/common/AlphabetIndex/alphabetIndex.utils';

import SitemapAnchoredGroupList from './SitemapAnchoredGroupList';

const createProps = () => ({
    pages: [1, 1],
    sectionId: 'id',
    sectionTitle: 'title',
    isSectionActive: 'false',
});

let mockProps;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useState: initial => [!initial, jest.fn()],
}));

jest.mock('react-intersection-observer', () => ({
    ...jest.requireActual('react-intersection-observer'),
    InView: ({ children }) => <div data-tid='in-view'>{children}</div>,
}));

jest.mock('frontend/utils/ui.utils', () => ({
    scrollToElement: jest.fn(),
}));

jest.mock('frontend/components/common/AlphabetIndex/AlphabetNav', () => ({ onAnchorClick }) => (
    <div data-tid='alphabet-nav'>
        <button onClick={() => onAnchorClick({ preventDefault: jest.fn() }, { id: 'id' })}>onAnchorClick</button>
    </div>
));

jest.mock('frontend/components/renderings/Sitemap/components/SitemapAnchoredGroup', () => () => (
    <div data-tid='sitemap-anchored-group' />
));

jest.mock('frontend/components/common/AlphabetIndex/AlphabetStickySelector', () => () => (
    <div data-tid='alphabet-sticky-selector' />
));

describe('<SitemapAnchoredGroupList />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render 2 InView components', () => {
        const { getAllByTestId } = render(<SitemapAnchoredGroupList {...mockProps} />);

        expect(getAllByTestId('in-view').length).toBe(2);
    });

    it('should render AlphabetNav', () => {
        const { getByTestId } = render(<SitemapAnchoredGroupList {...mockProps} />);

        expect(getByTestId('alphabet-nav')).toBeInTheDocument();
    });

    it('should call scrollToElement when AlphabetNav anchor is clicked', async () => {
        jest.spyOn(document, 'getElementById').mockReturnValue({ offsetTop: 100 } as HTMLElement);

        render(<SitemapAnchoredGroupList {...mockProps} />);

        await userEvent.click(
            within(screen.getByTestId('alphabet-nav')).getByRole('button', {
                name: 'onAnchorClick',
            }),
        );

        expect(scrollToElement).toBeCalledWith({ offsetTop: 100 }, 10);
    });

    it('should render 3 SitemapAnchoredGroups when buildAlphabeticAnchors return 3 items', () => {
        jest.spyOn(utils, 'buildAlphabeticAnchors').mockReturnValueOnce([
            { id: '1', items: [] },
            { id: '2', items: [] },
            { id: '3', items: [] },
        ] as any);
        const { getAllByTestId } = render(<SitemapAnchoredGroupList {...mockProps} />);

        expect(getAllByTestId('sitemap-anchored-group').length).toBe(3);
    });

    it('should NOT render SitemapAnchoredGroup when buildAlphabeticAnchors return 0 items', () => {
        jest.spyOn(utils, 'buildAlphabeticAnchors').mockReturnValueOnce([] as any);
        const { queryByTestId } = render(<SitemapAnchoredGroupList {...mockProps} />);

        expect(queryByTestId('sitemap-anchored-group')).not.toBeInTheDocument();
    });

    it('should render AlphabetStickySelector when is Letter Selector Shown', () => {
        const { getByTestId } = render(<SitemapAnchoredGroupList {...mockProps} />);

        expect(getByTestId('alphabet-sticky-selector')).toBeInTheDocument();
    });
});
