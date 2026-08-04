import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import {
    mockHoldLuggagePopupFields,
    mockHoldLugggageLists,
} from 'frontend/components/renderings/HoldLuggagePopup/__mocks__/mockHoldLuggagePopupFields';

import HoldLuggageSection, {
    IHoldLuggageSectionProps,
    ITEMS_TO_SHOW_LUGGAGE,
    ITEMS_TO_SHOW_SPORT,
} from './HoldLuggageSection';

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const createStores = () => ({
    bookingStore: {
        extraLuggage: {
            luggagePrices: {
                LUG: 20,
                LUS: 20,
                BIKE: 20,
                CANO: 20,
                GBAG: 20,
                SNBD: 20,
            },
        },
        holdLuggage: {
            isHoldLuggageInitialized: true,
        },
    },
});

const createProps = (): IHoldLuggageSectionProps => ({
    Title: mockHoldLuggagePopupFields.AdditionalLuggageTitle,
    Subtitle: mockHoldLugggageLists.SportsEquipmentSubtitle,
    LuggageItems: mockHoldLugggageLists.HoldLuggageItems,
    PriceLabel: mockHoldLuggagePopupFields.PriceLabel,
    showMore: mockHoldLuggagePopupFields.ShowMoreLuggage.value,
    hideLabel: mockHoldLuggagePopupFields.HideAdditionalLuggage.value,
    isSport: false,
});

const mockOptionItemHoldLuggagePopup = jest.fn();
jest.mock(
    'frontend/components/renderings/HoldLuggagePopup/components/OptionItemHoldLuggagePopup/OptionItemHoldLuggagePopup',
    () => ({
        __esModule: true,
        default: props => {
            mockOptionItemHoldLuggagePopup(props);

            return <div data-tid='option-item'>{props.children}</div>;
        },
    }),
);

const mockControlsHoldLuggagePopup = jest.fn();
jest.mock(
    'frontend/components/renderings/HoldLuggagePopup/components/ControlsHoldLuggagePopup/ControlsHoldLuggagePopup',
    () => ({
        __esModule: true,
        default: props => {
            mockControlsHoldLuggagePopup(props);

            return <div data-tid='control' />;
        },
    }),
);

const mockRichTextWithLinksProps = jest.fn();
jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: props => {
        mockRichTextWithLinksProps(props);

        return <div data-tid='sports-equipment-subtitle'>{props.field.value}</div>;
    },
}));

const mockShowMoreButton = jest.fn();
jest.mock('frontend/components/common/ShowMoreButton', () => ({
    __esModule: true,
    default: props => {
        mockShowMoreButton(props);

        return <div data-tid='show-more-button' onClick={props.onClick} />;
    },
}));

