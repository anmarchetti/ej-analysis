import React from 'react';
import { render, screen } from '@testing-library/react';

import * as utils from 'frontend/utils/luggage.utils';
import {
    mockHoldLuggagePopupFields,
    mockHoldLugggageLists,
} from 'frontend/components/renderings/HoldLuggagePopup/__mocks__/mockHoldLuggagePopupFields';

import HoldLuggageOptions, { IHoldLuggageOptionsProps } from './HoldLuggageOptions';

const createProps = (): IHoldLuggageOptionsProps => ({
    rendering: {},
    params: {},
    fields: mockHoldLugggageLists,
    additionalFields: mockHoldLuggagePopupFields,
});

const createStores = () => ({
    bookingStore: {
        travelDate: new Date('2024-09-30T14:50:00+00:00'),
        extraLuggage: {
            isHoldLuggageAvailable: true,
            isSportsEquipmentAvailable: true,
        },
    },
});

let mockProps;
let mockStores;

jest.mock('frontend/components/common/JSSImage', () => ({
    __esModule: true,
    default: ({ field, className }) => (
        <div data-tid='image' className={className}>
            {field.value.src}
        </div>
    ),
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockHoldLuggageSection = jest.fn();
jest.mock('frontend/components/renderings/HoldLuggageOptions/components/HoldLuggageSection/HoldLuggageSection', () => ({
    __esModule: true,
    default: props => {
        mockHoldLuggageSection(props);

        return (
            <div data-tid='hold-luggage-section' className={props.isSport ? 'sportSection' : 'holdLuggageSection'}>
                {props.children}
            </div>
        );
    },
}));

jest.mock('frontend/utils/luggage.utils', () => ({
    getIsSportEquipmentAvailableSeason: jest.fn().mockReturnValue(true),
}));

describe('HoldLuggageOptions', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render nothing when no fields', () => {
        mockProps.fields = undefined;

        const { container } = render(<HoldLuggageOptions {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render HoldLuggageOptions', () => {
        render(<HoldLuggageOptions {...mockProps} />);

        const {
            AdditionalLuggageTitle,
            PriceLabel,
            ShowMoreLuggage,
            HideAdditionalLuggage,
            SportsEquipmentTitle,
            ShowMoreEquipment,
            HideAdditionalEquipment,
        } = mockProps.additionalFields;

        expect(screen.queryAllByTestId('hold-luggage-section')).toHaveLength(2);

        expect(mockHoldLuggageSection).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({
                Title: AdditionalLuggageTitle,
                LuggageItems: mockProps.fields.HoldLuggageItems,
                PriceLabel: PriceLabel,
                showMore: ShowMoreLuggage.value,
                hideLabel: HideAdditionalLuggage.value,
            }),
        );
        expect(mockHoldLuggageSection).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({
                Title: SportsEquipmentTitle,
                Subtitle: mockHoldLugggageLists.SportsEquipmentSubtitle,
                LuggageItems: mockProps.fields.SportsEquipmentItems,
                PriceLabel: PriceLabel,
                showMore: ShowMoreEquipment.value,
                hideLabel: HideAdditionalEquipment.value,
                isSport: true,
            }),
        );
    });

    describe('HoldLuggageSection visibility ', () => {
        it('should render two HoldLuggageSections for enabled holdLuggage and sportEquipment', () => {
            mockStores.bookingStore.extraLuggage.isSportsEquipmentAvailable = true;
            mockStores.bookingStore.extraLuggage.isHoldLuggageAvailable = true;
            const {
                AdditionalLuggageTitle,
                PriceLabel,
                ShowMoreLuggage,
                HideAdditionalLuggage,
                SportsEquipmentTitle,
                ShowMoreEquipment,
                HideAdditionalEquipment,
            } = mockProps.additionalFields;

            render(<HoldLuggageOptions {...mockProps} />);

            expect(mockHoldLuggageSection).toHaveBeenNthCalledWith(
                1,
                expect.objectContaining({
                    Title: AdditionalLuggageTitle,
                    LuggageItems: mockProps.fields.HoldLuggageItems,
                    PriceLabel: PriceLabel,
                    showMore: ShowMoreLuggage.value,
                    hideLabel: HideAdditionalLuggage.value,
                }),
            );
            expect(mockHoldLuggageSection).toHaveBeenNthCalledWith(
                2,
                expect.objectContaining({
                    Title: SportsEquipmentTitle,
                    Subtitle: mockHoldLugggageLists.SportsEquipmentSubtitle,
                    LuggageItems: mockProps.fields.SportsEquipmentItems,
                    PriceLabel: PriceLabel,
                    showMore: ShowMoreEquipment.value,
                    hideLabel: HideAdditionalEquipment.value,
                    isSport: true,
                }),
            );

            expect(screen.getAllByTestId('hold-luggage-section')).toHaveLength(2);
            expect(screen.getAllByTestId('hold-luggage-section')[0]).toHaveClass('holdLuggageSection');
            expect(screen.getAllByTestId('hold-luggage-section')[1]).toHaveClass('sportSection');
        });

        it('should render HoldLuggageSection for enabled holdLuggage and disabled sportEquipment', () => {
            mockStores.bookingStore.extraLuggage.isSportsEquipmentAvailable = false;
            mockStores.bookingStore.extraLuggage.isHoldLuggageAvailable = true;
            const { AdditionalLuggageTitle, PriceLabel, ShowMoreLuggage, HideAdditionalLuggage } =
                mockProps.additionalFields;

            render(<HoldLuggageOptions {...mockProps} />);

            expect(mockHoldLuggageSection).toHaveBeenNthCalledWith(
                1,
                expect.objectContaining({
                    Title: AdditionalLuggageTitle,
                    LuggageItems: mockProps.fields.HoldLuggageItems,
                    PriceLabel: PriceLabel,
                    showMore: ShowMoreLuggage.value,
                    hideLabel: HideAdditionalLuggage.value,
                }),
            );

            expect(screen.getAllByTestId('hold-luggage-section')).toHaveLength(1);
            expect(screen.getByTestId('hold-luggage-section')).toHaveClass('holdLuggageSection');
        });

        it('should render HoldLuggageSection for enabled holdLuggage and sportEquipment restricted by season', () => {
            const { AdditionalLuggageTitle, PriceLabel, ShowMoreLuggage, HideAdditionalLuggage } =
                mockProps.additionalFields;
            jest.spyOn(utils, 'getIsSportEquipmentAvailableSeason').mockReturnValueOnce(false);

            render(<HoldLuggageOptions {...mockProps} />);

            expect(mockHoldLuggageSection).toHaveBeenNthCalledWith(
                1,
                expect.objectContaining({
                    Title: AdditionalLuggageTitle,
                    LuggageItems: mockProps.fields.HoldLuggageItems,
                    PriceLabel: PriceLabel,
                    showMore: ShowMoreLuggage.value,
                    hideLabel: HideAdditionalLuggage.value,
                }),
            );

            expect(screen.getAllByTestId('hold-luggage-section')).toHaveLength(1);
            expect(screen.getByTestId('hold-luggage-section')).toHaveClass('holdLuggageSection');
        });

        it('should render HoldLuggageSection for disabled holdLuggage and enabled sportEquipment', () => {
            mockStores.bookingStore.extraLuggage.isSportsEquipmentAvailable = true;
            mockStores.bookingStore.extraLuggage.isHoldLuggageAvailable = false;
            const { PriceLabel, SportsEquipmentTitle, ShowMoreEquipment, HideAdditionalEquipment } =
                mockProps.additionalFields;

            render(<HoldLuggageOptions {...mockProps} />);

            expect(utils.getIsSportEquipmentAvailableSeason).toHaveBeenCalledWith(
                mockProps.fields.SportEquipmentRestrictedSeasons.fields.RestrictionSeasonsList,
                mockStores.bookingStore.travelDate,
            );

            expect(mockHoldLuggageSection).toHaveBeenNthCalledWith(
                1,
                expect.objectContaining({
                    Title: SportsEquipmentTitle,
                    LuggageItems: mockProps.fields.SportsEquipmentItems,
                    PriceLabel: PriceLabel,
                    showMore: ShowMoreEquipment.value,
                    hideLabel: HideAdditionalEquipment.value,
                    isSport: true,
                }),
            );

            expect(screen.getAllByTestId('hold-luggage-section')).toHaveLength(1);
            expect(screen.getByTestId('hold-luggage-section')).toHaveClass('sportSection');
        });
    });
});
