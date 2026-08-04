import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockAncillariesParams } from 'frontend/__mocks__/ancillaries';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';

import { Ancillaries, IAncillariesProps } from './Ancillaries';

const createProps = (): IAncillariesProps => ({
    actionPanel: <div data-tid='action-panel'>Action Panel</div>,
    fields: {
        Icon: mockSitecoreField(mockSitecoreImageField('icon')),
        OutboundIcon: mockSitecoreField(mockSitecoreImageField('outboundIcon')),
        ReturnIcon: mockSitecoreField(mockSitecoreImageField('returnIcon')),
        Title: mockSitecoreField('title'),
        OutlineBannerTextContent: mockSitecoreField('outlineBannerTextContent'),
    },
    inboundSelection: <div data-tid='inbound-selection'>Inbound Selection</div>,
    outboundSelection: <div data-tid='outbound-selection'>Outbound Selection</div>,
    children: <div data-tid='children' />,
    banners: <div data-tid='banners' />,
    isCabinBags: false,
    params: mockAncillariesParams,
    Description: mockSitecoreField('description'),
    Subtitle: mockSitecoreField('subtitle'),
});

let mockProps = createProps();
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockAncillariesRoute = jest.fn();
jest.mock('./components/AncillariesRoute', () => ({
    __esModule: true,
    default: ({ ...props }) => {
        mockAncillariesRoute(props);

        return <div data-tid='route' />;
    },
}));

const mockOutlineBanner = jest.fn();
jest.mock('frontend/components/common/OutlineBanner/OutlineBanner.tsx', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockOutlineBanner(props);

        return <div data-tid='outline-banner'>{children}</div>;
    },
}));

const mockAncillariesHeader = jest.fn();
jest.mock('./components/AncillariesHeader/AncillariesHeader', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockAncillariesHeader(props);

        return <div data-tid='ancillaries-header' />;
    },
}));

const mockAncillariesMainContent = jest.fn();
jest.mock('./components/AncillariesMainContent/AncillariesMainContent', () => ({
    __esModule: true,
    default: props => {
        mockAncillariesMainContent(props);

        return <div data-tid='ancillaries-main-content' />;
    },
}));

