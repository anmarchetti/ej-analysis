import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockDefaultBags } from 'frontend/__mocks__/extraLuggage';
import { mockReplaceToken, mockReplaceTokens } from 'frontend/__mocks__/utils/tokenizer';
import * as utils from 'frontend/utils/luggage.utils';
import { mockHoldLuggageFields } from 'frontend/components/renderings/HoldLuggage/__mocks__/mockHoldLuggageFields';

import HoldLuggageHeader, { IHoldLuggageHeaderProps } from './HoldLuggageHeader';

const createProps = (): IHoldLuggageHeaderProps => ({
    fields: mockHoldLuggageFields,
    luggageCount: 3,
});

jest.mock('frontend/utils/luggage.utils', () => ({
    getIsSportEquipmentAvailableSeason: jest.fn(),
}));

const createStores = () =>
    createMockStores({
        bookingStore: {
            travelDate: new Date('2024-09-30T14:50:00+00:00'),
            isFlightExtrasFailed: false,
            extraLuggageCategoriesExist: true,
            extraLuggage: {
                isHoldLuggageAvailable: true,
                isSportsEquipmentAvailable: true,
                defaultBagsNumber: mockDefaultBags.length,
                defaultBagsOneDirection: mockDefaultBags,
            },
        },
        layoutStore: {
            isConfirmationPage: false,
        },
    });

let mockProps = createProps();
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/utils/tokenizer', () => ({
    __esModule: true,
    Tokenizer: {
        replaceTokens: mockReplaceTokens,
        replaceToken: mockReplaceToken,
    },
}));

jest.mock('frontend/components/common/JSSImage', () => ({
    __esModule: true,
    default: ({ field, className }) => (
        <div data-tid='image' className={className}>
            {field.value.src}
        </div>
    ),
}));

const mockAncillariesHeader = jest.fn();
jest.mock('frontend/components/common/Ancillaries/components/AncillariesHeader/AncillariesHeader', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockAncillariesHeader(props);

        return <div data-tid='ancillaries-header'>{children}</div>;
    },
}));

