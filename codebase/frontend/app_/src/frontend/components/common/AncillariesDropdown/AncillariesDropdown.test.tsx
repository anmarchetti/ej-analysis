import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { AncillariesDropdown, IAncillariesDropdownProps } from './AncillariesDropdown';
import { adjustHeight } from './ancillariesDropdown.utils';

jest.mock('./ancillariesDropdown.utils', () => ({
    adjustHeight: jest.fn(),
}));

const createProps = (): IAncillariesDropdownProps => ({
    passengerTypeInfo: [
        <div key={1} data-tid='passenger-info'>
            Passenger Info 1
        </div>,
        <div key={2} data-tid='passenger-info'>
            Passenger Info 2
        </div>,
    ],
    pricePanelsInbound: [
        <div key={1} data-tid='panel-inbound'>
            Panel Inbound 1
        </div>,
        <div key={2} data-tid='panel-inbound'>
            Panel Inbound 2
        </div>,
    ],
    pricePanelsOutbound: [
        <div key={1} data-tid='panel-outbound'>
            Panel Outbound 1
        </div>,
        <div key={1} data-tid='panel-outbound'>
            Panel Outbound 2
        </div>,
    ],
    fields: {
        CollapseClose: mockSitecoreField('collapseClose'),
        CollapseOpen: mockSitecoreField('collapseOpen'),
        OutboundIcon: mockSitecoreField(mockSitecoreImageField('outboundIcon')),
        ReturnIcon: mockSitecoreField(mockSitecoreImageField('returnIcon')),
    },
});

const createStores = () => ({
    layoutStore: {
        getPhrase: jest.fn(p => p),
        isConfirmationPage: false,
        isViewBookingPage: false,
        isAmendPaymentPage: false,
    },
});

let mockProps = createProps();
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('../JSSImage', () => ({
    __esModule: true,
    default: ({ ...props }) => <div {...props} />,
}));

const mockReadMoreButtonComponent = jest.fn();
jest.mock('frontend/components/common/ReadMoreButton', () => ({
    __esModule: true,
    default: ({ ...props }) => {
        mockReadMoreButtonComponent(props);

        return <div data-tid='read-more-button' {...props} />;
    },
}));

const mockRichTextDictionary = jest.fn();
jest.mock('frontend/components/common/RichTextDictionary', () => ({
    __esModule: true,
    default: ({ ...props }) => {
        mockRichTextDictionary(props);

        return <div data-tid='no-seat-selected-dictionary' {...props} />;
    },
}));

