import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { DATE_PICKER_CLASS } from 'frontend/components/renderings/SearchPod/components/SearchBar/components/SearchBarWhenContent/SearchPodCalendar/constants';

import YearDropdown from './YearDropdown';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockReactSelectProps = jest.fn();
jest.mock('react-select', () => ({
    __esModule: true,
    default: props => {
        mockReactSelectProps(props);

        return (
            <div data-tid='react-select'>
                <div data-tid='react-select-2024-option' onClick={() => props.onChange({ value: 2024, label: 2024 })} />
                <div data-tid='react-select-open' onClick={props.onMenuOpen} />
                <div data-tid='react-select-close' onClick={props.onMenuClose} />
            </div>
        );
    },
}));

let mockUseMobileViewport = true;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    useMobileViewport: () => mockUseMobileViewport,
}));

const createMockProps = () => ({
    minDate: new Date(2023, 0, 1),
});

let mockStores;
let mockProps;

describe('YearDropdown', () => {
    beforeAll(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date(2025, 6, 23));
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    beforeEach(() => {
        mockStores = {
            searchStore: {
                searchWhen: {
                    lastAvailableDate: new Date(2025, 0, 1),
                    from: new Date(2024, 0, 1),
                },
            },
        };
        mockUseMobileViewport = true;
        mockProps = createMockProps();
    });

    it('should render with calculated options based on min date and last available date', () => {
        render(<YearDropdown {...mockProps} />);

        expect(mockReactSelectProps).toHaveBeenCalledWith(
            expect.objectContaining({
                options: [
                    { value: 2023, label: 2023 },
                    { value: 2024, label: 2024 },
                    { value: 2025, label: 2025 },
                ],
            }),
        );
    });

    it('should render with calculated options based on min date when no availability data', () => {
        mockStores.searchStore.searchWhen.lastAvailableDate = null;
        render(<YearDropdown {...mockProps} />);

        expect(mockReactSelectProps).toHaveBeenCalledWith(
            expect.objectContaining({
                options: [{ value: 2023, label: 2023 }],
            }),
        );
    });

    it('should render with value equal min date', () => {
        mockStores.searchStore.searchWhen.from = null;
        render(<YearDropdown {...mockProps} />);
        expect(mockReactSelectProps).toHaveBeenCalledWith(
            expect.objectContaining({
                value: { value: 2023, label: 2023 },
            }),
        );
    });

    it('should select year by click', () => {
        const scrollIntoViewMock = jest.fn();
        document.querySelectorAll = jest.fn().mockReturnValue([
            {
                querySelector: () => ({ textContent: 'January 2024' }),
                scrollIntoView: scrollIntoViewMock,
            },
        ]);
        mockStores.searchStore.searchWhen.from = null;

        render(<YearDropdown {...mockProps} />);

        fireEvent.click(screen.getByTestId('react-select-2024-option'));

        expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    });

    it('should call setSelectedYear with visible year', () => {
        const mockMonthElement = {
            getBoundingClientRect: () => ({ top: 100 }),
            textContent: 'January 2024',
        };
        (global.window as any).innerHeight = 500;

        document.querySelectorAll = jest.fn().mockReturnValue([mockMonthElement]);

        const datePickerElement = document.createElement('div');
        datePickerElement.className = DATE_PICKER_CLASS;
        document.body.appendChild(datePickerElement);

        render(<YearDropdown {...mockProps} />);

        fireEvent.scroll(datePickerElement);

        jest.runAllTimers();

        expect(mockReactSelectProps).toHaveBeenCalledWith(
            expect.objectContaining({
                value: { value: 2024, label: 2024 },
            }),
        );
    });

    it('should NOT render component on desktop', () => {
        mockUseMobileViewport = false;
        const { container } = render(<YearDropdown {...mockProps} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('should close dropdown on scroll', () => {
        const datePickerElement = document.createElement('div');
        datePickerElement.className = DATE_PICKER_CLASS;
        document.body.appendChild(datePickerElement);

        render(<YearDropdown {...mockProps} />);

        fireEvent.click(screen.getByTestId('react-select-open'));

        expect(mockReactSelectProps).toHaveBeenLastCalledWith(
            expect.objectContaining({
                menuIsOpen: true,
            }),
        );

        datePickerElement.dispatchEvent(new Event('scroll'));

        jest.runAllTimers();

        expect(mockReactSelectProps).toHaveBeenLastCalledWith(
            expect.objectContaining({
                menuIsOpen: false,
            }),
        );
    });
});
