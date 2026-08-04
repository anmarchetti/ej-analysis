import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockInboundFlight, mockOutboundFlight } from 'frontend/__mocks__';
import { useMoreThenTabletViewport } from 'frontend/hooks/useMediaQuery';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { scrollToElement } from 'frontend/utils/ui.utils';
import { IRoute } from 'models/data/IRoute';
import { CalloutOrientation, CalloutPosition } from 'models/enum/Callout';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import MultipleFlightReferenceItem from './MultipleFlightReferenceItem';

jest.mock('frontend/utils/ui.utils', () => ({
    scrollToElement: jest.fn(),
}));

jest.mock('frontend/hooks/useMediaQuery', () => ({
    useMoreThenTabletViewport: jest.fn(() => true),
}));

const createStores = () => ({
    layoutStore: {
        getPhrase: (key: string) => key,
        isEditMode: false,
        basePath: '/',
    },
    routerStore: {
        redirectTo: jest.fn(),
    },
    appStore: {
        toggleOfferConditions: jest.fn(),
    },
});

let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockCallout = jest.fn();
jest.mock('frontend/components/common/Callout/Callout', () => ({
    __esModule: true,
    default: props => {
        mockCallout(props);
        const content = typeof props.content === 'function' ? props.content(jest.fn()) : props.content;

        return (
            <div data-tid='callout'>
                {props.children}
                {content}
            </div>
        );
    },
}));

const mockBookingRefDropdownContent = jest.fn();
jest.mock(
    'frontend/components/renderings/BookingDownloadBanner/components/DropdownContent/BookingRefDropdownContent',
    () => ({
        __esModule: true,
        default: props => {
            mockBookingRefDropdownContent(props);

            return <div data-tid='booking-ref-dropdown-content' />;
        },
    }),
);

const mockRichTextWithLinks = jest.fn();
jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: props => {
        mockRichTextWithLinks(props);

        return <div data-tid='rich-text-with-links'>{props.field?.value}</div>;
    },
}));

const mockRichTextDictionary = jest.fn();
jest.mock('frontend/components/common/RichTextDictionary', () => ({
    __esModule: true,
    default: props => {
        mockRichTextDictionary(props);

        return <div data-tid='rich-text-dictionary'>{props.dictionaryKey}</div>;
    },
}));

const mockReferenceItem = jest.fn();
jest.mock('../ReferenceItem/ReferenceItem', () => ({
    __esModule: true,
    default: props => {
        mockReferenceItem(props);

        return <div data-tid='reference-item'>{props.children}</div>;
    },
}));

const mockRoutes: IRoute[] = [mockOutboundFlight, mockInboundFlight];

describe('<MultipleFlightReferenceItem />', () => {
    beforeEach(() => {
        mockStores = createStores();
    });

    it('should render flight references title', () => {
        render(<MultipleFlightReferenceItem flights={mockRoutes} />);

        expect(screen.getByTestId('multiple-ref-title')).toHaveTextContent(
            SitecoreDictionary.BookingHeaderLabelsFlightReferences,
        );
    });

    it('should render info icon with tooltip', () => {
        render(<MultipleFlightReferenceItem flights={mockRoutes} />);

        const callouts = screen.getAllByTestId('callout');
        expect(callouts.length).toBeGreaterThan(0);
    });

    it('should render callout with dropdown content', () => {
        render(<MultipleFlightReferenceItem flights={mockRoutes} />);

        const callouts = screen.getAllByTestId('callout');
        expect(callouts).toHaveLength(2);
        expect(mockCallout).toHaveBeenCalled();
    });

    it('should render callout with correct props', () => {
        render(<MultipleFlightReferenceItem flights={mockRoutes} />);

        expect(mockCallout).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({
                className: 'ms-2',
                orientation: CalloutOrientation.Top,
                position: CalloutPosition.IconLeft,
                isShownOnHover: true,
            }),
        );

        expect(mockRichTextDictionary).toHaveBeenCalledWith(
            expect.objectContaining({
                dictionaryKey: SitecoreDictionary.BookingHeaderLabelsMultipleFlightRefTitle,
                className: 'tooltipText',
            }),
        );

        expect(mockCallout).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({
                orientation: CalloutOrientation.Bottom,
                position: CalloutPosition.Center,
                className: 'callout',
                drawerTitleClassName: 'drawerTitle',
                isDrawerVariant: false,
                drawerTitle: { value: SitecoreDictionary.BookingHeaderLabelsMultipleFlightReferences },
                isCTAOutlined: true,
                footerClassName: 'drawerFooter',
            }),
        );
    });

    it('should pass ScrollToSeeFullReferences to dropdown content', () => {
        const scrollField = mockSitecoreField('Scroll to see full references');

        render(<MultipleFlightReferenceItem flights={mockRoutes} scrollToSeeFullReferences={scrollField} />);

        expect(mockBookingRefDropdownContent).toHaveBeenCalledWith(
            expect.objectContaining({
                helpText: scrollField,
            }),
        );
    });

    it('should render BookingRefDropdownContent when callout content is rendered', () => {
        jest.mocked(useMoreThenTabletViewport).mockReturnValue(false);

        render(<MultipleFlightReferenceItem flights={mockRoutes} />);

        expect(mockBookingRefDropdownContent).toHaveBeenCalledWith(
            expect.objectContaining({
                bookingRoutes: mockRoutes,
            }),
        );
    });

    it('should handle link click and scroll to element', () => {
        const mockSection = document.createElement('div');
        mockSection.id = 'test-section';
        jest.spyOn(document, 'getElementById').mockReturnValue(mockSection);

        render(<MultipleFlightReferenceItem flights={mockRoutes} />);

        expect(mockBookingRefDropdownContent).toHaveBeenCalled();
        const onLinkClick = mockBookingRefDropdownContent.mock.calls[0][0].onLinkClick;

        const mockEvent = {
            preventDefault: jest.fn(),
            stopPropagation: jest.fn(),
            target: { href: 'http://example.com#test-section' },
        } as unknown as MouseEvent;

        onLinkClick(mockEvent);

        expect(mockEvent.preventDefault).toHaveBeenCalled();
        expect(mockEvent.stopPropagation).toHaveBeenCalled();
        expect(scrollToElement).toHaveBeenCalledWith(mockSection, 0);
    });

    it('should not scroll if href does not contain hash', () => {
        render(<MultipleFlightReferenceItem flights={mockRoutes} />);

        const onLinkClick = mockBookingRefDropdownContent.mock.calls[0][0].onLinkClick;
        const mockEvent = {
            preventDefault: jest.fn(),
            stopPropagation: jest.fn(),
            target: { href: 'http://example.com' },
        } as unknown as MouseEvent;

        onLinkClick(mockEvent);

        expect(scrollToElement).not.toHaveBeenCalled();
    });

    it('should render with button text for multiple references', () => {
        render(<MultipleFlightReferenceItem flights={mockRoutes} />);

        expect(mockReferenceItem).toHaveBeenCalledWith(
            expect.objectContaining({
                dataTid: 'multiple-flight-ref',
                title: SitecoreDictionary.BookingHeaderLabelsFlightReferences,
            }),
        );

        expect(screen.getByTestId('reference-item')).toHaveTextContent(
            SitecoreDictionary.BookingHeaderLabelsMultipleReferences,
        );
    });
});
