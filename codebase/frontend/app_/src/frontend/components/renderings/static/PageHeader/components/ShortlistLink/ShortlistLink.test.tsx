import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import ShortlistLink, {
    IShortlistLinkProps,
} from 'frontend/components/renderings/static/PageHeader/components/ShortlistLink/ShortlistLink';

jest.mock('frontend/components/icons/Heart', () => ({
    __esModule: true,
    default: ({ className }) => <svg data-tid='icon-heart' className={className} />,
}));

jest.mock('frontend/components/renderings/SearchResults/components/BookingInShortlistPopup', () => ({
    __esModule: true,
    default: () => <svg data-tid='booking-in-shortlist-popup' />,
}));

let mockUseMoreThenTabletViewport = true;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMoreThenTabletViewport: () => mockUseMoreThenTabletViewport,
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/Button', () => ({ children, dataTid, onClick }) => (
    <button data-tid={dataTid} onClick={onClick}>
        {children}
    </button>
));

const createProps = (): IShortlistLinkProps => ({
    onClick: jest.fn(),
});

const createStores = () =>
    createMockStores({
        userStore: { isLoggedIn: false },
        shortlistStore: {
            isShowBookingInShortlistPopup: false,
            savedOffersCount: 0,
            savePageBreadcrumbs: jest.fn(),
            setRedirectToShortlistPage: jest.fn(),
            toggleShowLoginPopup: jest.fn(),
            isShortlistEnabled: true,
        },
        routerStore: {
            redirectToShortlistNoResultsPage: jest.fn(),
            redirectToShortlistPage: jest.fn(),
        },
    });

let props;
let mockStores;

describe('<ShortlistLink />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createStores();
        mockUseMoreThenTabletViewport = true;
    });

    it('should NOT render component when isShortlistEnabled is false', () => {
        mockStores.shortlistStore.isShortlistEnabled = false;
        const { container } = render(<ShortlistLink {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('Standard rendering', () => {
        render(<ShortlistLink {...props} />);

        expect(screen.getByTestId('shortlist-link')).toBeInTheDocument();
    });

    describe('icon', () => {
        it('should render active Heart icon when user has saved packages', () => {
            mockStores.shortlistStore.savedOffersCount = 1;
            render(<ShortlistLink {...props} />);
            expect(screen.getByTestId('icon-heart')).toHaveClass('active');
        });

        it('should render non-active Heart icon when user does not have saved packages', () => {
            render(<ShortlistLink {...props} />);

            expect(screen.getByTestId('icon-heart')).not.toHaveClass('active');
            expect(screen.queryByTestId('saved-offers-count')).not.toBeInTheDocument();
        });

        it('not render count of shortlisted items when savedOffersCount is null', () => {
            mockStores.shortlistStore.savedOffersCount = null;
            render(<ShortlistLink {...props} />);

            expect(screen.queryByTestId('saved-offers-count')).not.toBeInTheDocument();
        });

        it('should render count of saved offers on icon', () => {
            mockStores.shortlistStore.savedOffersCount = 1;
            render(<ShortlistLink {...props} />);

            expect(screen.getByTestId('saved-offers-count')).toHaveTextContent('1');
        });

        it('should render 99+ label on shortlist icon when user has more then 99 saved items', () => {
            mockStores.shortlistStore.savedOffersCount = 100;
            render(<ShortlistLink {...props} />);

            expect(screen.getByTestId('saved-offers-count')).toHaveTextContent('99+');
        });

        it('should render 9+ label on shortlist icon when screen is tablet or less and user has more then 9 saved items', () => {
            mockUseMoreThenTabletViewport = false;
            mockStores.shortlistStore.savedOffersCount = 12;
            render(<ShortlistLink {...props} />);

            expect(screen.getByTestId('saved-offers-count')).toHaveTextContent('9+');
        });
    });

    describe('BookingInShortlistPopup', () => {
        it('should render BookingInShortlistPopup on more then tablet screen when isShowBookingInShortlistPopup is true', () => {
            mockStores.shortlistStore.isShowBookingInShortlistPopup = true;
            render(<ShortlistLink {...props} />);

            expect(screen.getByTestId('booking-in-shortlist-popup')).toBeInTheDocument();
        });

        it('should NOT render BookingInShortlistPopup when screen is tablet or less', () => {
            mockStores.shortlistStore.isShowBookingInShortlistPopup = true;
            mockUseMoreThenTabletViewport = false;
            render(<ShortlistLink {...props} />);

            expect(screen.queryByTestId('booking-in-shortlist-popup')).not.toBeInTheDocument();
        });

        it('should NOT render BookingInShortlistPopup when isShowBookingInShortlistPopup is false', () => {
            mockStores.shortlistStore.isShowBookingInShortlistPopup = false;
            render(<ShortlistLink {...props} />);

            expect(screen.queryByTestId('booking-in-shortlist-popup')).not.toBeInTheDocument();
        });
    });

    it('should redirect to empty shortlist page when user logged in and do NOT have saved packages', () => {
        mockStores.userStore.isLoggedIn = true;
        mockStores.shortlistStore.savedOffersCount = 0;
        render(<ShortlistLink {...props} />);

        fireEvent.click(screen.getByTestId('shortlist-link'));

        expect(mockStores.routerStore.redirectToShortlistNoResultsPage).toBeCalled();
        expect(props.onClick).toBeCalled();
        expect(mockStores.shortlistStore.toggleShowLoginPopup).not.toBeCalled();
    });

    it('should redirect to shortlist page when user logged in and have saved packages', () => {
        mockStores.userStore.isLoggedIn = true;
        mockStores.shortlistStore.savedOffersCount = 1;
        render(<ShortlistLink {...props} />);

        fireEvent.click(screen.getByTestId('shortlist-link'));

        expect(mockStores.routerStore.redirectToShortlistPage).toBeCalled();
        expect(mockStores.shortlistStore.toggleShowLoginPopup).not.toBeCalled();
    });

    it('should open login popup when user NOT logged in', () => {
        mockStores.userStore.isLoggedIn = false;
        render(<ShortlistLink {...props} />);

        fireEvent.click(screen.getByTestId('shortlist-link'));

        expect(mockStores.shortlistStore.setRedirectToShortlistPage).toBeCalled();
        expect(mockStores.shortlistStore.toggleShowLoginPopup).toBeCalled();
    });
});
