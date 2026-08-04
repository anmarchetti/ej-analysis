import * as React from 'react';
import { render, screen, within } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { OutlineBannerTheme } from 'frontend/components/common/OutlineBanner/OutlineBannerTheme';

import { ISeatsAndBagsProps, SeatsAndBagsLuxuryInternalFlight } from './SeatsAndBagsLuxuryInternalFlight';

const createProps = (): ISeatsAndBagsProps => ({
    Description: mockSitecoreField('Description'),
    Icon: mockSitecoreField(mockSitecoreImageField('Icon')),
    LuxurySeriesSeatFlightsTitlePostBook: mockSitecoreField('LuxurySeriesSeatFlightsTitlePostBook'),
    SeriesSeatFlightsPageTitle: mockSitecoreField('SeriesSeatFlightsPageTitle'),
    Subtitle: mockSitecoreField('Subtitle'),
});

const createStore = () => createMockStores();

let mockProps: ISeatsAndBagsProps;
let mockStore;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStore,
}));

const mockOutlineBannerContext = jest.fn();
jest.mock('frontend/components/common/OutlineBanner/OutlineBanner', () => ({
    __esModule: true,
    ...jest.requireActual('frontend/components/common/OutlineBanner/OutlineBanner'),
    default: ({ children }) => <div data-tid='outline-banner'>{children}</div>,
    OutlineBannerContext: {
        Provider: props => {
            mockOutlineBannerContext(props);

            return <div data-tid='outline-banner-context'>{props.children}</div>;
        },
    },
}));

const mockAncillariesMainContent = jest.fn();
jest.mock('frontend/components/common/Ancillaries/components/AncillariesMainContent/AncillariesMainContent', () => ({
    __esModule: true,
    default: props => {
        mockAncillariesMainContent(props);

        return <div data-tid='ancillaries-main-content' />;
    },
}));

describe('SeatsAndBagsLuxuryInternalFlight', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStore = createStore();
    });

    it('should render correctly on Extras Page', () => {
        mockStore.layoutStore.isExtrasPage = true;

        render(<SeatsAndBagsLuxuryInternalFlight {...mockProps} />);

        const container = screen.getByTestId('seats-and-bags-luxury-internal-flight');
        const context = within(container).getByTestId('outline-banner-context');
        const outlineBanner = within(context).getByTestId('outline-banner');
        expect(within(outlineBanner).getByTestId('ancillaries-main-content')).toBeInTheDocument();
        expect(within(container).getByTestId('seats-and-bags-title')).toHaveTextContent(
            mockProps.SeriesSeatFlightsPageTitle.value,
        );

        expect(mockOutlineBannerContext).toHaveBeenCalledWith({
            value: { theme: OutlineBannerTheme.LuxuryTheme },
            children: expect.anything(),
        });
        expect(mockAncillariesMainContent).toHaveBeenCalledWith({
            Description: mockProps.Description,
            Icon: mockProps.Icon,
            Subtitle: mockProps.Subtitle,
        });
    });

    it('should render correctly on non-Extras Page', () => {
        mockStore.layoutStore.isExtrasPage = false;

        render(<SeatsAndBagsLuxuryInternalFlight {...mockProps} />);

        const container = screen.getByTestId('seats-and-bags-luxury-internal-flight');
        const context = within(container).getByTestId('outline-banner-context');
        const outlineBanner = within(context).getByTestId('outline-banner');
        expect(within(outlineBanner).getByTestId('ancillaries-main-content')).toBeInTheDocument();
        expect(within(container).getByTestId('seats-and-bags-title')).toHaveTextContent(
            mockProps.LuxurySeriesSeatFlightsTitlePostBook.value,
        );

        expect(mockOutlineBannerContext).toHaveBeenCalledWith({
            value: { theme: OutlineBannerTheme.LuxuryTheme },
            children: expect.anything(),
        });
        expect(mockAncillariesMainContent).toHaveBeenCalledWith({
            Description: mockProps.Description,
            Icon: mockProps.Icon,
            Subtitle: mockProps.Subtitle,
        });
    });

    it('should apply postBookPageSeats class when on post-booking pages', () => {
        mockStore.layoutStore.isPostBookingPages = true;

        render(<SeatsAndBagsLuxuryInternalFlight {...mockProps} />);

        const container = screen.getByTestId('seats-and-bags-luxury-internal-flight');
        expect(container).toHaveClass('postBookPageSeats');
    });

    it('should NOT apply postBookPageSeats class when not on post-booking pages', () => {
        mockStore.layoutStore.isPostBookingPages = false;

        render(<SeatsAndBagsLuxuryInternalFlight {...mockProps} />);

        const container = screen.getByTestId('seats-and-bags-luxury-internal-flight');
        expect(container).not.toHaveClass('postBookPageSeats');
    });
});
