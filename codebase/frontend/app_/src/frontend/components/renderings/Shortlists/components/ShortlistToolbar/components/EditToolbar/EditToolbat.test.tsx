import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { IOffer } from 'models/data/IOffer';

import EditToolbar, { IEditToolbarProps } from './EditToolbar';

jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: ({ onClick, children, id, disabled, dataTid }) => (
        <button data-tid={dataTid} id={id} onClick={onClick} disabled={disabled}>
            {children}
        </button>
    ),
}));

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

const resetMocks = (): IEditToolbarProps => ({
    SelectedHolidaysPluralLabel: mockSitecoreField('HOLIDAYS SELECTED'),
    SelectedHolidaysSingularLabel: mockSitecoreField('HOLIDAY SELECTED'),
});
const createMockedStores = () =>
    createMockStores({
        shortlistStore: {
            toggleRemovePopup: jest.fn(),
            cancelEditMode: jest.fn(),
            selectedOffers: [] as Nullable<IOffer[]>,
        },
    });

let mocks;
let mockStores;

const removeButtonId = '#shortlistRemoveBtn';
const cancelBtnId = '#shortlistCancelBtn';

describe('EditToolbar', () => {
    beforeEach(() => {
        mocks = resetMocks();
        mockStores = createMockedStores();
        mockUseMobileViewport = false;
    });

    describe('Edit Mode on', () => {
        it('should render buttons and status bar if edit mode is on', () => {
            mockStores.shortlistStore.isShortlistEditMode = true;
            const { container } = render(<EditToolbar {...mocks} />);

            expect(container.querySelector('.actions')).toBeInTheDocument();
            expect(screen.getAllByRole('button').length).toEqual(2);
            expect(container.querySelector(removeButtonId)).toBeInTheDocument();
            expect(container.querySelector(cancelBtnId)).toBeInTheDocument();
            expect(container.querySelector('.status')).toBeInTheDocument();
        });
    });

    describe('Holidays are (not) selected', () => {
        it('should render disabled remove button and not render icon check if there are not selected offers', () => {
            mockStores.shortlistStore.isShortlistEditMode = true;
            mockStores.shortlistStore.selectedOffers = [];
            const { container } = render(<EditToolbar {...mocks} />);

            expect(container.querySelector('.icon')).not.toBeInTheDocument();
            expect(container.querySelector(removeButtonId)).toHaveAttribute('disabled');
        });

        it('should render active remove button and icon check if there are selected offers', () => {
            mockStores.shortlistStore.isShortlistEditMode = true;
            mockStores.shortlistStore.selectedOffers = [{}] as IOffer[];
            const { container } = render(<EditToolbar {...mocks} />);

            expect(container.querySelector('.icon')).toBeInTheDocument();
            expect(container.querySelector(removeButtonId)).not.toHaveAttribute('disabled');
        });

        it('should render specific label for one selected holiday', () => {
            mockStores.shortlistStore.isShortlistEditMode = true;
            mockStores.shortlistStore.selectedOffers = [{}] as IOffer[];

            render(<EditToolbar {...mocks} />);

            expect(screen.getByText('HOLIDAY SELECTED')).toBeInTheDocument();
        });

        it('should render specific label for several selected holidays', () => {
            mockStores.shortlistStore.isShortlistEditMode = true;
            mockStores.shortlistStore.selectedOffers = [{}, {}] as IOffer[];
            render(<EditToolbar {...mocks} />);

            expect(screen.getByText('HOLIDAYS SELECTED')).toBeInTheDocument();
        });

        it('should NOT render count of selected holidays label on XS screens', () => {
            mockUseMobileViewport = true;
            mockStores.shortlistStore.isShortlistEditMode = true;
            mockStores.shortlistStore.selectedOffers = [{}, {}] as IOffer[];
            render(<EditToolbar {...mocks} />);

            expect(screen.queryByText('HOLIDAYS SELECTED')).not.toBeInTheDocument();
            expect(screen.queryByText('HOLIDAY SELECTED')).not.toBeInTheDocument();
        });
    });

    describe('Events', () => {
        it('should call cancelEditMode()', () => {
            mockStores.shortlistStore.isShortlistEditMode = true;
            const { container } = render(<EditToolbar {...mocks} />);

            fireEvent.click(container.querySelector(cancelBtnId)!);

            expect(mockStores.shortlistStore.cancelEditMode).toHaveBeenCalled();
        });

        it('should call onRemoveClick()', () => {
            mockStores.shortlistStore.isShortlistEditMode = true;
            mockStores.shortlistStore.selectedOffers = [{}] as IOffer[];
            const { container } = render(<EditToolbar {...mocks} />);

            fireEvent.click(container.querySelector(removeButtonId)!);

            expect(mockStores.shortlistStore.toggleRemovePopup).toHaveBeenCalledWith(true);
        });

        it('should not call onRemoveClick() if remove button is disabled', () => {
            mockStores.shortlistStore.isShortlistEditMode = true;
            mockStores.shortlistStore.selectedOffers = null;
            const { container } = render(<EditToolbar {...mocks} />);

            fireEvent.click(container.querySelector(removeButtonId)!);

            expect(mockStores.shortlistStore.toggleRemovePopup).not.toHaveBeenCalled();
        });
    });
});
