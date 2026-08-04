import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockSitecoreField, mockSitecoreImageField, mockSitecoreLinkField } from 'frontend/utils/tests.utils';
import { ILuggageInfoItem } from 'models/data/IFlightExtras';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { HoldLuggageViewBooking, IHoldLuggageViewBookingProps } from './HoldLuggageViewBooking';

const createProps = (): IHoldLuggageViewBookingProps => ({
    additionalFields: {
        Icon: mockSitecoreField(mockSitecoreImageField('icon')),
        Limit: mockSitecoreField('limit'),
        LuggageIcon: mockSitecoreField(mockSitecoreImageField('icon')),
        Name: mockSitecoreField('pram'),
        SportsEquipmentIcon: mockSitecoreField(mockSitecoreImageField('icon')),
        SportsEquipmentTitle: mockSitecoreField('sport title'),
        Storage: mockSitecoreField('storage'),
        ReadMoreLink: mockSitecoreField(mockSitecoreLinkField('link')),
        YourHolidayQuoteLabel: mockSitecoreField('quote label'),
        TerminalLabel: mockSitecoreField('TerminalLabel'),
        TerminalTooltipText: mockSitecoreField('TerminalTooltipText'),
    },
    guestsAmount: {
        adults: 2,
        children: 1,
        infants: 1,
    },
});

const createStores = () => ({
    layoutStore: {
        getPhrase: jest.fn(p => p),
        isExtraLuggageEnabled: true,
        isConfirmationPage: false,
    },
    viewBookingStore: {
        isFlightExternal: true,
        extraLuggage: {
            totalHoldLuggageItemsNumber: 1,
            extraLuggageFullInfo: [
                {
                    LUG: {
                        quantity: 1,
                        name: 'lug name',
                        icon: 'icon',
                        description: 'lug description',
                        isComplimentary: false,
                    },
                },
                {},
            ] as Record<string, ILuggageInfoItem>[],
            defaultBag: {
                quantity: 1,
                name: 'lus name',
                icon: 'icon',
                description: 'lus description',
                isComplimentary: true,
            },
            defaultBagsNumber: 1,
            sportEquipmentNumber: 0,
        },
    },
    appStore: {
        isScreenLessMedium: false,
    },
});

let mockProps = createProps();
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockViewBookingComponentWrapperProps = jest.fn();
jest.mock('frontend/components/common/ViewBookingComponentWrapper/ViewBookingComponentWrapper', () => ({
    __esModule: true,
    default: ({ dataTid, Title, children, id }) => {
        mockViewBookingComponentWrapperProps({ dataTid, Title, children, id });

        return (
            <div data-tid={dataTid} id={id}>
                {children}
            </div>
        );
    },
}));

const mockPlaceholderProps = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Placeholder: props => {
        mockPlaceholderProps(props);

        return <div data-tid='placeholder' />;
    },
}));

jest.mock('frontend/components/common/RouterLink', () => ({
    __esModule: true,
    default: ({ link }) => (
        <button data-tid='read-more-link' data-link={link?.value?.href}>
            {link?.value?.text}
        </button>
    ),
}));

jest.mock('frontend/components/common/JSSImage', () => ({
    __esModule: true,
    default: ({ field, width, height }) => (
        <img src={field?.value?.src} alt='luggage-image' width={width} height={height} data-tid='luggage-image' />
    ),
}));

const mockUseLuxuryInternalFlight = jest.fn().mockReturnValue(false);
jest.mock('frontend/hooks/useLuxuryInternalFlight', () => ({
    useLuxuryInternalFlight: () => mockUseLuxuryInternalFlight(),
}));

