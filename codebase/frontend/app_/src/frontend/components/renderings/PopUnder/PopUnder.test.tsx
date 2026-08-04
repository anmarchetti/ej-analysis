import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import bookingService from 'frontend/services/booking.service';
import { isHolidayStore } from 'frontend/store/holidays';
import * as destinationUtils from 'frontend/utils/destinations.utils';
import { MixedResultsUtm, UtmOptions } from 'frontend/utils/utm.utils';

import PopUnder from './PopUnder';

import styles from './PopUnder.module.scss';

jest.mock('frontend/store/holidays');

jest.mock('frontend/components/common/Popup', () => ({
    __esModule: true,
    Popup: ({ children }) => <div data-tid='popup'>{children}</div>,
}));

jest.mock('frontend/components/renderings/PopUnder/components/PopUnderOfferOptions', () => () => (
    <div data-tid='pop-under-offer-options' />
));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const createProps = () => ({
    fields: {
        OfferSection: [
            { displayName: 'displayName', fields: { Icon: {}, Title: { value: 'title1' } }, id: 'id1', name: 'name1' },
        ],
        Title: { value: 'title' },
        Subtitle: { value: 'subtitle' },
        ButtonText: { value: 'button text' },
        BottomMark: { value: 'bottom mark' },
        Image: { value: { src: 'image1' } },
        DestinationTitle: { value: 'destination title {name}' },
        DestinationSubtitle: { value: 'destination subtitle {name}' },
        DestinationButtonText: { value: 'destination button text' },
        DestinationOfferSection: [
            { displayName: 'displayName', fields: { Icon: {}, Title: { value: 'title1' } }, id: 'id1', name: 'name1' },
        ],
        ExcludedDestinationsList: [{ fields: { Code: 'GRCR' } }],
        DestinationBottomMark: { value: 'destination bottom mark' },
    },
    wasRerendered: true,
});

const createStores = () => ({
    appStore: { isScreenLessMedium: false, wasPopunderShown: false, setWasPopunderShown: jest.fn() },
    layoutStore: { isEditMode: false },
    queryParamStore: {
        utmParams: {
            [UtmOptions.utm_content]: MixedResultsUtm.utm_content,
            [UtmOptions.utm_campaign]: MixedResultsUtm.utm_campaign,
            [UtmOptions.utm_term]: MixedResultsUtm.utm_term,
        },
        shouldShowPopunder: jest.fn(() => true),
    },
    searchStore: { updateOrder: jest.fn() },
    hotelsStore: { fetchOffers: jest.fn() },
    rootStore: {
        searchStore: {
            searchTo: {
                selectedDestinationCodes: ['test1'],
                selectedParentDestinationCodesQuery: 'test1',
                destinationsWithNames: [{ code: 'test1' }],
            },
        },
    },
    routerStore: { redirectTo: jest.fn() },
    notificationsStore: { toggleNotifications: jest.fn(), isAskNotificationsPostponed: false },
});

let mockProps;
let mockStores = createStores();

