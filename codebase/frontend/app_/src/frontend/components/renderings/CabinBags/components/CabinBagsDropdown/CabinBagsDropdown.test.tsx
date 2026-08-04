import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores, mockPassengersRoute } from 'frontend/__mocks__';
import { mockCabinBagsFields } from 'frontend/__mocks__/cabinBags';
import { IPassengerFlights } from 'models/data/AncillariesInfo';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { CabinBagsDropdown, ICabinBagsDropdownProps } from './CabinBagsDropdown';

const createProps = (): ICabinBagsDropdownProps => ({
    fields: mockCabinBagsFields,
    isExpanded: false,
    onExpandChange: jest.fn(),
});

const createStores = () =>
    createMockStores({
        flightsPassengersStore: {
            passengersByQueue: [mockPassengersRoute, mockPassengersRoute] as IPassengerFlights[],
        },
        layoutStore: {
            isPostBookingPages: false,
        },
    });

let mockProps = createProps();
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockJSSImage = jest.fn();
jest.mock('frontend/components/common/JSSImage', () => ({
    __esModule: true,
    default: ({ ...props }) => {
        mockJSSImage(props);

        return <div data-tid='jss-image' />;
    },
}));

const mockRichTextDictionary = jest.fn();
jest.mock('frontend/components/common/RichTextDictionary', () => ({
    __esModule: true,
    default: ({ ...props }) => {
        mockRichTextDictionary(props);

        return <div data-tid='rich-text-dictionary' />;
    },
}));

const mockReadMoreButton = jest.fn();
jest.mock('frontend/components/common/ReadMoreButton', () => ({
    __esModule: true,
    default: ({ ...props }) => {
        mockReadMoreButton(props);

        return <div data-tid='read-more-button' onClick={props.onReadMoreButtonClick} {...props} />;
    },
}));

const mockCabinBagsPricePanel = jest.fn();
jest.mock('frontend/components/renderings/CabinBags/components/CabinBagsPricePanel/CabinBagsPricePanel', () => ({
    __esModule: true,
    default: ({ ...props }) => {
        mockCabinBagsPricePanel(props);

        return <div data-tid='cabin-bags-price-panel' />;
    },
}));

describe('<CabinBagsDropdown />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render default', () => {
        const { CollapseClose, CollapseOpen, OutboundIcon } = mockCabinBagsFields;

        render(<CabinBagsDropdown {...mockProps} />);

        expect(screen.getByTestId('lcb-dropdown-wrapper')).toHaveClass('wrapper');
        expect(screen.getByTestId('lcb-dropdown')).toHaveClass('container');
        expect(screen.getByTestId('lcb-dropdown-header')).not.toHaveClass('header');
        expect(screen.getByTestId('lcb-dropdown-header')).not.toHaveClass('headerAlt');
        expect(screen.getByTestId('lcb-dropdown-collapsing-part')).toHaveClass('d-none');
        expect(screen.getByTestId('routes-title')).toHaveClass('routesTitle d-none');
        expect(screen.getByTestId('open-lcb-dropdown-action')).toHaveClass(
            'read-more-box read-more-box-alt readMoreButton',
        );
        expect(screen.getByTestId('open-lcb-dropdown-action')).not.toHaveClass('readMoreButtonNoGap');

        expect(screen.getByTestId('read-more-button')).toBeInTheDocument();
        expect(mockReadMoreButton).toHaveBeenCalledWith(
            expect.objectContaining({
                isReadLess: false,
                readLessText: CollapseClose.value,
                readMoreText: CollapseOpen.value,
            }),
        );

        expect(screen.getAllByTestId('cabin-bags-price-panel').length).toBe(2);
        expect(mockCabinBagsPricePanel).toHaveBeenNthCalledWith(2, {
            fields: mockCabinBagsFields,
            passenger: mockPassengersRoute,
            passengerIndex: 2,
        });

        expect(screen.getByTestId('jss-image')).toBeInTheDocument();
        expect(mockJSSImage).toHaveBeenCalledWith({
            field: OutboundIcon,
            'data-tid': 'outbound-icon',
            className: 'icon',
        });

        expect(screen.getAllByTestId('rich-text-dictionary').length).toBe(2);
        expect(mockRichTextDictionary).toHaveBeenNthCalledWith(1, {
            dictionaryKey: SitecoreDictionary.SeatMapLabelsOutbound,
            tag: 'span',
        });

        expect(mockRichTextDictionary).toHaveBeenNthCalledWith(2, {
            dictionaryKey: SitecoreDictionary.SeatMapLabelsReturn,
            tag: 'span',
        });
    });

    it('should execute the onExpandChange callback when dropdown gets expanded/collapsed', async () => {
        render(<CabinBagsDropdown {...mockProps} />);

        const readMoreButton = screen.getAllByTestId('read-more-button')[0];

        await userEvent.click(readMoreButton);
        expect(mockProps.onExpandChange).toHaveBeenCalled();
    });

    it('should provide more info when dropdown expanded', async () => {
        mockProps.isExpanded = true;
        render(<CabinBagsDropdown {...mockProps} />);

        expect(mockReadMoreButton).toHaveBeenCalledWith(
            expect.objectContaining({
                isReadLess: true,
            }),
        );
        expect(screen.getByTestId('routes-title')).not.toHaveClass('d-none');
        expect(screen.getByTestId('lcb-dropdown-header')).toHaveClass('header');
        expect(screen.getByTestId('lcb-dropdown-collapsing-part')).not.toHaveClass('d-none');
    });

    it('should hide ReadMoreButton and apply different styling on Post Booking Flow', () => {
        mockStores.layoutStore.isPostBookingPages = true;
        render(<CabinBagsDropdown {...mockProps} />);

        expect(screen.queryByTestId('read-more-button')).not.toBeInTheDocument();

        expect(screen.getByTestId('lcb-dropdown-wrapper')).toHaveClass('wrapperPostBooking');
        expect(screen.getByTestId('lcb-dropdown-header')).toHaveClass('headerAlt');
    });

    it('should render View only label when isLuxuryPackage is true', () => {
        mockStores.bookingStore.isLuxuryPackage = true;
        render(<CabinBagsDropdown {...mockProps} />);

        expect(mockReadMoreButton).toHaveBeenCalledWith({
            isReadLess: false,
            onClick: expect.any(Function),
            readLessText: mockProps.fields.CollapseClose?.value,
            readMoreText: mockProps.fields.CollapseOpenViewOnly.value,
        });
    });
});