describe('HoldLuggageSection', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render HoldLuggageSection', () => {
        render(<HoldLuggageSection {...mockProps} />);

        expect(screen.queryByTestId('hold-luggage-section')).toHaveClass('holdLuggageSection');
        expect(screen.getByTestId('hl-section-title')).toHaveTextContent('AdditionalLuggageTitle');

        expect(screen.queryAllByTestId('option-item')).toHaveLength(2);
        expect(mockOptionItemHoldLuggagePopup).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({
                name: mockProps.LuggageItems[0].fields.Name.value,
                icon: mockProps.LuggageItems[0].fields.Icon.value.src,
                shouldRender: true,
            }),
        );
        expect(mockOptionItemHoldLuggagePopup).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({
                name: mockProps.LuggageItems[1].fields.Name.value,
                icon: mockProps.LuggageItems[1].fields.Icon.value.src,
                shouldRender: true,
            }),
        );
        expect(screen.queryByTestId('show-more-button')).not.toBeInTheDocument();

        expect(screen.queryAllByTestId('control')).toHaveLength(2);
        expect(mockControlsHoldLuggagePopup).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({
                code: mockProps.LuggageItems[0].fields.Code.value,
                isSport: false,
                priceLabel: mockProps.PriceLabel.value,
            }),
        );
        expect(mockControlsHoldLuggagePopup).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({
                code: mockProps.LuggageItems[1].fields.Code.value,
                isSport: false,
                priceLabel: mockProps.PriceLabel.value,
            }),
        );
        expect(screen.queryByTestId('show-more-button')).not.toBeInTheDocument();
        expect(screen.queryByTestId('sports-equipment-subtitle')).toHaveTextContent('SportsEquipmentSubtitle');
    });

    it('should NOT render component when no LuggageItems', () => {
        mockProps.LuggageItems = [];

        const { container } = render(<HoldLuggageSection {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render component when there is no price for any item', () => {
        mockStores.bookingStore.extraLuggage.luggagePrices = {
            LUG: 0,
            LUS: 0,
            BIKE: 0,
            CANO: 0,
            GBAG: 0,
            SNBD: 0,
        };
        mockProps.isSport = true;
        mockProps.LuggageItems = mockHoldLugggageLists.SportsEquipmentItems;

        const { container } = render(<HoldLuggageSection {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it("should NOT render component when luggage didn't initialized", () => {
        mockStores.bookingStore.holdLuggage.isHoldLuggageInitialized = false;

        const { container } = render(<HoldLuggageSection {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    describe('multiple items', () => {
        beforeEach(() => {
            mockProps.LuggageItems = mockHoldLugggageLists.SportsEquipmentItems;
        });

        it('should render ITEMS_TO_SHOW_LUGGAGE count when items count more than default', () => {
            render(<HoldLuggageSection {...mockProps} />);

            expect(screen.queryAllByTestId('option-item')).toHaveLength(ITEMS_TO_SHOW_LUGGAGE);
            expect(mockShowMoreButton).toHaveBeenCalledWith(
                expect.objectContaining({
                    isChevronUp: false,
                    title: mockProps.showMore,
                }),
            );
        });

        it('should render ITEMS_TO_SHOW_SPORT count when items count more than default and isSport is true', () => {
            mockProps.isSport = true;
            render(<HoldLuggageSection {...mockProps} />);

            expect(screen.queryAllByTestId('option-item')).toHaveLength(ITEMS_TO_SHOW_SPORT);
            expect(mockShowMoreButton).toHaveBeenCalledWith(
                expect.objectContaining({
                    isChevronUp: false,
                    title: mockProps.showMore,
                }),
            );
        });

        it('should show all items on ShowMoreButton click', () => {
            render(<HoldLuggageSection {...mockProps} />);

            expect(screen.queryAllByTestId('option-item')).toHaveLength(ITEMS_TO_SHOW_LUGGAGE);

            const button = screen.getByTestId('show-more-button');

            expect(mockShowMoreButton).toHaveBeenCalledWith(
                expect.objectContaining({
                    isChevronUp: false,
                    title: mockProps.showMore,
                }),
            );

            fireEvent.click(button);

            expect(screen.queryAllByTestId('option-item')).toHaveLength(mockProps.LuggageItems.length);
            expect(mockShowMoreButton).toHaveBeenCalledWith(
                expect.objectContaining({
                    isChevronUp: true,
                    title: mockProps.hideLabel,
                }),
            );
        });

        it('should hide additional items on second ShowMoreButton click', () => {
            mockProps.isSport = true;

            render(<HoldLuggageSection {...mockProps} />);

            expect(screen.queryAllByTestId('option-item')).toHaveLength(ITEMS_TO_SHOW_SPORT);

            const button = screen.getByTestId('show-more-button');

            expect(mockShowMoreButton).toHaveBeenCalledWith(
                expect.objectContaining({
                    isChevronUp: false,
                    title: mockProps.showMore,
                }),
            );

            fireEvent.click(button);

            expect(screen.queryAllByTestId('option-item')).toHaveLength(mockProps.LuggageItems.length);
            expect(mockShowMoreButton).toHaveBeenCalledWith(
                expect.objectContaining({
                    isChevronUp: true,
                    title: mockProps.hideLabel,
                }),
            );

            fireEvent.click(button);

            expect(screen.queryAllByTestId('option-item')).toHaveLength(ITEMS_TO_SHOW_SPORT);
            expect(mockShowMoreButton).toHaveBeenCalledWith(
                expect.objectContaining({
                    isChevronUp: false,
                    title: mockProps.showMore,
                }),
            );
        });
    });
});
