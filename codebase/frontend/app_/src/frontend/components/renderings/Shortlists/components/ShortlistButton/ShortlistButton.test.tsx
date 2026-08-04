import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import * as utils from 'frontend/hooks/useMediaQuery';
import { IHotel } from 'models/data/IHotel';
import { IOffer } from 'models/data/IOffer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import ShortlistButton, {
    IShortlistButtonProps,
} from 'frontend/components/renderings/Shortlists/components/ShortlistButton/ShortlistButton';

const mockTooltipContentProps = jest.fn();
jest.mock('frontend/components/common/Tooltip', () => ({
    Tooltip: ({ children }) => <div data-tid='tooltip'>{children}</div>,
    TooltipTrigger: ({ children }) => <>{children}</>,
    TooltipContent: props => {
        mockTooltipContentProps(props);

        return <div data-tid='content' />;
    },
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/icons/Heart', () => ({
    __esModule: true,
    default: ({ className }) => <svg data-tid='icon-heart' className={className} />,
}));

const mockButtonComponent = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockButtonComponent(props);

        return (
            <button onClick={props.onClick} data-tid='button'>
                {children}
            </button>
        );
    },
}));

const offerId = 'offer-id';
const hotelName = 'Super Hotel';

const createProps = (): IShortlistButtonProps => ({
    offer: {
        id: offerId,
        hotel: { name: hotelName } as Nullable<IHotel>,
        shortlist: { id: 'shortListId' },
    } as IOffer,
});
const createStores = () =>
    createMockStores({
        shortlistStore: {
            onAddToShortlist: jest.fn(),
            onRemoveFromShortlist: jest.fn(),
            setCandidate: jest.fn(),
            candidate: null,
        },
    });

let props;
let mockStores = createStores();

describe('<ShortlistButton />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createStores();
    });

    it('should render active icon heart when offer is added to shortlist', () => {
        render(<ShortlistButton {...props} />);

        expect(screen.getByTestId('button')).toBeInTheDocument();
        expect(screen.getByTestId('icon-heart')).toHaveClass('active');
        expect(screen.getByTestId('tooltip')).toBeInTheDocument();
        expect(mockButtonComponent).toHaveBeenCalledWith({
            'aria-label': SitecoreDictionary.ShortlistButtonsRemoveFromShortlist,
            className: 'button',
            'data-tid': 'shortlist-heart-button',
            id: 'SuperHotel_offer-id',
            isText: true,
            onClick: expect.any(Function),
        });

        expect(screen.getByTestId('content')).toBeInTheDocument();
        expect(mockTooltipContentProps).toHaveBeenCalledWith({
            className: 'contentWrapper priority',
            text: SitecoreDictionary.SearchResultsLabelsRemoveFromShortlist,
        });
    });

    it('should render button with shortlist id if offerId is undefined', () => {
        props.offer.id = undefined;
        render(<ShortlistButton {...props} />);

        expect(mockButtonComponent).toHaveBeenCalledWith({
            'aria-label': SitecoreDictionary.ShortlistButtonsRemoveFromShortlist,
            className: 'button',
            'data-tid': 'shortlist-heart-button',
            id: 'SuperHotel_shortListId',
            isText: true,
            onClick: expect.any(Function),
        });
    });

    it('should render non-active heart icon when offer is not added to shortlist', () => {
        mockStores.layoutStore.isHotelDetailsBookPage = true;

        delete props.offer.shortlist.id;

        render(<ShortlistButton {...props} />);

        expect(screen.getByTestId('button')).toBeInTheDocument();
        expect(screen.getByTestId('icon-heart')).not.toHaveClass('active');
        expect(screen.getByTestId('tooltip')).toBeInTheDocument();
        expect(mockButtonComponent).toHaveBeenCalledWith({
            'aria-label': SitecoreDictionary.ShortlistButtonsAddToShortlist,
            className: 'button',
            'data-tid': 'shortlist-heart-button',
            id: 'SuperHotel_offer-id',
            isText: true,
            onClick: expect.any(Function),
        });
    });

    it('should not have tooltip if screen is small', () => {
        jest.spyOn(utils, 'useMoreThenDesktopViewport').mockReturnValue(false);

        render(<ShortlistButton {...props} />);

        expect(screen.queryByTestId('tooltip')).toBeNull();
    });

    it('should NOT render component on the hotel details browse page preview', () => {
        mockStores.layoutStore.isHotelDetailsBrowsePagePreview = true;

        const { container } = render(<ShortlistButton {...props} />);

        expect(container).toBeEmptyDOMElement();
    });
});
