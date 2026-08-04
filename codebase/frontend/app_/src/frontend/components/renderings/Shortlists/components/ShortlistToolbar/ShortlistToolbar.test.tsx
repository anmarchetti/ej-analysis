import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockCompareFields } from 'frontend/__mocks__/compare';
import { mockShortlistFields } from 'frontend/__mocks__/shortlist';

import ShortlistToolbar, { IShortlistToolbarProps } from './ShortlistToolbar';

jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: ({ onClick, children, id, isDisabled, dataTid }) => (
        <button data-tid={dataTid} id={id} onClick={onClick} disabled={isDisabled}>
            {children}
        </button>
    ),
}));

let mockUseMobileViewport = false;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMobileViewport: () => mockUseMobileViewport,
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    Placeholder: ({ name, render }) => <div data-tid={name}>{render()}</div>,
}));

jest.mock('./components/EditToolbar/EditToolbar', () => () => <div data-tid='edit-toolbar' />);

jest.mock('frontend/components/renderings/CompareDeals/CompareDeals', () => () => <div data-tid='compare-deals' />);

jest.mock('frontend/components/renderings/CompareDeals/stores/createCompareLocalStore', () => ({
    ...jest.requireActual('frontend/components/renderings/CompareDeals/stores/createCompareLocalStore'),
    useCompareStore: () => mockLocalStore,
}));

const resetMocks = (): IShortlistToolbarProps => ({
    fields: mockShortlistFields,
    rendering: {},
});
const createMockedStores = () =>
    createMockStores({
        shortlistStore: {
            startEditMode: jest.fn(),
            isShortlistEditMode: false,
        },
    });
const createMockLocalStore = () => ({
    isCompareModeEnabled: false,
    activateCompareMode: jest.fn(),
    compareDealsFields: mockCompareFields,
});

let mocks;
let mockStores;
let mockLocalStore;

describe('<ShortlistToolbar />', () => {
    beforeEach(() => {
        mocks = resetMocks();
        mockStores = createMockedStores();
        mockUseMobileViewport = false;
        mockLocalStore = createMockLocalStore();
    });

    it('should render compare and edit buttons when none of the modes are selected', () => {
        const { container } = render(<ShortlistToolbar {...mocks} />);

        expect(screen.getByTestId('shortlist-edit-button')).toBeInTheDocument();
        expect(screen.getByTestId('compare-shortlist-button')).toBeInTheDocument();
        expect(container.querySelector('.actions')).toBeInTheDocument();
        expect(screen.getAllByRole('button').length).toEqual(2);

        expect(screen.queryByTestId('edit-toolbar')).not.toBeInTheDocument();
        expect(container.querySelector('.compareMode')).toBeInTheDocument();
        expect(container.querySelector('.compareModeActive')).not.toBeInTheDocument();
    });

    describe('compare shortlist button', () => {
        it('should render mobile label', () => {
            mockUseMobileViewport = true;
            render(<ShortlistToolbar {...mocks} />);
            expect(screen.getByText(mockLocalStore.compareDealsFields.CompareMobileCTA.value)).toBeInTheDocument();
        });

        it('should render desktop label', () => {
            render(<ShortlistToolbar {...mocks} />);
            expect(screen.getByText(mockLocalStore.compareDealsFields.CompareCTA.value)).toBeInTheDocument();
        });
    });

    describe('edit mode', () => {
        it('should render EditToolbar when isShortlistEditMode is true', () => {
            mockStores.shortlistStore.isShortlistEditMode = true;
            render(<ShortlistToolbar {...mocks} />);

            expect(screen.getByTestId('edit-toolbar')).toBeInTheDocument();
        });

        it('should call startEditMode()', () => {
            mockStores.shortlistStore.isShortlistEditMode = false;
            const { container } = render(<ShortlistToolbar {...mocks} />);

            fireEvent.click(container.querySelector('#shortlistEditBtn')!);

            expect(mockStores.shortlistStore.startEditMode).toHaveBeenCalled();
        });
    });

    it('should render CompareDeals when isCompareModeEnabled is true', () => {
        mockLocalStore.isCompareModeEnabled = true;
        const { container } = render(<ShortlistToolbar {...mocks} />);

        expect(screen.getByTestId('compare-deals')).toBeInTheDocument();
        expect(container.querySelector('.compareModeActive')).toBeInTheDocument();
    });
});
