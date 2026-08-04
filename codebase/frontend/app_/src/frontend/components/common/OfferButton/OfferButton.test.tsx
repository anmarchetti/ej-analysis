import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import { isHolidayStore } from 'frontend/store/holidays';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Link from 'frontend/components/common/Link';

import OfferButton, { IOfferButtonProps } from './OfferButton';

jest.mock('frontend/hooks/useMediaQuery');

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/store/holidays');

jest.mock('frontend/components/common/Link', () =>
    jest.fn(({ children, ...props }) => (
        <a data-tid='link' {...props}>
            {children}
        </a>
    )),
);

const createProps = (): IOfferButtonProps => ({
    asLink: 'testLink',
    link: 'link',
    onClick: jest.fn(),
    label: undefined,
});

const createStores = () =>
    createMockStores({
        layoutStore: {
            isPricesHidden: true,
        },
        searchStore: { setNeedOpenWhenField: jest.fn() },
    });

let mockProps;
let mockStores = createStores();

describe('<OfferPriceButton />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render Link with default label', () => {
        render(<OfferButton {...mockProps} />);

        expect(screen.getByText(SitecoreDictionary.SearchResultsButtonsViewHoliday)).toBeInTheDocument();
    });

    it('should render Link with passed label', () => {
        mockProps.label = 'label';
        render(<OfferButton {...mockProps} />);

        expect(screen.getByText(mockProps.label)).toBeInTheDocument();
    });

    it('should render Link with paased href', () => {
        render(<OfferButton {...mockProps} />);

        expect(Link).toHaveBeenCalledWith(
            expect.objectContaining({
                href: mockProps.link,
            }),
            expect.anything(),
        );
    });

    it('should render Link with the correct as attribute when asLink is provided', () => {
        render(<OfferButton {...mockProps} />);

        expect(Link).toHaveBeenCalledWith(
            expect.objectContaining({
                as: 'testLink',
            }),
            expect.anything(),
        );
    });

    it('should not pass asLink prop to Link when it is not provided', () => {
        mockProps.asLink = undefined;
        render(<OfferButton {...mockProps} />);

        expect(Link).toHaveBeenCalledWith(
            expect.not.objectContaining({
                as: expect.any(String),
            }),
            expect.anything(),
        );
    });

    it('should call onClick when clicking on Link and not open search field on desktop holidays website', async () => {
        jest.mocked(useMobileViewport).mockReturnValue(false);
        jest.mocked(isHolidayStore).mockReturnValue(true);

        render(<OfferButton {...mockProps} />);

        const linkProps = jest.mocked(Link).mock.calls[0][0] as { onClick?: () => void };

        await userEvent.click(screen.getByText(SitecoreDictionary.SearchResultsButtonsViewHoliday));

        expect(linkProps).toBeDefined();

        linkProps.onClick!();

        expect(mockProps.onClick).toHaveBeenCalled();
        expect(mockStores.searchStore.setNeedOpenWhenField).not.toHaveBeenCalled();
    });

    it('should call onClick when clicking on Link and not open search field on mobile holidays website', async () => {
        jest.mocked(useMobileViewport).mockReturnValue(true);
        jest.mocked(isHolidayStore).mockReturnValue(true);

        render(<OfferButton {...mockProps} />);

        await userEvent.click(screen.getByText(SitecoreDictionary.SearchResultsButtonsViewHoliday));

        expect(mockProps.onClick).toHaveBeenCalled();
        expect(mockStores.searchStore.setNeedOpenWhenField).not.toHaveBeenCalled();
    });

    it('should call onClick when clicking on Link and open search field on trade desktop when price is not visible', async () => {
        jest.mocked(useMobileViewport).mockReturnValue(false);
        jest.mocked(isHolidayStore).mockReturnValue(false);
        mockStores.layoutStore.isPricesHidden = true;

        render(<OfferButton {...mockProps} />);

        await userEvent.click(screen.getByText(SitecoreDictionary.SearchResultsButtonsViewHoliday));

        expect(mockProps.onClick).toHaveBeenCalled();
        expect(mockStores.searchStore.setNeedOpenWhenField).toHaveBeenCalled();
    });

    it('should call onClick when clicking on Link and not open search field on trade mobile when price is not visible', async () => {
        jest.mocked(useMobileViewport).mockReturnValue(true);
        jest.mocked(isHolidayStore).mockReturnValue(false);
        mockStores.layoutStore.isPricesHidden = true;

        render(<OfferButton {...mockProps} />);

        await userEvent.click(screen.getByText(SitecoreDictionary.SearchResultsButtonsViewHoliday));

        expect(mockProps.onClick).toHaveBeenCalled();
        expect(mockStores.searchStore.setNeedOpenWhenField).not.toHaveBeenCalled();
    });
});