describe('<HoldLuggageViewBooking />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should not render when totalHoldLuggageItemsNumber is 0 and there is no infants', () => {
        mockStores.viewBookingStore.extraLuggage.totalHoldLuggageItemsNumber = 0;
        mockProps.guestsAmount.infants = 0;

        const { container } = render(<HoldLuggageViewBooking {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should not render when it is luxury internal flight', () => {
        mockUseLuxuryInternalFlight.mockReturnValue(true);

        const { container } = render(<HoldLuggageViewBooking {...mockProps} />);

        expect(container).toBeEmptyDOMElement();

        mockUseLuxuryInternalFlight.mockReturnValue(false);
    });

    it('should render default', () => {
        const { Name, Storage } = mockProps.additionalFields;

        render(<HoldLuggageViewBooking {...mockProps} />);

        expect(mockViewBookingComponentWrapperProps).toHaveBeenCalledWith(
            expect.objectContaining({
                dataTid: 'booking-flights',
                Title: { value: SitecoreDictionary.LuggageLabelsBags },
            }),
        );

        const luggageList = screen.getByTestId('luggage-list');
        expect(luggageList.children).toHaveLength(3);
        expect(luggageList).toHaveClass(`holiday-summary-item__details-list grid-odd-singular`);

        expect(screen.getAllByTestId('luggage-item')).toHaveLength(3);

        const luggageImages = screen.getAllByTestId('luggage-image');
        luggageImages.forEach(item => {
            expect(item.getAttribute('src')).toBe('icon');
            expect(item.getAttribute('width')).toBe('36');
            expect(item.getAttribute('height')).toBe('36');
        });

        const luggageSubtitle = screen.getAllByTestId('luggage-subtitle');
        expect(luggageSubtitle[0]).toHaveTextContent(`${mockProps.guestsAmount.infants} x ${Name.value}`);
        expect(luggageSubtitle[1]).toHaveTextContent(
            `${mockStores.viewBookingStore.extraLuggage.defaultBag.quantity} x ${mockStores.viewBookingStore.extraLuggage.defaultBag.name}`,
        );
        expect(luggageSubtitle[2]).toHaveTextContent(
            `${mockStores.viewBookingStore.extraLuggage.extraLuggageFullInfo[0].LUG.quantity} x ${mockStores.viewBookingStore.extraLuggage.extraLuggageFullInfo[0].LUG.name}`,
        );

        const luggageDescription = screen.getAllByTestId('luggage-description');
        expect(luggageDescription[0]).toHaveTextContent(Storage.value);
        expect(luggageDescription[1]).toHaveTextContent(
            `${mockProps.additionalFields.Limit.value} ${mockProps.additionalFields.Storage.value}`,
        );
        expect(luggageDescription[2]).toHaveTextContent(
            `${mockProps.additionalFields.Limit.value} ${mockProps.additionalFields.Storage.value}`,
        );

        expect(screen.getByTestId('read-more-link')).toHaveAttribute(
            'data-link',
            mockProps.additionalFields.ReadMoreLink?.value.href,
        );
    });

    it('should NOT render read more link when readMoreLink is empty', () => {
        mockProps.additionalFields.ReadMoreLink = undefined;

        render(<HoldLuggageViewBooking {...mockProps} />);

        expect(screen.queryByTestId('read-more-link')).not.toBeInTheDocument();
    });

    describe('grid wrapper styles', () => {
        it('should render grid-even when number of luggage + bags rendering is even', () => {
            mockProps.guestsAmount = {
                adults: 2,
                children: 1,
                infants: 0,
            };

            render(<HoldLuggageViewBooking {...mockProps} />);

            expect(screen.getByTestId('luggage-list')).toHaveClass(`holiday-summary-item__details-list grid-even`);
        });
    });

    it('should render grid-odd-plural when number of luggage + bags rendering is more than 4 and odd', () => {
        mockStores.viewBookingStore.extraLuggage.extraLuggageFullInfo = [
            {
                LUG: { quantity: 3, name: 'lug 23kg', icon: 'icon', description: 'desc' } as ILuggageInfoItem,
                LUS: { quantity: 2, name: 'lus 15kg', icon: 'icon', description: 'desc' } as ILuggageInfoItem,
            },
            {
                BIKE: { quantity: 2, name: 'Bike', icon: 'icon', description: 'desc' } as ILuggageInfoItem,
            },
        ];
        mockStores.viewBookingStore.extraLuggage.sportEquipmentNumber = 2;

        render(<HoldLuggageViewBooking {...mockProps} />);

        expect(screen.getByTestId('luggage-list')).toHaveClass('holiday-summary-item__details-list grid-odd-plural');
    });

    it('should use smaller image size on mobile', () => {
        mockStores.appStore.isScreenLessMedium = true;

        render(<HoldLuggageViewBooking {...mockProps} />);

        const images = screen.getAllByTestId('luggage-image');
        images.forEach(item => {
            expect(item.getAttribute('width')).toBe('28');
            expect(item.getAttribute('height')).toBe('28');
        });
    });
});
