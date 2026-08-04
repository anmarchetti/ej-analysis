import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockReplaceToken } from 'frontend/__mocks__/utils/tokenizer';
import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import { SearchPodValidationFields } from 'models/data/tracking/SearchPodEvent';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { RoomAllocation } from 'models/RoomAllocation';

import ChildrenAgesSelector, { IChildrenAgesSelectorProps } from './ChildrenAgesSelector';

jest.mock('frontend/utils/tokenizer', () => ({
    __esModule: true,
    Tokenizer: {
        replaceToken: mockReplaceToken,
    },
}));

const mockErrorMessageProps = jest.fn();
jest.mock('frontend/components/common/ErrorMessage', () => props => {
    mockErrorMessageProps(props);

    return <div data-tid='error-message' />;
});

const mockSelectComponent = jest.fn();
jest.mock('react-select', () => props => {
    mockSelectComponent(props);

    return (
        <div
            className='select'
            data-tid={`select-${props.value.value}`}
            onClick={() => props.onChange({ label: 15, value: 15 })}
        />
    );
});

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/hooks/useMediaQuery');
jest.mocked(useMobileViewport).mockReturnValue(false);

jest.mock('frontend/components/common/RichTextDictionary', () => ({
    __esModule: true,
    default: ({ dictionaryKey }) => <div data-tid='rich-text-dictionary'>{dictionaryKey}</div>,
}));

const resetMocks = (): IChildrenAgesSelectorProps => {
    const room = new RoomAllocation();
    room.addChild();
    room.addChild();
    room.addChild();

    room.children[0].age = 5;
    room.children[1].age = 4;
    room.children[2].age = 10;

    return {
        isChildrenAgeValid: true,
        validateChildrenAge: jest.fn(() => true),
        childrenGuests: room.children,
        isGroupBooking: false,
        hideError: false,
        isSearchBar: false,
    };
};

let mockProps;
let mockStores;

