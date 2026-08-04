import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';

import CheckboxDestinationRowGroup, { ICheckboxDestinationRowGroupProps } from './CheckboxDestinationRowGroup';

import styles from './CheckboxDestinationRowGroup.module.scss';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/icons/MapMarker', () => () => <div data-tid='map-marker' />);

jest.mock('frontend/components/icons/ChevronDown', () => () => <div data-tid='chevron-down' />);

const mockDestinationCheckboxGroupProps = jest.fn();
jest.mock(
    'frontend/components/common/SearchBarDropdownTo/components/DestinationCheckboxGroup/DestinationCheckboxGroup',
    () => ({
        __esModule: true,
        default: props => {
            mockDestinationCheckboxGroupProps(props);

            return <div data-tid='destination-checkbox-group' />;
        },
    }),
);

let mockUseMobileViewPort = false;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMobileViewport: () => mockUseMobileViewPort,
}));

const createProps = (): ICheckboxDestinationRowGroupProps => ({
    parent: {
        code: 'parent',
        name: 'test',
        children: [
            { code: 'child1', name: 'child1' },
            { code: 'child2', name: 'child2' },
        ],
    },
    hasTopMargin: false,
    availableCodes: ['x', 'y', 'z'],
});

let mockProps;
let mockStores;

describe('<CheckboxDestinationRowGroup />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores({
            searchStore: {
                hasPrefilledSearchPod: false,
                searchTo: {
                    isDisabledItem: jest.fn(),
                    isCheckedItem: jest.fn(),
                },
            },
            trackingStore: {
                searchPod: {
                    trackToRegionToggle: jest.fn(),
                },
            },
        });
        mockUseMobileViewPort = false;
    });

    it('should render button without btnDisabled class', () => {
        mockProps.availableCodes = null;
        render(<CheckboxDestinationRowGroup {...mockProps} />);

        expect(screen.getByRole('button')).not.toHaveClass(styles.btnDisabled);
    });

    it('should render button with btnDisabled class when parent is a disabled item', () => {
        mockStores.searchStore.searchTo.isDisabledItem = jest.fn(() => true);

        render(<CheckboxDestinationRowGroup {...mockProps} />);

        expect(screen.getByRole('button')).toHaveClass(styles.btnDisabled);
    });

    it('should render open className and DestinationCheckboxGroup component after clicking button on mobile', async () => {
        mockUseMobileViewPort = true;
        render(<CheckboxDestinationRowGroup {...mockProps} />);

        expect(mockDestinationCheckboxGroupProps).not.toHaveBeenCalled();

        await userEvent.click(screen.getByRole('button'));

        expect(screen.getByTestId('checkbox-destination-row-group-icon')).toHaveClass(styles.open);
        expect(mockDestinationCheckboxGroupProps).toHaveBeenCalledWith({
            parent: mockProps.parent,
            availableCodes: mockProps.availableCodes,
        });
    });

    it('should render DestinationCheckboxGroup component after clicking button on desktop', async () => {
        render(<CheckboxDestinationRowGroup {...mockProps} />);

        expect(mockDestinationCheckboxGroupProps).not.toHaveBeenCalled();

        await userEvent.click(screen.getByRole('button'));

        expect(mockDestinationCheckboxGroupProps).toHaveBeenCalledWith({
            parent: mockProps.parent,
            availableCodes: mockProps.availableCodes,
        });
    });

    it('should render IconMapMarker', () => {
        render(<CheckboxDestinationRowGroup {...mockProps} />);

        expect(screen.getByTestId('map-marker')).toBeInTheDocument();
    });

    it('should render parent name', () => {
        render(<CheckboxDestinationRowGroup {...mockProps} />);

        expect(screen.getByText('test')).toBeInTheDocument();
    });

    it('should NOT render IconChevronDown on desktop', () => {
        render(<CheckboxDestinationRowGroup {...mockProps} />);

        expect(screen.queryByTestId('chevron-down')).not.toBeInTheDocument();
    });

    it('should render IconChevronDown on mobile', () => {
        mockUseMobileViewPort = true;
        const { getByTestId } = render(<CheckboxDestinationRowGroup {...mockProps} />);

        expect(getByTestId('chevron-down')).toBeInTheDocument();
    });

    describe('openCheckboxIfNeeded', () => {
        it('should isOpened be false when parent is disabled', () => {
            mockStores.searchStore.searchTo.isDisabledItem = jest.fn(() => true);

            render(<CheckboxDestinationRowGroup {...mockProps} />);

            expect(screen.queryByTestId('destination-checkbox-group')).not.toBeInTheDocument();
        });

        it('should isOpened be true when parent is checked', () => {
            mockStores.searchStore.searchTo.isDisabledItem = jest.fn(() => false);
            mockStores.searchStore.searchTo.isCheckedItem = jest.fn(() => true);

            render(<CheckboxDestinationRowGroup {...mockProps} />);

            expect(screen.getByTestId('destination-checkbox-group')).toBeInTheDocument();
        });

        it('should isOpened be true when parent is not checked but any of children is checked', () => {
            mockStores.searchStore.searchTo.isDisabledItem = jest.fn(() => false);
            mockStores.searchStore.searchTo.isCheckedItem
                .mockImplementationOnce(() => false)
                .mockImplementationOnce(() => true);

            render(<CheckboxDestinationRowGroup {...mockProps} />);

            expect(screen.getByTestId('destination-checkbox-group')).toBeInTheDocument();
        });
    });

    describe('Tracking', () => {
        it('should call trackToRegionToggle when button is clicked', async () => {
            render(<CheckboxDestinationRowGroup {...mockProps} />);

            await userEvent.click(screen.getByRole('button'));

            expect(mockStores.trackingStore.searchPod.trackToRegionToggle).toHaveBeenCalledTimes(1);
            expect(mockStores.trackingStore.searchPod.trackToRegionToggle).toHaveBeenCalledWith(mockProps.parent);
        });

        it('should call trackToRegionToggle on each toggle (open and close)', async () => {
            render(<CheckboxDestinationRowGroup {...mockProps} />);

            await userEvent.click(screen.getByRole('button'));
            expect(mockStores.trackingStore.searchPod.trackToRegionToggle).toHaveBeenCalledTimes(1);

            await userEvent.click(screen.getByRole('button'));
            expect(mockStores.trackingStore.searchPod.trackToRegionToggle).toHaveBeenCalledTimes(2);
        });

        it('should call trackToRegionToggle with parent details', async () => {
            mockProps.parent = {
                code: 'ESP',
                name: 'Spain',
                children: [
                    { code: 'BCN', name: 'Barcelona' },
                    { code: 'MAD', name: 'Madrid' },
                ],
            };

            render(<CheckboxDestinationRowGroup {...mockProps} />);

            await userEvent.click(screen.getByRole('button'));

            expect(mockStores.trackingStore.searchPod.trackToRegionToggle).toHaveBeenCalledWith({
                code: 'ESP',
                name: 'Spain',
                children: [
                    { code: 'BCN', name: 'Barcelona' },
                    { code: 'MAD', name: 'Madrid' },
                ],
            });
        });

        it('should call trackToRegionToggle even when parent is disabled', async () => {
            mockStores.searchStore.searchTo.isDisabledItem = jest.fn(() => true);

            render(<CheckboxDestinationRowGroup {...mockProps} />);

            await userEvent.click(screen.getByRole('button'));

            expect(mockStores.trackingStore.searchPod.trackToRegionToggle).toHaveBeenCalledTimes(1);
        });

        it('should have trackToRegionToggle available in the component store hooks', () => {
            render(<CheckboxDestinationRowGroup {...mockProps} />);

            expect(mockStores.trackingStore.searchPod.trackToRegionToggle).toBeDefined();
            expect(typeof mockStores.trackingStore.searchPod.trackToRegionToggle).toBe('function');
        });

        it('should track on mobile when toggling group', async () => {
            mockUseMobileViewPort = true;
            render(<CheckboxDestinationRowGroup {...mockProps} />);

            await userEvent.click(screen.getByRole('button'));

            expect(mockStores.trackingStore.searchPod.trackToRegionToggle).toHaveBeenCalledWith(mockProps.parent);
        });
    });
});