describe('HoldLuggageHeader', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render HoldLuggageHeader with HoldLuggageAndSportsSubtitle when HL and SE available', () => {
        jest.spyOn(utils, 'getIsSportEquipmentAvailableSeason').mockReturnValueOnce(true);

        render(<HoldLuggageHeader {...mockProps} />);

        expect(utils.getIsSportEquipmentAvailableSeason).toHaveBeenCalledWith(
            mockProps.fields.SportEquipmentRestrictedSeasons.fields.RestrictionSeasonsList,
            mockStores.bookingStore.travelDate,
        );

        expect(screen.getByTestId('ancillaries-header')).toBeInTheDocument();
        expect(mockAncillariesHeader).toHaveBeenCalledWith({
            title: mockProps.fields.Title,
            description: mockProps.fields.HoldLuggageAndSportsSubtitle,
            dataTid: 'hold-luggage-header',
        });

        const image = screen.getByTestId('image');
        expect(image).toHaveTextContent('OutboundAndReturnIcon');
        expect(image).toHaveClass('icon');

        const label = screen.queryByTestId('hold-luggage-details-multiple');
        expect(label).toHaveClass('text');
        expect(label).toHaveTextContent('OutboundAndReturnTextMultiple');
    });

    it('should use OutboundAndReturnTextSingular label when there is 1 luggage', () => {
        mockProps.luggageCount = 1;

        render(<HoldLuggageHeader {...mockProps} />);

        expect(screen.getByTestId('hold-luggage-details-singular')).toHaveTextContent('OutboundAndReturnTextSingular');
    });

    it('should use OutboundAndReturnTextMultiple label when luggageCount == 0', () => {
        mockProps.luggageCount = 0;

        render(<HoldLuggageHeader {...mockProps} />);

        expect(screen.getByTestId('hold-luggage-details-multiple')).toHaveTextContent('OutboundAndReturnTextMultiple');
    });

    it('should render NoDefaultBagsSubtitle when no default bags', () => {
        mockStores.bookingStore.extraLuggage.defaultBagsNumber = 0;

        render(<HoldLuggageHeader {...mockProps} />);

        expect(mockAncillariesHeader).toHaveBeenCalledWith({
            title: mockProps.fields.Title,
            description: mockProps.fields.NoDefaultBagsSubtitle,
            dataTid: 'hold-luggage-header',
        });
    });

    it('should render HoldLuggageSubtitle for enabled hold luggage and disabled sportEquipment', () => {
        mockStores.bookingStore.extraLuggage.isSportsEquipmentAvailable = false;

        render(<HoldLuggageHeader {...mockProps} />);

        expect(mockAncillariesHeader).toHaveBeenCalledWith({
            title: mockProps.fields.Title,
            description: mockProps.fields.HoldLuggageSubtitle,
            dataTid: 'hold-luggage-header',
        });
    });

    it('should render HoldLuggageSubtitle for enabled HL and disabled by season SE', () => {
        render(<HoldLuggageHeader {...mockProps} />);

        expect(mockAncillariesHeader).toHaveBeenCalledWith({
            title: mockProps.fields.Title,
            description: mockProps.fields.HoldLuggageSubtitle,
            dataTid: 'hold-luggage-header',
        });
    });

    it('should render SportsSubtitleOnly for disabled HL and enabled SE', () => {
        mockStores.bookingStore.extraLuggage.isHoldLuggageAvailable = false;
        jest.spyOn(utils, 'getIsSportEquipmentAvailableSeason').mockReturnValueOnce(true);

        render(<HoldLuggageHeader {...mockProps} />);

        expect(mockAncillariesHeader).toHaveBeenCalledWith({
            title: mockProps.fields.Title,
            description: mockProps.fields.SportsSubtitle,
            dataTid: 'hold-luggage-header',
        });
    });

    it('should render HoldLuggageAndSportsSubtitle for disabled hold luggage and disabled sportEquipment', () => {
        mockStores.bookingStore.extraLuggage.isSportsEquipmentAvailable = false;
        mockStores.bookingStore.extraLuggage.isHoldLuggageAvailable = false;

        render(<HoldLuggageHeader {...mockProps} />);

        expect(mockAncillariesHeader).toHaveBeenCalledWith({
            title: mockProps.fields.Title,
            description: mockProps.fields.HoldLuggageAndSportsSubtitle,
            dataTid: 'hold-luggage-header',
        });
    });

    it('should render HoldLuggageLuxurySubtitle when it is luxury package', () => {
        mockStores.bookingStore.isLuxuryPackage = true;
        render(<HoldLuggageHeader {...mockProps} />);

        expect(mockAncillariesHeader).toHaveBeenCalledWith({
            title: mockProps.fields.Title,
            description: mockProps.fields.HoldLuggageLuxurySubtitle,
            dataTid: 'hold-luggage-header',
        });
    });

    describe('RequestFailureAltSubtitle', () => {
        it('should render RequestFailureAltSubtitle when isFlightExtrasFailed is true', () => {
            mockStores.bookingStore.isFlightExtrasFailed = true;

            render(<HoldLuggageHeader {...mockProps} />);

            expect(mockAncillariesHeader).toHaveBeenCalledWith({
                title: mockProps.fields.Title,
                description: mockProps.fields.RequestFailureAltSubtitle,
                dataTid: 'hold-luggage-header',
            });
        });

        it('should render RequestFailureAltSubtitle when extraLuggageCategoriesExist is false', () => {
            mockStores.bookingStore.extraLuggageCategoriesExist = false;

            render(<HoldLuggageHeader {...mockProps} />);

            expect(mockAncillariesHeader).toHaveBeenCalledWith({
                title: mockProps.fields.Title,
                description: mockProps.fields.RequestFailureAltSubtitle,
                dataTid: 'hold-luggage-header',
            });
        });
    });

    it('should NOT render subtitle AND should apply confirmation page styles when isConfirmationPage is true', () => {
        mockStores.layoutStore.isConfirmationPage = true;

        render(<HoldLuggageHeader {...mockProps} />);

        expect(mockAncillariesHeader).toHaveBeenCalledWith({
            title: mockProps.fields.Title,
            description: undefined,
            dataTid: 'hold-luggage-header',
        });
    });
});