describe('ChildrenAgesSelector', () => {
    beforeEach(() => {
        mockProps = resetMocks();
        mockStores = createMockStores({
            trackingStore: {
                trackValidation: jest.fn(),
            },
        });
    });

    it('should NOT render component when no children in the room', () => {
        mockProps.childrenGuests = [];
        const { container } = render(<ChildrenAgesSelector {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    describe('title', () => {
        it('should render singular title when there is one child in the room', () => {
            const room = new RoomAllocation();
            room.addChild();
            room.children[0].age = 5;
            mockProps.childrenGuests = [room];

            render(<ChildrenAgesSelector {...mockProps} />);

            expect(screen.getByText(SitecoreDictionary.RoomAllocationLabelsKidAge)).toBeInTheDocument();
        });

        it('should render plural title when there are few children in the room', () => {
            render(<ChildrenAgesSelector {...mockProps} />);

            expect(screen.getByText(SitecoreDictionary.RoomAllocationLabelsKidsAge)).toBeInTheDocument();
        });

        it('should NOT render title on group booking', () => {
            mockProps.isGroupBooking = true;
            render(<ChildrenAgesSelector {...mockProps} />);

            expect(screen.queryByTestId('rich-text-dictionary')).not.toBeInTheDocument();
        });
    });

    it('should render selector for each children in room', () => {
        render(<ChildrenAgesSelector {...mockProps} />);

        expect(screen.getByTestId('children-age-select-0')).toBeInTheDocument();
        expect(screen.getByTestId('children-age-select-1')).toBeInTheDocument();
        expect(screen.getByTestId('children-age-select-2')).toBeInTheDocument();

        expect(mockSelectComponent).toHaveBeenCalledTimes(3);
        expect(mockSelectComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                // common props for each select
                className: 'custom-select select',
                classNamePrefix: 'custom-select',
                options: [
                    { label: 2, value: 2 },
                    { label: 3, value: 3 },
                    { label: 4, value: 4 },
                    { label: 5, value: 5 },
                    { label: 6, value: 6 },
                    { label: 7, value: 7 },
                    { label: 8, value: 8 },
                    { label: 9, value: 9 },
                    { label: 10, value: 10 },
                    { label: 11, value: 11 },
                    { label: 12, value: 12 },
                    { label: 13, value: 13 },
                    { label: 14, value: 14 },
                    { label: 15, value: 15 },
                ],
                isSearchable: false,
                blurInputOnSelect: true,
                menuPlacement: 'top',
                minMenuHeight: 150,
                maxMenuHeight: 150,
                // specific props for each select
                value: { value: 5, label: 5 },
                label: `${SitecoreDictionary.RoomAllocationLabelsChildNumber} 1`,
                placeholder: `${SitecoreDictionary.RoomAllocationLabelsChildNumber} 1`,
                defaultValue: { value: 5, label: 5 },
            }),
        );
        expect(mockSelectComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                value: { value: 4, label: 4 },
                label: `${SitecoreDictionary.RoomAllocationLabelsChildNumber} 2`,
                placeholder: `${SitecoreDictionary.RoomAllocationLabelsChildNumber} 2`,
                defaultValue: { value: 4, label: 4 },
            }),
        );
        expect(mockSelectComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                value: { value: 10, label: 10 },
                label: `${SitecoreDictionary.RoomAllocationLabelsChildNumber} 3`,
                placeholder: `${SitecoreDictionary.RoomAllocationLabelsChildNumber} 3`,
                defaultValue: { value: 10, label: 10 },
            }),
        );
    });

    it('should render error message, call trackValidation if isSearchbar is true and apply error styles to invalid children age selection while keeping valid ages unaffected', () => {
        mockProps.childrenGuests[0].age = 0;
        mockProps.isChildrenAgeValid = false;
        mockProps.isSearchBar = true;
        render(<ChildrenAgesSelector {...mockProps} />);

        expect(mockErrorMessageProps).toHaveBeenCalledWith(
            expect.objectContaining({
                message: SitecoreDictionary.RoomAllocationErrorsChildAgeIsUnset,
                IsDesc: true,
            }),
        );
        expect(mockSelectComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                className: 'custom-select select custom-select--error',
                value: { value: 0, label: '-' },
            }),
        );
        expect(mockSelectComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                className: 'custom-select select',
                value: { value: 4, label: 4 },
            }),
        );
        expect(mockSelectComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                className: 'custom-select select',
                value: { value: 10, label: 10 },
            }),
        );

        expect(mockStores.trackingStore.trackValidation).toHaveBeenCalledWith(
            SearchPodValidationFields.ChildAge,
            SitecoreDictionary.RoomAllocationErrorsChildAgeIsUnset,
        );
    });

    it('should render error message, but do not call trackValidation if isSearchbar is false', () => {
        mockProps.childrenGuests[0].age = 0;
        mockProps.isChildrenAgeValid = false;
        mockProps.isSearchBar = false;
        render(<ChildrenAgesSelector {...mockProps} />);

        expect(mockErrorMessageProps).toHaveBeenCalledWith(
            expect.objectContaining({
                message: SitecoreDictionary.RoomAllocationErrorsChildAgeIsUnset,
                IsDesc: true,
            }),
        );

        expect(mockStores.trackingStore.trackValidation).not.toHaveBeenCalledWith();
    });

    it('should NOT render error when children age is valid', () => {
        render(<ChildrenAgesSelector {...mockProps} />);

        expect(mockErrorMessageProps).not.toHaveBeenCalled();
    });

    it('should NOT render error when hideError is true even if isChildrenAgeValid is false', () => {
        mockProps.childrenGuests[0].age = 0;
        mockProps.isChildrenAgeValid = false;
        mockProps.hideError = true;
        render(<ChildrenAgesSelector {...mockProps} />);

        expect(mockErrorMessageProps).not.toHaveBeenCalled();
    });

    it('should still apply error class to selects when hideError is true and isChildrenAgeValid is false', () => {
        mockProps.childrenGuests[0].age = 0;
        mockProps.isChildrenAgeValid = false;
        mockProps.hideError = true;
        render(<ChildrenAgesSelector {...mockProps} />);

        expect(mockSelectComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                className: 'custom-select select custom-select--error',
                value: { value: 0, label: '-' },
            }),
        );
    });

    it('should update selects when child removed from childrenGuests', () => {
        const { rerender, container } = render(<ChildrenAgesSelector {...mockProps} />);

        expect(container.querySelectorAll('.select')!.length).toBe(3);

        mockProps.childrenGuests = mockProps.childrenGuests.slice(0, 2);

        rerender(<ChildrenAgesSelector {...mockProps} />);

        expect(container.querySelectorAll('.select')!.length).toBe(2);
    });

    it('should call onChangeField when selected age is changed', () => {
        mockProps.childrenGuests[0].onChangeField = jest.fn();
        render(<ChildrenAgesSelector {...mockProps} />);

        fireEvent.click(screen.getByTestId('select-5'));

        expect(mockProps.childrenGuests[0].onChangeField).toHaveBeenCalledWith('age', 15);
        expect(mockProps.validateChildrenAge).not.toHaveBeenCalled();
    });

    it('should call validateChildrenAge when selected age is not valid', () => {
        mockProps.childrenGuests[0].onChangeField = jest.fn();
        mockProps.isChildrenAgeValid = false;
        render(<ChildrenAgesSelector {...mockProps} />);

        fireEvent.click(screen.getByTestId('select-5'));

        expect(mockProps.childrenGuests[0].onChangeField).toHaveBeenCalledWith('age', 15);
        expect(mockProps.validateChildrenAge).toHaveBeenCalled();
    });

    it('should update selects when new child added to childrenGuests', () => {
        const room = new RoomAllocation();
        room.addChild();
        room.children[0].age = 15;
        mockProps.childrenGuests = room.children;

        const { rerender, container } = render(<ChildrenAgesSelector {...mockProps} />);

        expect(container.querySelectorAll('.select')!.length).toBe(1);

        room.addChild();
        room.children[1].age = 16;
        mockProps.childrenGuests = room.children;

        rerender(<ChildrenAgesSelector {...mockProps} />);

        expect(container.querySelectorAll('.select')!.length).toBe(2);
    });

    it('should add groupBookingWrapper class', () => {
        mockProps.isGroupBooking = true;
        render(<ChildrenAgesSelector {...mockProps} />);

        expect(screen.getByTestId('children-age-selector')).toHaveClass('groupBookingWrapper');
    });
});