describe('<Ancillaries />', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        mockProps = createProps();
        mockStores = createMockStores();
    });

    it('should render default component', () => {
        render(<Ancillaries {...mockProps} />);

        expect(screen.getByTestId('ancillaries')).not.toHaveClass('whiteWrapper');

        expect(screen.getByTestId('ancillaries-header')).toBeInTheDocument();
        expect(mockAncillariesHeader).toHaveBeenCalledWith({
            title: mockProps.fields.Title,
            dataTid: 'ancillaries',
        });

        expect(screen.getByTestId('banners')).toBeInTheDocument();

        const content = screen.getByTestId('content');
        expect(content).toHaveClass('content');
        expect(content).not.toHaveClass('noBorders noPaddings');

        const columnsContainer = screen.getByTestId('columns-container');
        expect(columnsContainer).toHaveClass('columnsContainer');
        expect(columnsContainer).not.toHaveClass('columnsContainerAlt');

        expect(screen.getByTestId('ancillaries-main-content')).toBeInTheDocument();
        expect(mockAncillariesMainContent).toHaveBeenCalledWith({
            Description: mockProps.Description,
            Icon: mockProps.fields.Icon,
            Subtitle: mockProps.Subtitle,
            dataTid: 'promo',
        });

        expect(mockAncillariesRoute).toHaveBeenCalledTimes(2);
        expect(mockAncillariesRoute).toHaveBeenNthCalledWith(1, {
            isOutbound: true,
            fields: mockProps.fields,
            children: mockProps.outboundSelection,
        });
        expect(mockAncillariesRoute).toHaveBeenNthCalledWith(2, {
            fields: mockProps.fields,
            children: mockProps.inboundSelection,
        });

        expect(screen.getByTestId('outline-banner')).toBeInTheDocument();
        expect(mockOutlineBanner).toHaveBeenCalledWith({
            color: mockAncillariesParams.Color,
            textContent: { value: 'outlineBannerTextContent' },
        });

        const actionWrap = screen.getByTestId('action-panel-wrapper');
        expect(actionWrap).toHaveClass('actionPanelWrapper');
        expect(actionWrap).not.toHaveClass('d-md-block d-none');

        expect(screen.getByTestId('action-panel')).toHaveTextContent('Action Panel');
        expect(screen.getByTestId('children')).toBeInTheDocument();
    });

    describe('View Booking', () => {
        beforeEach(() => {
            mockStores.layoutStore.isViewBookingPage = true;
        });

        it('should render component and add visibility classes to action panel', () => {
            render(<Ancillaries {...mockProps} />);

            expect(screen.getByTestId('banners')).toBeInTheDocument();

            const columnsContainer = screen.getByTestId('columns-container');
            expect(columnsContainer).toHaveClass('columnsContainer columnsContainerAlt');

            expect(screen.getByTestId('ancillaries-main-content')).toBeInTheDocument();
            expect(mockAncillariesMainContent).toHaveBeenCalledWith({
                Description: mockProps.Description,
                Icon: mockProps.fields.Icon,
                Subtitle: mockProps.Subtitle,
                dataTid: 'promo',
            });

            expect(mockAncillariesRoute).not.toHaveBeenCalled();

            expect(screen.getByTestId('action-panel')).toHaveTextContent('Action Panel');

            expect(screen.getByTestId('children')).toBeInTheDocument();

            expect(screen.getByTestId('action-panel-wrapper')).toHaveClass('d-md-block d-none');
        });
    });

    describe('Post Booking Pages', () => {
        beforeEach(() => {
            mockStores.layoutStore.isPostBookingPages = true;
        });

        it('should render additional margin style for LCB on PostBookingFlow', () => {
            mockProps.isCabinBags = true;

            render(<Ancillaries {...mockProps} />);

            expect(screen.queryByTestId('ancillaries')).toHaveClass('cabinBagsMargin');
        });

        it('should render component', () => {
            render(<Ancillaries {...mockProps} />);

            expect(screen.getByTestId('ancillaries')).toHaveClass('whiteWrapper');

            expect(screen.getByTestId('ancillaries-header')).toBeInTheDocument();
            expect(screen.getByTestId('banners')).toBeInTheDocument();

            const content = screen.getByTestId('content');
            expect(content).toHaveClass('content noBorders');
        });
    });

    it('should render component for Confirmation page', () => {
        mockStores.layoutStore.isConfirmationPage = true;

        render(<Ancillaries {...mockProps} />);

        expect(screen.getByTestId('banners')).toBeInTheDocument();

        expect(screen.queryByTestId('columns-container')).not.toBeInTheDocument();
        expect(screen.queryByTestId('promo')).not.toBeInTheDocument();
        expect(screen.queryByTestId('ancillaries-icon')).not.toBeInTheDocument();
        expect(screen.queryByTestId('ancillaries-subtitle')).not.toBeInTheDocument();
        expect(screen.queryByTestId('ancillaries-description')).not.toBeInTheDocument();
        expect(screen.queryByTestId('action-panel')).not.toBeInTheDocument();

        expect(mockAncillariesRoute).not.toHaveBeenCalled();

        expect(screen.getByTestId('children')).toBeInTheDocument();
    });

    it('Should NOT render columns container on amendPaymentPage', () => {
        mockStores.layoutStore.isAmendPaymentPage = true;

        render(<Ancillaries {...mockProps} />);

        expect(screen.queryByTestId('columns-container')).not.toBeInTheDocument();
    });

    it('should render OutlineBanner with isCabinBags true when isCabinBags == true', () => {
        mockProps.isCabinBags = true;

        render(<Ancillaries {...mockProps} />);

        expect(screen.getByTestId('outline-banner')).toBeInTheDocument();
        expect(mockOutlineBanner).toHaveBeenCalledWith({
            color: mockAncillariesParams.Color,
            textContent: { value: 'outlineBannerTextContent' },
        });
    });

    describe('internal flight ', () => {
        beforeEach(() => {
            mockStores.bookingStore.isFlightExternal = false;
        });

        it('should NOT render header on Extras', () => {
            mockStores.layoutStore.isExtrasPage = true;

            render(<Ancillaries {...mockProps} />);

            expect(screen.queryByTestId('ancillaries-header')).not.toBeInTheDocument();
        });

        it('should render header on other pages', () => {
            mockStores.layoutStore.isConfirmationPage = true;

            render(<Ancillaries {...mockProps} />);

            expect(screen.getByTestId('ancillaries-header')).toBeInTheDocument();
        });
    });
});