describe('<AncillariesDropdown />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render standard', () => {
        render(<AncillariesDropdown {...mockProps} />);

        const wrapper = screen.getByTestId('ancillaries-wrapper');
        expect(wrapper).toHaveClass('wrapper');
        expect(wrapper).not.toHaveClass('wrapperAlt');

        expect(screen.getByTestId('read-more-button')).toBeInTheDocument();
        expect(mockReadMoreButtonComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                isReadLess: false,
                readLessText: mockProps.fields?.CollapseClose.value,
                readMoreText: mockProps.fields?.CollapseOpen.value,
            }),
        );

        expect(screen.getByTestId('outbound-column')).toHaveClass('d-none');
        expect(screen.getByTestId('return-column')).toHaveClass('d-none');

        const passengerWrap = screen.getByTestId('passenger-type-wrapper');
        expect(passengerWrap).toHaveClass('d-none');
        expect(passengerWrap).not.toHaveClass('d-md-block');

        const container = screen.getByTestId('ancillaries-container');
        expect(container).not.toHaveClass('containerGrid');
        expect(container).not.toHaveClass('containerGridAlt');

        expect(screen.queryByTestId('anc-action-panel-wrap')).not.toBeInTheDocument();
    });

    it('should provide more info on read more button click', async () => {
        render(<AncillariesDropdown {...mockProps} />);

        const readMoreButton = screen.getByTestId('read-more-button');

        await userEvent.click(readMoreButton);

        expect(screen.getByTestId('passenger-type-wrapper')).toHaveClass('d-md-block');

        const passengerInfo = screen.getAllByTestId('passenger-info');
        expect(passengerInfo).toHaveLength(6);
        expect(passengerInfo[0]).toHaveTextContent('Passenger Info 1');
        expect(passengerInfo[1]).toHaveTextContent('Passenger Info 2');

        expect(screen.getByTestId('outbound-icon')).toBeInTheDocument();
        expect(screen.getByTestId('outbound-column')).not.toHaveClass('d-none');
        expect(screen.getByTestId('outbound-text')).not.toHaveClass('outboundExtraPadding');

        const panelsOutbound = screen.getAllByTestId('panel-outbound');
        expect(panelsOutbound).toHaveLength(4);
        expect(panelsOutbound[0]).toHaveTextContent('Panel Outbound 1');
        expect(panelsOutbound[1]).toHaveTextContent('Panel Outbound 2');

        expect(screen.getByTestId('return-icon')).toBeInTheDocument();
        expect(screen.getByTestId('return-column')).not.toHaveClass('d-none');

        const panelsInbound = screen.getAllByTestId('panel-inbound');
        expect(panelsInbound).toHaveLength(4);
        expect(panelsInbound[0]).toHaveTextContent('Panel Inbound 1');
        expect(panelsInbound[1]).toHaveTextContent('Panel Inbound 2');

        expect(mockRichTextDictionary).toHaveBeenNthCalledWith(1, {
            dictionaryKey: SitecoreDictionary.SeatMapLabelsOutbound,
            tag: 'span',
        });

        expect(mockRichTextDictionary).toHaveBeenNthCalledWith(2, {
            dictionaryKey: SitecoreDictionary.SeatMapLabelsReturn,
            tag: 'span',
        });
    });

    describe('Confirmation page', () => {
        beforeEach(() => {
            mockStores.layoutStore.isConfirmationPage = true;
        });

        it('should render default', () => {
            render(<AncillariesDropdown {...mockProps} />);

            expect(screen.getByTestId('ancillaries-container')).toHaveClass('containerGrid containerGrid bookingPage');
            expect(screen.getByTestId('read-more-column')).toHaveClass('placeholder');

            expect(screen.queryByTestId('read-more-button')).not.toBeInTheDocument();
            expect(screen.queryByTestId('no-seat-return')).not.toBeInTheDocument();
            expect(screen.queryByTestId('no-seat-outbound')).not.toBeInTheDocument();

            expect(screen.getByTestId('outbound-column')).not.toHaveClass('d-none');
            expect(screen.getByTestId('return-column')).not.toHaveClass('d-none');
        });

        it('should apply different styles for component when there is no panel for inbound', () => {
            mockProps.pricePanelsInbound = null;

            render(<AncillariesDropdown {...mockProps} />);

            expect(screen.getByTestId('no-seat-return')).toHaveClass('noSeats d-lg-none');
            expect(screen.getByTestId('return-text')).toHaveClass('noSelection');
        });

        it('should apply different styles for component when there is no panel for outbound', () => {
            mockProps.pricePanelsOutbound = null;

            render(<AncillariesDropdown {...mockProps} />);

            expect(screen.getByTestId('no-seat-outbound')).toHaveClass('noSeats d-lg-none');
            expect(screen.getByTestId('outbound-text')).toHaveClass('noSelection');
        });
    });

    describe('View booking page', () => {
        beforeEach(() => {
            mockStores.layoutStore.isViewBookingPage = true;
        });

        it('should render default', () => {
            render(<AncillariesDropdown {...mockProps} />);

            expect(screen.getByTestId('ancillaries-container')).toHaveClass(
                'container containerGrid bookingPage postBookingTheme',
            );
            expect(screen.getByTestId('read-more-column')).toHaveClass('placeholder');
            expect(screen.getByTestId('anc-action-panel-wrap')).toHaveClass('d-md-none');

            expect(screen.queryByTestId('read-more-button')).not.toBeInTheDocument();

            expect(screen.getByTestId('outbound-column')).not.toHaveClass('d-none');
            expect(screen.getByTestId('return-column')).not.toHaveClass('d-none');
        });
    });

    describe('Amend payment page', () => {
        beforeEach(() => {
            mockStores.layoutStore.isAmendPaymentPage = true;
        });

        it('should render default', () => {
            render(<AncillariesDropdown {...mockProps} />);

            expect(screen.queryByTestId('read-more-box')).not.toBeInTheDocument();
            expect(screen.getByTestId('ancillaries-container')).not.toHaveClass('bookingPage');
        });
    });

    it('should call adjustHeight on resize event', () => {
        render(<AncillariesDropdown {...mockProps} />);

        fireEvent(window, new Event('resize'));

        expect(adjustHeight).toHaveBeenCalled();
    });
});
