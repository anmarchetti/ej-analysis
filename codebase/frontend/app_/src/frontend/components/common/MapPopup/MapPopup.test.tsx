import { fireEvent, render, screen } from '@testing-library/react';

import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import MapPopup from './MapPopup';
import * as mapPopupUtils from './MapPopup.utils';
import { IMapPopupProps } from './MapPopup.utils';

const mockPopupComponent = jest.fn();
jest.mock('frontend/components/common/Popup', () => ({
    __esModule: true,
    Popup: ({ children, ...props }) => {
        mockPopupComponent(props);

        return <div data-tid='popup'>{children}</div>;
    },
}));

jest.mock('frontend/components/common/LeftHandFilter', () => ({
    __esModule: true,
    default: () => <div data-tid='left-hand-filter' />,
}));

jest.mock('frontend/components/common/MobileFilterModal/MobileFilterModal', () => ({
    __esModule: true,
    default: () => <div data-tid='mobile-filter-modal' />,
}));

const mockMapComponent = jest.fn();
jest.mock('frontend/components/common/MapComponent/MapComponent', () => ({
    __esModule: true,
    default: props => {
        mockMapComponent(props);

        return <div data-tid='map' />;
    },
}));

const mockLoadingAnimation = jest.fn();
jest.mock('frontend/components/common/LoadingAnimation/LoadingAnimation', () => ({
    __esModule: true,
    default: props => {
        mockLoadingAnimation(props);

        return <div data-tid='loading-animation' />;
    },
}));

const preparedData: mapPopupUtils.IMapPopupData = {
    isLoading: false,
    onOpen: jest.fn(),
    onClose: jest.fn(),
    getPhrase: jest.fn(p => p),
    isMobile: false,
    map: {
        hotels: [],
        defaultZoom: 4,
        gestureHandling: 'greedy',
        zoomControlPosition: 9,
        onSaveState: jest.fn(),
        restoreState: jest.fn(() => null),
    },
    leftHandFilters: {
        isCollapsed: false,
        isOnMapPopup: true,
    },
    mobileFilterModal: {
        onClose: jest.fn(),
        map: true,
        isMobileFilterModalShown: false,
    },
    amount: 0,
};

const useMapPopup = jest.spyOn(mapPopupUtils, 'default').mockReturnValue(preparedData);

const props: IMapPopupProps = {
    onCloseMapPopup: jest.fn(),
};

describe('<MapPopup />', () => {
    it('should render Popup', () => {
        render(<MapPopup {...props} />);

        expect(screen.getByTestId('popup')).toBeInTheDocument();
        expect(mockPopupComponent).toHaveBeenCalledWith({
            bodyClass: 'body',
            containerClass: 'container',
            contentClass: 'content',
            dialogClass: 'dialog',
            withPortal: true,
        });
    });

    describe('LeftHandFilter', () => {
        it('should be rendered when isScreenLessMedium is false', () => {
            render(<MapPopup {...props} />);

            expect(screen.getByTestId('left-hand-filter')).toBeInTheDocument();
        });
    });

    describe('MobileFilterModal', () => {
        it('should be rendered when isMobileFilterModalShown is true', () => {
            useMapPopup.mockReturnValueOnce({
                ...preparedData,
                mobileFilterModal: {
                    ...preparedData.mobileFilterModal,
                    isMobileFilterModalShown: true,
                },
            });

            render(<MapPopup {...props} />);

            expect(screen.getByTestId('mobile-filter-modal')).toBeInTheDocument();
            expect(screen.queryByTestId('map')).toBeInTheDocument();
        });

        it('should NOT be rendered when either isScreenLessMedium or isShown is true', () => {
            render(<MapPopup {...props} />);

            expect(screen.queryByTestId('mobile-filter-modal')).not.toBeInTheDocument();
        });
    });

    describe('Filters button', () => {
        it('should be rendered when isScreenLessMedium is true', () => {
            useMapPopup.mockReturnValueOnce({
                ...preparedData,
                isMobile: true,
            });

            render(<MapPopup {...props} />);

            expect(screen.getByTestId('filters-button')).toBeInTheDocument();
        });

        it('should render amount when selectedFiltersNumber is greater 0', () => {
            useMapPopup.mockReturnValueOnce({
                ...preparedData,
                isMobile: true,
                amount: 22,
            });

            render(<MapPopup {...props} />);

            expect(screen.getByText('22')).toBeInTheDocument();
        });
    });

    it('should call onClick when close-button is clicked', () => {
        render(<MapPopup {...props} />);

        const button = screen.getByTestId('close-button') as Element;

        fireEvent.click(button);

        expect(preparedData.onClose).toHaveBeenCalled();
    });

    it('should render Map without loading animation when isLoading is false', () => {
        render(<MapPopup {...props} />);

        expect(screen.getByText(SitecoreDictionary.DestinationsButtonsExitMap)).toBeInTheDocument();
        expect(screen.getByTestId('map')).toBeInTheDocument();
        expect(screen.queryByTestId('loading-animation')).not.toBeInTheDocument();
        expect(screen.queryByTestId('map-popup-loader-overlay')).not.toBeInTheDocument();

        expect(mockMapComponent).toHaveBeenCalledWith(preparedData.map);
    });

    it('should render loading animation when isLoading is true', () => {
        useMapPopup.mockReturnValue({ ...preparedData, isLoading: true });

        render(<MapPopup {...props} />);

        expect(screen.getByTestId('loading-animation')).toBeInTheDocument();
        expect(screen.getByTestId('map-popup-loader-overlay')).toBeInTheDocument();
        expect(mockLoadingAnimation).toHaveBeenCalledWith({
            isCentered: true,
            className: 'animationWrapper',
        });
    });
});
