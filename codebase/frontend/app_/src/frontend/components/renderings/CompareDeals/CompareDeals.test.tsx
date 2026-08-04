import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { mockCompareFields } from 'frontend/__mocks__/compare';
import { getShortlistOfferIdentifier } from 'frontend/utils/tracking/comparisonTable.utils';
import { disableScroll, enableScroll } from 'frontend/utils/ui.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SitePath from 'models/enum/SitePath';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventCategories, EventLabels } from 'models/enum/tracking/GenericEventParams';

import CompareDeals, { TCompareDealsProps } from './CompareDeals';

jest.mock('frontend/utils/tracking/comparisonTable.utils');

jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: ({ onClick, children, id, disabled, dataTid }) => (
        <button data-tid={dataTid} id={id} onClick={onClick} disabled={disabled}>
            {children}
        </button>
    ),
}));

jest.mock('./components/ComparisonTable/ComparisonTable', () => () => <div data-tid='comparison-table' />);

let mockUseMobileViewport = false;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMobileViewport: () => mockUseMobileViewport,
}));

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: ({ field }) => <div data-tid='text'>{field.value}</div>,
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/utils/ui.utils', () => ({
    disableScroll: jest.fn(),
    enableScroll: jest.fn(),
}));

jest.mock('./stores/createCompareLocalStore', () => ({
    ...jest.requireActual('./stores/createCompareLocalStore'),
    useCompareStore: () => mockLocalStore,
}));

const resetMocks = (): TCompareDealsProps => ({
    fields: mockCompareFields,
    params: {},
    rendering: {},
});
const createMockedStores = () =>
    createMockStores({
        searchStore: {
            isSeachPerformWithNewParams: false,
        },
        trackingStore: {
            trackEventWithParams: jest.fn(),
            pageLang: 'CH-FR',
            pageTitle: 'Search Results',
        },
    });
const createMockLocalStore = () => ({
    comparisonListLength: 0,
    deactivateCompareMode: jest.fn(),
    hasMaxItemsToCompare: false,
    clearComparisonList: jest.fn(),
    hasMinItemsToCompare: false,
    isCompareOverlayOpened: false,
    closeCompareOverlay: jest.fn(),
    openCompareOverlay: jest.fn(),
    comparisonList: [],
    setCompareDealsFields: jest.fn(),
    compareDealsMaxItemCount: 3,
});

let mocks;
let mockStores;
let mockLocalStore;

