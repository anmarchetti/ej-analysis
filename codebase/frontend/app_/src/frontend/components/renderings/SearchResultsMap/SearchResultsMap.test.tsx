import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { SearchResultsMap } from 'frontend/components/renderings/SearchResultsMap/SearchResultsMap';

import * as searchResultsMapUtils from './SearchResultsMap.utils';
import { ISearchResultsMapFields, IUseSearchResultsMap, TSearchResultsMapProps } from './SearchResultsMap.utils';

const mockButtonComponent = jest.fn();

jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: props => {
        mockButtonComponent(props);

        return <button data-tid='button' />;
    },
}));

jest.mock('frontend/components/common/JSSImage', () => ({
    __esModule: true,
    default: () => <div data-tid='jss-image' />,
}));

const mockMapPopupComponent = jest.fn();

jest.mock('frontend/components/common/MapPopup/MapPopup', () => ({
    __esModule: true,
    default: props => {
        mockMapPopupComponent(props);

        return <div data-tid='map-popup' />;
    },
}));

let mockUseMobileViewport = false;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMobileViewport: () => mockUseMobileViewport,
}));

let props: TSearchResultsMapProps;

const preparedData: IUseSearchResultsMap = {
    button: { isText: true, isOutlined: false, onClick: jest.fn(), title: mockSitecoreField('desktop-title') },
    popup: {
        isMapPopupShown: false,
        onCloseMapPopup: jest.fn(),
    },
    isDisplayed: true,
    iconWrapperStyle: {},
    isLoading: false,
};

const useSearchResultMap = jest.spyOn(searchResultsMapUtils, 'default').mockReturnValue(preparedData);

describe('<SearchResultsMap />', () => {
    beforeEach(() => {
        props = {
            fields: {
                DesktopButton: mockSitecoreField('DesktopButton'),
                MobileButton: mockSitecoreField('MobileButton'),
                Icon: mockSitecoreField(mockSitecoreImageField('src')),
                IsSearchResultsMapButtonDisabled: mockSitecoreField(false),
            } as ISearchResultsMapFields,
            params: {} as any,
            rendering: {} as any,
        };
    });

    it('Should render component', () => {
        render(<SearchResultsMap {...props} />);

        const map = screen.getByTestId('search-results-map');

        expect(map).toBeInTheDocument();
        expect(map).toHaveAttribute('class', 'searchResultsMap advanced');
        expect(screen.getByTestId('button')).toBeInTheDocument();
        expect(screen.getByTestId('jss-image')).toBeInTheDocument();
    });

    it('should render map-shimmer when isLoading and isMobile are true', () => {
        mockUseMobileViewport = true;
        useSearchResultMap.mockReturnValueOnce({ ...preparedData, isLoading: true });

        render(<SearchResultsMap {...props} />);

        expect(screen.getByTestId('map-shimmer')).toBeInTheDocument();
    });

    it('should NOT render map-shimmer when isLoading is false', () => {
        mockUseMobileViewport = true;

        render(<SearchResultsMap {...props} />);

        expect(screen.queryByTestId('map-shimmer')).not.toBeInTheDocument();
    });

    it('should NOT render map-shimmer when isMobile is false', () => {
        mockUseMobileViewport = false;
        useSearchResultMap.mockReturnValueOnce({ ...preparedData, isLoading: true });

        render(<SearchResultsMap {...props} />);

        expect(screen.queryByTestId('map-shimmer')).not.toBeInTheDocument();
    });

    it('Should render component on mobile', () => {
        mockUseMobileViewport = true;
        render(<SearchResultsMap {...props} />);

        const map = screen.getByTestId('search-results-map');

        expect(map).toBeInTheDocument();
        expect(map).toHaveAttribute('class', 'searchResultsMap');
    });

    it('should be rendered when isDisplayed is true', () => {
        const { container } = render(<SearchResultsMap {...props} />);

        expect(container).toBeInTheDocument();
        expect(screen.getByTestId('button')).toBeInTheDocument();
        expect(screen.getByTestId('jss-image')).toBeInTheDocument();

        expect(mockButtonComponent).toHaveBeenCalledWith({
            children: 'desktop-title',
            dataTid: 'search-results-map-show-button',
            isOutlined: false,
            isText: true,
            onClick: preparedData.button.onClick,
        });
    });

    it('should NOT be rendered when isDisplayed is false', () => {
        useSearchResultMap.mockReturnValueOnce({ ...preparedData, isDisplayed: false });

        const { container } = render(<SearchResultsMap {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    describe('MapPopup', () => {
        it('should be rendered when isMapPopupShown is true', () => {
            useSearchResultMap.mockReturnValueOnce({
                ...preparedData,
                popup: { ...preparedData.popup, isMapPopupShown: true },
            });

            render(<SearchResultsMap {...props} />);

            expect(screen.getByTestId('map-popup')).toBeEmptyDOMElement();
            expect(mockMapPopupComponent).toHaveBeenCalledWith({
                onCloseMapPopup: preparedData.popup.onCloseMapPopup,
            });
        });

        it('should NOT be rendered when isMapPopupShown is false', () => {
            render(<SearchResultsMap {...props} />);

            expect(screen.queryByTestId('map-popup')).not.toBeInTheDocument();
            expect(mockMapPopupComponent).not.toHaveBeenCalled();
        });
    });
});