describe('<PopUnder />', () => {
    beforeEach(() => {
        jest.spyOn(destinationUtils, 'getIDestinationByCode').mockReturnValue({
            code: 'test',
            name: 'destination name',
        });
        mockProps = createProps();
        mockStores = createStores();
        bookingService.loadDestinationImage = jest.fn().mockReturnValue('image from api');
        jest.mocked(isHolidayStore).mockReturnValue(true);
    });

    it('should NOT render when fields NOT provided', async () => {
        mockProps.fields = null;
        const { container } = render(<PopUnder {...mockProps} />);

        await waitFor(() => expect(container).toBeEmptyDOMElement());
    });

    it('should NOT render when wasRerendered is false', async () => {
        mockProps.wasRerendered = false;
        const { container } = render(<PopUnder {...mockProps} />);

        await waitFor(() => expect(container).toBeEmptyDOMElement());
    });

    it('should NOT render when destinations with names NOT provided', async () => {
        mockStores.rootStore.searchStore.searchTo.destinationsWithNames = [];
        const { container } = render(<PopUnder {...mockProps} />);

        await waitFor(() => expect(container).toBeEmptyDOMElement());
    });

    it('should NOT render when screen is less medium', async () => {
        mockStores.appStore.isScreenLessMedium = true;
        const { container } = render(<PopUnder {...mockProps} />);

        await waitFor(() => expect(container).toBeEmptyDOMElement());
    });

    it('should NOT render when was popunder shown is true', async () => {
        mockStores.appStore.wasPopunderShown = true;
        const { container } = render(<PopUnder {...mockProps} />);

        await waitFor(() => expect(container).toBeEmptyDOMElement());
    });

    it('should render popup', async () => {
        const { getByTestId } = render(<PopUnder {...mockProps} />);

        await waitFor(() => expect(getByTestId('popup')).toBeInTheDocument());
    });

    it('should render background image with image1 when destination does NOT match searching', async () => {
        mockStores.rootStore.searchStore.searchTo.selectedDestinationCodes = [] as any;
        const { getByTestId } = render(<PopUnder {...mockProps} />);

        await waitFor(() =>
            expect(getByTestId('popunder-background')).toHaveAttribute(
                'style',
                'background-image: url(image1?mw=1920&mh=1080);',
            ),
        );
    });

    it('should render background image without image1 when destination matches searching', async () => {
        const { getByTestId } = render(<PopUnder {...mockProps} />);

        await waitFor(() => expect(getByTestId('popunder-background')).not.toHaveAttribute('style'));
    });

    it('should render background image with image1 when destination matches searching and loadDestinationImage returns null', async () => {
        bookingService.loadDestinationImage = jest.fn().mockReturnValue(null);
        const { getByTestId } = render(<PopUnder {...mockProps} />);

        await waitFor(() =>
            expect(getByTestId('popunder-background')).toHaveAttribute(
                'style',
                'background-image: url(image1?mw=1920&mh=1080);',
            ),
        );
    });

    it('should render content', async () => {
        const { getByTestId } = render(<PopUnder {...mockProps} />);

        await waitFor(() => expect(getByTestId('popunder-content')).toBeInTheDocument());
    });

    describe('Title', () => {
        it('should render destination title', async () => {
            const { getByRole } = render(<PopUnder {...mockProps} />);

            await waitFor(() => expect(getByRole('heading')).toHaveTextContent('destination title destination name'));
        });

        it('should render normal title when is edit mode', async () => {
            mockStores.layoutStore.isEditMode = true;
            const { getByRole } = render(<PopUnder {...mockProps} />);

            await waitFor(() => expect(getByRole('heading')).toHaveTextContent('title'));
        });

        it('should render normal title when destination does NOT match searching', async () => {
            mockStores.rootStore.searchStore.searchTo.selectedDestinationCodes = [] as any;
            const { getByRole } = render(<PopUnder {...mockProps} />);

            await waitFor(() => expect(getByRole('heading')).toHaveTextContent('title'));
        });
    });

    describe('Subtitle', () => {
        it('should render destination subtitle', async () => {
            const { getByText } = render(<PopUnder {...mockProps} />);

            await waitFor(() => expect(getByText('destination subtitle destination name')).toBeInTheDocument());
        });

        it('should render normal subtitle when is edit mode', async () => {
            mockStores.layoutStore.isEditMode = true;
            const { getByText } = render(<PopUnder {...mockProps} />);

            await waitFor(() => expect(getByText('subtitle')).toBeInTheDocument());
        });

        it('should render normal subtitle when destination does NOT match searching', async () => {
            mockStores.rootStore.searchStore.searchTo.selectedDestinationCodes = [] as any;
            const { getByText } = render(<PopUnder {...mockProps} />);

            await waitFor(() => expect(getByText('subtitle')).toBeInTheDocument());
        });
    });

    describe('PopUnderOfferOptions', () => {
        it('should render PopUnderOfferOptions', async () => {
            const { getByTestId } = render(<PopUnder {...mockProps} />);

            await waitFor(() => expect(getByTestId('pop-under-offer-options')).toBeInTheDocument());
        });

        it('should NOT render PopUnderOfferOptions when destination offer options NOT provided', async () => {
            mockProps.fields.DestinationOfferSection = [];
            const { queryByTestId } = render(<PopUnder {...mockProps} />);

            await waitFor(() => expect(queryByTestId('pop-under-offer-options')).not.toBeInTheDocument());
        });

        it('should render PopUnderOfferOptions', async () => {
            mockStores.layoutStore.isEditMode = true;
            const { getByTestId } = render(<PopUnder {...mockProps} />);

            await waitFor(() => expect(getByTestId('pop-under-offer-options')).toBeInTheDocument());
        });

        it('should NOT render PopUnderOfferOptions when offer options NOT provided', async () => {
            mockProps.fields.OfferSection = [];
            mockStores.rootStore.searchStore.searchTo.selectedDestinationCodes = [] as any;
            const { queryByTestId } = render(<PopUnder {...mockProps} />);

            await waitFor(() => expect(queryByTestId('pop-under-offer-options')).not.toBeInTheDocument());
        });
    });

    describe('Button', () => {
        it('should render destination button', async () => {
            const { getByRole } = render(<PopUnder {...mockProps} />);

            await waitFor(() => expect(getByRole('button')).toHaveTextContent('destination button text'));
        });

        it('should call updateOrder, fetchOffers and setWasPopunderShown on button click', async () => {
            render(<PopUnder {...mockProps} />);

            const button = await waitFor(() => screen.getByRole('button'));
            userEvent.click(button);
            await waitFor(() => {
                expect(mockStores.searchStore.updateOrder).toHaveBeenCalled();
                expect(mockStores.hotelsStore.fetchOffers).toHaveBeenCalled();
                expect(mockStores.appStore.setWasPopunderShown).toHaveBeenCalled();
                expect(mockStores.notificationsStore.toggleNotifications).not.toHaveBeenCalled();
            });
        });

        it('should call toggleNotifications on button click when isAskNotificationsPostponed is true', async () => {
            mockStores.notificationsStore.isAskNotificationsPostponed = true;
            render(<PopUnder {...mockProps} />);

            const button = await waitFor(() => screen.getByRole('button'));
            userEvent.click(button);
            await waitFor(() => {
                expect(mockStores.notificationsStore.toggleNotifications).toHaveBeenCalled();
            });
        });

        it('should NOT call toggleNotifications on button click on Trade Portal', async () => {
            jest.mocked(isHolidayStore).mockReturnValueOnce(false);
            render(<PopUnder {...mockProps} />);

            const button = await waitFor(() => screen.getByRole('button'));
            userEvent.click(button);

            await waitFor(() => {
                expect(mockStores.notificationsStore.toggleNotifications).not.toHaveBeenCalled();
            });
        });

        it('should render button with normal text when is edit mode', async () => {
            mockStores.layoutStore.isEditMode = true;
            const { getByRole } = render(<PopUnder {...mockProps} />);

            await waitFor(() => expect(getByRole('button')).toHaveTextContent('button text'));
        });

        it('should render button with normal text when destination does NOT match searching', async () => {
            mockStores.rootStore.searchStore.searchTo.selectedDestinationCodes = [] as any;
            const { getByRole } = render(<PopUnder {...mockProps} />);

            await waitFor(() => expect(getByRole('button')).toHaveTextContent('button text'));
        });
    });

    describe('Bottom mark', () => {
        it('should render destination bottom mark', async () => {
            const { getByText } = render(<PopUnder {...mockProps} />);

            await waitFor(() => expect(getByText('destination bottom mark')).toBeInTheDocument());
        });

        it('should render normal bottom mark when is edit mode', async () => {
            mockStores.layoutStore.isEditMode = true;
            const { getByText } = render(<PopUnder {...mockProps} />);

            await waitFor(() => expect(getByText('bottom mark')).toBeInTheDocument());
        });

        it('should render normal bottom mark when destination does NOT match searching', async () => {
            mockStores.rootStore.searchStore.searchTo.selectedDestinationCodes = [] as any;
            const { getByText } = render(<PopUnder {...mockProps} />);

            await waitFor(() => expect(getByText('bottom mark')).toBeInTheDocument());
        });
    });

    describe('Text Content styles', () => {
        it('should render popUnderContentPadding class when search is NOT matching destinations and bottom mark is NOT provided ', async () => {
            mockProps.fields.BottomMark = null;
            mockStores.layoutStore.isEditMode = true;
            const { container } = render(<PopUnder {...mockProps} />);

            await waitFor(() =>
                expect(container.getElementsByClassName(styles.popUnderContentPadding)).toHaveLength(1),
            );
        });

        it('should render popUnderContentPadding class when search is matching destinations and destination bottom mark is NOT provided ', async () => {
            mockProps.fields.DestinationBottomMark = null;
            const { container } = render(<PopUnder {...mockProps} />);

            await waitFor(() =>
                expect(container.getElementsByClassName(styles.popUnderContentPadding)).toHaveLength(1),
            );
        });
    });
});