describe('<CompareDeals />', () => {
    beforeEach(() => {
        mocks = resetMocks();
        mockStores = createMockedStores();
        mockUseMobileViewport = false;
        mockLocalStore = createMockLocalStore();
    });

    it('should not render component when no fields', () => {
        mocks.fields = undefined;
        const { container } = render(<CompareDeals {...mocks} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render compare buttons and labels on desktop', () => {
        render(<CompareDeals {...mocks} />);

        expect(screen.getByText(`0/${mockLocalStore.compareDealsMaxItemCount}`)).toBeInTheDocument();
        expect(screen.getByText(mocks.fields.SelectedHolidaysLabel.value)).toBeInTheDocument();
        expect(screen.getByTestId('cancel-compare-mode-button')).toHaveTextContent(
            mocks.fields.CancelCompareButton.value,
        );
        expect(screen.getByTestId('compare-button')).toHaveTextContent(mocks.fields.ViewCompareButton.value);
    });

    it('should render compare buttons and labels on mobile', () => {
        mockUseMobileViewport = true;
        render(<CompareDeals {...mocks} />);

        expect(screen.getByText(`0/${mockLocalStore.compareDealsMaxItemCount}`)).toBeInTheDocument();
        expect(screen.queryByText(mocks.fields.SelectedHolidaysLabel.value)).not.toBeInTheDocument();
        expect(screen.getByTestId('cancel-compare-mode-button')).toHaveTextContent(
            SitecoreDictionary.GlobalsButtonsCancel,
        );
        expect(screen.getByTestId('compare-button')).toHaveTextContent(SitecoreDictionary.GlobalsButtonsView);
    });

    describe('should render clear button when user selected at list one offer', () => {
        beforeEach(() => {
            mockLocalStore.comparisonListLength = 1;
        });

        it('should render with desktop label', () => {
            render(<CompareDeals {...mocks} />);

            expect(screen.getByTestId('clear-comparison-button')).toHaveTextContent(
                SitecoreDictionary.GlobalsLabelsClearSelection,
            );
        });

        it('should render with mobile label', () => {
            mockUseMobileViewport = true;
            render(<CompareDeals {...mocks} />);

            expect(screen.queryByTestId('clear-comparison-button')).not.toHaveTextContent(
                SitecoreDictionary.GlobalsLabelsClearSelection,
            );
        });
    });

    it('should add styles to highlight that max offer to compare are selected', () => {
        mockLocalStore.comparisonListLength = 3;
        mockLocalStore.hasMaxItemsToCompare = true;
        render(<CompareDeals {...mocks} />);

        expect(screen.getByText(`3/${mockLocalStore.compareDealsMaxItemCount}`)).toBeInTheDocument();
        expect(screen.getByTestId('count-compared-offers')).toHaveClass('full');
    });

    it('should clear compare list when user click on clear button', async () => {
        mockLocalStore.comparisonListLength = 1;
        render(<CompareDeals {...mocks} />);

        await userEvent.click(screen.getByTestId('clear-comparison-button'));

        expect(mockLocalStore.clearComparisonList).toHaveBeenCalled();
        expect(mockLocalStore.closeCompareOverlay).toHaveBeenCalled();
    });

    it('should cancel compare mode when user click on cancel button', async () => {
        render(<CompareDeals {...mocks} />);

        await userEvent.click(screen.getByTestId('cancel-compare-mode-button'));

        expect(mockLocalStore.deactivateCompareMode).toHaveBeenCalled();
    });

    describe('Compare button', () => {
        it('should disable compare button when user selected less then min offers for comparisons', () => {
            mockLocalStore.hasMinItemsToCompare = false;
            render(<CompareDeals {...mocks} />);

            expect(screen.getByTestId('compare-button')).toBeDisabled();
        });

        it('should NOT disable compare button when user selected min offers for comparisons', () => {
            mockLocalStore.hasMinItemsToCompare = true;
            render(<CompareDeals {...mocks} />);

            expect(screen.getByTestId('compare-button')).not.toBeDisabled();
        });

        it('should track compare button click with all identifiers', async () => {
            jest.mocked(getShortlistOfferIdentifier).mockImplementation(offer => offer?.accom?.id || null);
            mockLocalStore.hasMinItemsToCompare = true;
            const mockComparisonList = [
                { hotel: { name: 'hotelName1' }, accom: { id: 'accomId1' } },
                { hotel: { name: 'hotelName2' }, accom: { id: 'accomId2' } },
                { hotel: { name: 'hotelName3' }, accom: { id: 'accomId3' } },
                { hotel: { name: 'hotelName4' }, accom: { id: 'accomId4' } },
            ];
            mockLocalStore.comparisonList = mockComparisonList;
            render(<CompareDeals {...mocks} />);

            await userEvent.click(screen.getByTestId('compare-button'));

            expect(getShortlistOfferIdentifier).toHaveBeenNthCalledWith(1, mockComparisonList[0]);
            expect(getShortlistOfferIdentifier).toHaveBeenNthCalledWith(2, mockComparisonList[1]);
            expect(getShortlistOfferIdentifier).toHaveBeenNthCalledWith(3, mockComparisonList[2]);
            expect(getShortlistOfferIdentifier).toHaveBeenNthCalledWith(4, mockComparisonList[3]);
            expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                {
                    eventAction: `${mockStores.trackingStore.pageTitle} Compare|${mockStores.trackingStore.pageLang}`,
                    eventCategory: EventCategories.Shortlist,
                    eventLabel: EventLabels.Compare,
                    eventType: EventTypes.Interaction,
                },
                {
                    genericValue1: 'accomId1',
                    genericValue2: 'accomId2',
                    genericValue3: 'accomId3',
                    genericValue4: 'accomId4',
                    destinationUrl: `${mockStores.layoutStore.sitePath}/searchresults${SitePath.Compare}`,
                },
            );
        });

        it('should track compare button click and fill missing comparison identifiers with null', async () => {
            jest.mocked(getShortlistOfferIdentifier).mockImplementation(offer => offer?.accom?.id || null);
            mockLocalStore.hasMinItemsToCompare = true;
            const mockComparisonList = [
                { hotel: { name: 'hotelName1' }, accom: { id: 'accomId1' } },
                { hotel: { name: 'hotelName2' }, accom: { id: 'accomId2' } },
            ];
            mockLocalStore.comparisonList = mockComparisonList;
            render(<CompareDeals {...mocks} />);

            await userEvent.click(screen.getByTestId('compare-button'));

            expect(getShortlistOfferIdentifier).toHaveBeenNthCalledWith(1, mockComparisonList[0]);
            expect(getShortlistOfferIdentifier).toHaveBeenNthCalledWith(2, mockComparisonList[1]);
            expect(getShortlistOfferIdentifier).toHaveBeenNthCalledWith(3, undefined);
            expect(getShortlistOfferIdentifier).toHaveBeenNthCalledWith(4, undefined);
            expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                expect.any(String),
                expect.any(Object),
                {
                    genericValue1: 'accomId1',
                    genericValue2: 'accomId2',
                    genericValue3: null,
                    genericValue4: null,
                    destinationUrl: `${mockStores.layoutStore.sitePath}/searchresults${SitePath.Compare}`,
                },
            );
        });
    });

    it('should call openCompareOverlay when click on compare button', async () => {
        mockLocalStore.hasMinItemsToCompare = true;
        mockLocalStore.comparisonList = [
            { hotel: { name: 'hotelName1' }, accom: { id: 'accomId1' } },
            { hotel: { name: 'hotelName2' }, accom: { id: 'accomId2' } },
        ];
        render(<CompareDeals {...mocks} />);

        await userEvent.click(screen.getByTestId('compare-button'));

        expect(mockLocalStore.openCompareOverlay).toHaveBeenCalled();
    });

    describe('Compare overlay view', () => {
        it('should opened compare overlay view', async () => {
            mockLocalStore.isCompareOverlayOpened = true;
            const { container } = render(<CompareDeals {...mocks} />);

            expect(screen.getByTestId('comparison-table')).toBeInTheDocument();
            expect(container.querySelector('.background')).toHaveClass('coverBackground');
            expect(container.querySelector('.wrapper')).toHaveClass('coverWrapper');
            expect(screen.queryByTestId('cansel-compare-mode-button')).not.toBeInTheDocument();
            expect(screen.queryByTestId('compare-button')).not.toBeInTheDocument();
            expect(screen.getByTestId('close-compare-overlay')).toBeInTheDocument();
        });

        it('should closed compare overlay view', async () => {
            render(<CompareDeals {...mocks} />);

            expect(screen.queryByTestId('comparison-table')).not.toBeInTheDocument();
        });

        it('should prevent scroll under compare overlay when overlay opened', () => {
            mockLocalStore.isCompareOverlayOpened = true;
            render(<CompareDeals {...mocks} />);

            expect(disableScroll).toHaveBeenCalled();
        });

        it('should resent preventing scroll under compare overlay when overlay closed', () => {
            render(<CompareDeals {...mocks} />);

            expect(enableScroll).toHaveBeenCalled();
        });
    });

    it('should call deactivateCompareMode on unmount', () => {
        const { unmount } = render(<CompareDeals {...mocks} />);

        unmount();

        expect(mockLocalStore.deactivateCompareMode).toHaveBeenCalled();
    });

    it('should call deactivateCompareMode when new search are performed', () => {
        mockStores.searchStore.isSeachPerformWithNewParams = true;
        render(<CompareDeals {...mocks} />);

        expect(mockLocalStore.deactivateCompareMode).toHaveBeenCalled();
    });
});
