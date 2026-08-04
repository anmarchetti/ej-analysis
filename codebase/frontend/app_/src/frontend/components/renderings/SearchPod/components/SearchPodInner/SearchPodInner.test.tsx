import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { SearchBarDropdown } from 'models/enum/SearchBarDropdown';
import SearchPodAlternativeView from 'models/enum/SearchPodAlternativeView';
import { TSitecoreCheckboxValue } from 'models/sitecore/generic/SitecoreCheckboxValue';

import { SearchPodInner } from './SearchPodInner';

const mockSearchBarProps = jest.fn();
jest.mock('frontend/components/renderings/SearchPod/components/SearchBar/SearchBar', () => props => {
    mockSearchBarProps(props);

    return <button data-tid='search-bar-submit' onClick={props.onSubmit} />;
});

jest.mock(
    'frontend/components/renderings/SearchPod/components/SearchParametersPreview/SearchParametersPreview',
    () => props =>
        (
            <button
                data-tid='search-parameters-preview'
                onClick={e => {
                    e.stopPropagation();
                    props.onOpenSearchBarDropdown('WHEN');
                }}
            />
        ),
);

jest.mock('frontend/components/common/HeightAnimatedContainer/HeightAnimatedContainer', () => ({
    __esModule: true,
    default: ({ children, onExited, onEnter, isOpened }) => {
        if (isOpened) {
            onEnter?.();
        }

        return (
            <div data-tid='height-animated-container' onClick={onExited}>
                {isOpened && <div>{children}</div>}
            </div>
        );
    },
}));

const mockBackToSearchProps = jest.fn();
jest.mock(
    'frontend/components/renderings/SearchPod/components/BackToSearch/BackToSearch',
    () =>
        ({ onClickEdit, ...props }) => {
            mockBackToSearchProps(props);

            return (
                <div
                    data-tid='back-to-search'
                    onClick={e => {
                        e.stopPropagation();
                        onClickEdit();
                    }}
                />
            );
        },
);

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockDebounce = jest.fn();
jest.mock('frontend/utils/debounce', () => ({
    __esModule: true,
    debounce: (...params) => {
        mockDebounce(...params);

        return params[0];
    },
}));

const mockUseClickOutside = jest.fn();
jest.mock('frontend/hooks/useClickOutside', () => ({
    __esModule: true,
    default: (ref, handler) => {
        mockUseClickOutside(ref, handler);

        return ref;
    },
}));

const createProps = () =>
    ({
        fields: {} as any,
        params: {
            AlternativeView: undefined,
            ShowTitle: undefined as TSitecoreCheckboxValue,
        } as any,
        rendering: {} as any,
        freezeHeight: jest.fn(),
        resetHeight: jest.fn(),
    } as any);

let props;
let mockStores;

describe('SearchPodInner', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createMockStores({
            searchStore: {
                setIsSearchPodExpanded: jest.fn(),
                collectOriginsTitles: jest.fn(),
                isNeedOpenWhenField: false,
                setNeedOpenWhenField: jest.fn(),
                isOldParamSet: false,
                setOldSearchParamToSearchParam: jest.fn(),
                searchWho: {},
                searchFrom: {},
                searchWhen: {
                    updateCheapestMonthPrices: jest.fn(),
                    monthSearchDuration: 7,
                },
            },
            queryParamStore: {
                isReferer: false,
                needOpenSearchPodWhoField: jest.fn(() => false),
            },
            hotelsStore: {
                hasOffers: false,
            },
            layoutStore: {
                isHotelDetailsBookPage: false,
                isHotelPreview: true,
                isMobileAppHideFeatures: false,
            },
            bookingStore: {
                isGuestsParametersValid: true,
            },
        });
    });

    it('should call updateCheapestMonthPrices on mount', () => {
        render(<SearchPodInner {...props} />);

        expect(mockDebounce).toHaveBeenCalledWith(mockStores.searchStore.searchWhen.updateCheapestMonthPrices, 500);
        expect(mockStores.searchStore.searchWhen.updateCheapestMonthPrices).toHaveBeenCalled();
    });

    it('should re-call updateCheapestMonthPrices on monthSearchDuration changing', () => {
        const { rerender } = render(<SearchPodInner {...props} />);

        expect(mockStores.searchStore.searchWhen.updateCheapestMonthPrices).toHaveBeenCalled();

        mockStores.searchStore.searchWhen.monthSearchDuration = 3;

        rerender(<SearchPodInner {...props} />);

        expect(mockStores.searchStore.searchWhen.updateCheapestMonthPrices).toHaveBeenCalledTimes(2);
    });

    it('should re-call updateCheapestMonthPrices on isAutoAllocation changing', () => {
        const { rerender } = render(<SearchPodInner {...props} />);

        expect(mockStores.searchStore.searchWhen.updateCheapestMonthPrices).toHaveBeenCalled();

        mockStores.searchStore.searchWho.isAutoAllocation = true;

        rerender(<SearchPodInner {...props} />);

        expect(mockStores.searchStore.searchWhen.updateCheapestMonthPrices).toHaveBeenCalledTimes(2);
    });

    it('should render correctly', () => {
        render(<SearchPodInner {...props} />);

        expect(screen.getByTestId('search-bar-submit')).toBeInTheDocument();
        expect(screen.queryByTestId('search-parameters-preview')).not.toBeInTheDocument();
        expect(screen.queryByTestId('back-to-search')).not.toBeInTheDocument();
    });

    it('should render search bar with block = false when isShowTitle = 1', () => {
        props.params.ShowTitle = '1';
        render(<SearchPodInner {...props} />);

        expect(screen.getByTestId('search-bar-submit')).toBeInTheDocument();
        expect(mockSearchBarProps).toHaveBeenCalledWith(expect.objectContaining({ block: false }));
    });

    it('should NOT render component when isHotelDetailsBrowsePagePreview = true', () => {
        mockStores.layoutStore.isHotelDetailsBrowsePagePreview = true;

        const { container } = render(<SearchPodInner {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should open and validate who field if needOpenSearchPodWhoField = true and isReferer = false', async () => {
        mockStores.queryParamStore.needOpenSearchPodWhoField = jest.fn(() => true);
        mockStores.queryParamStore.isReferer = false;
        render(<SearchPodInner {...props} />);

        await userEvent.click(screen.getByTestId('search-pod-inner'));

        expect(screen.getByTestId('search-bar-submit')).toBeInTheDocument();
        expect(screen.queryByTestId('search-parameters-preview')).not.toBeInTheDocument();
        expect(screen.queryByTestId('back-to-search')).not.toBeInTheDocument();
        expect(mockSearchBarProps).toHaveBeenCalledWith(
            expect.objectContaining({
                selectedDropdown: SearchBarDropdown.Who,
            }),
        );
    });

    describe('alternative view', () => {
        it('should render search pod summarized view', () => {
            props.params.AlternativeView = SearchPodAlternativeView.SummarisedView;
            render(<SearchPodInner {...props} />);

            expect(screen.queryByTestId('search-bar-submit')).not.toBeInTheDocument();
            expect(screen.getByTestId('search-parameters-preview')).toBeInTheDocument();
            expect(screen.queryByTestId('back-to-search')).not.toBeInTheDocument();
        });

        it('should render search pod summarized view in edit mode', async () => {
            props.params.AlternativeView = SearchPodAlternativeView.SummarisedView;
            const { rerender } = render(<SearchPodInner {...props} />);

            await userEvent.click(screen.getByTestId('search-parameters-preview'));

            rerender(<SearchPodInner {...props} />);

            expect(screen.getByTestId('search-bar-submit')).toBeInTheDocument();
            expect(screen.queryByTestId('search-parameters-preview')).not.toBeInTheDocument();
            expect(screen.getByTestId('back-to-search')).toBeInTheDocument();
        });

        it('should render search pod Back To Search View', () => {
            props.params.AlternativeView = SearchPodAlternativeView.BackToSearchView;
            render(<SearchPodInner {...props} />);

            expect(screen.queryByTestId('search-bar-submit')).not.toBeInTheDocument();
            expect(screen.queryByTestId('search-parameters-preview')).not.toBeInTheDocument();
            expect(screen.getByTestId('back-to-search')).toBeInTheDocument();
            expect(mockBackToSearchProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    isBackButtonAvailable: true,
                }),
            );
        });

        it('should render search pod Back To Search View in edit mode', async () => {
            props.params.AlternativeView = SearchPodAlternativeView.BackToSearchView;
            render(<SearchPodInner {...props} />);

            await userEvent.click(screen.getByTestId('back-to-search'));

            expect(screen.getByTestId('search-bar-submit')).toBeInTheDocument();
            expect(screen.queryByTestId('search-parameters-preview')).not.toBeInTheDocument();
            expect(screen.getByTestId('back-to-search')).toBeInTheDocument();
            expect(mockBackToSearchProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    isBackButtonAvailable: true,
                }),
            );
        });

        it('should set Edit Mode when isNeedOpenWhenField is true and isEdit = false', async () => {
            props.params.AlternativeView = SearchPodAlternativeView.SummarisedView;
            mockStores.searchStore.isNeedOpenWhenField = true;
            render(<SearchPodInner {...props} />);

            expect(screen.getByTestId('search-bar-submit')).toBeInTheDocument();
            expect(screen.queryByTestId('search-parameters-preview')).not.toBeInTheDocument();
            expect(screen.queryByTestId('back-to-search')).toBeInTheDocument();
        });

        it('should not render search parameters preview if alternative view is Back To Search View', async () => {
            props.params.AlternativeView = SearchPodAlternativeView.BackToSearchView;
            mockStores.searchStore.isNeedOpenWhenField = true;
            render(<SearchPodInner {...props} />);

            expect(screen.queryByTestId('search-parameters-preview')).not.toBeInTheDocument();
        });

        it('should render search parameters preview if alternative view is Back To Search View on mobile apps', async () => {
            props.params.AlternativeView = SearchPodAlternativeView.BackToSearchView;
            mockStores.layoutStore.isMobileAppHideFeatures = true;
            render(<SearchPodInner {...props} />);

            expect(screen.getByTestId('search-parameters-preview')).toBeInTheDocument();
        });

        it('should render back-to-search button on mobile apps when in edit mode with BackToSearchView', async () => {
            props.params.AlternativeView = SearchPodAlternativeView.BackToSearchView;
            mockStores.layoutStore.isMobileAppHideFeatures = true;

            const { rerender } = render(<SearchPodInner {...props} />);

            // Initially in preview mode on mobile
            expect(screen.getByTestId('search-parameters-preview')).toBeInTheDocument();
            expect(screen.queryByTestId('back-to-search')).not.toBeInTheDocument();

            // Click to enter edit mode
            await userEvent.click(screen.getByTestId('search-parameters-preview'));

            rerender(<SearchPodInner {...props} />);

            // Back-to-search button should now be visible on mobile
            expect(screen.getByTestId('back-to-search')).toBeInTheDocument();
            expect(screen.queryByTestId('search-parameters-preview')).not.toBeInTheDocument();
        });

        it('should toggle between preview and back-to-search on mobile apps', async () => {
            props.params.AlternativeView = SearchPodAlternativeView.BackToSearchView;
            mockStores.layoutStore.isMobileAppHideFeatures = true;

            const { rerender } = render(<SearchPodInner {...props} />);

            expect(screen.getByTestId('search-parameters-preview')).toBeInTheDocument();
            expect(screen.queryByTestId('search-bar-submit')).not.toBeInTheDocument();

            await userEvent.click(screen.getByTestId('search-parameters-preview'));

            rerender(<SearchPodInner {...props} />);

            expect(screen.getByTestId('back-to-search')).toBeInTheDocument();
            expect(screen.getByTestId('search-bar-submit')).toBeInTheDocument();
            expect(screen.queryByTestId('search-parameters-preview')).not.toBeInTheDocument();

            await userEvent.click(screen.getByTestId('back-to-search'));

            rerender(<SearchPodInner {...props} />);

            expect(screen.getByTestId('search-parameters-preview')).toBeInTheDocument();
            expect(screen.queryByTestId('back-to-search')).not.toBeInTheDocument();
            expect(screen.queryByTestId('search-bar-submit')).not.toBeInTheDocument();
        });

        it('should toggle edit mode when submit search parameters', async () => {
            props.params.AlternativeView = SearchPodAlternativeView.SummarisedView;

            const { rerender } = render(<SearchPodInner {...props} />);

            expect(screen.queryByTestId('search-bar-submit')).not.toBeInTheDocument();

            await userEvent.click(screen.getByTestId('search-parameters-preview'));

            rerender(<SearchPodInner {...props} />);

            expect(screen.getByTestId('search-bar-submit')).toBeInTheDocument();
            expect(screen.queryByTestId('search-parameters-preview')).not.toBeInTheDocument();
            expect(screen.queryByTestId('back-to-search')).toBeInTheDocument();

            await userEvent.click(screen.getByTestId('search-bar-submit'));

            rerender(<SearchPodInner {...props} />);

            expect(screen.queryByTestId('search-bar-submit')).not.toBeInTheDocument();
            expect(screen.getByTestId('search-parameters-preview')).toBeInTheDocument();
            expect(screen.queryByTestId('back-to-search')).not.toBeInTheDocument();
        });

        it('should reset data and height on exited HeightAnimatedContainer', async () => {
            props.params.AlternativeView = SearchPodAlternativeView.SummarisedView;
            const { rerender } = render(<SearchPodInner {...props} />);

            await userEvent.click(screen.getByTestId('search-parameters-preview'));

            rerender(<SearchPodInner {...props} />);

            expect(mockSearchBarProps).toHaveBeenCalledWith(
                expect.objectContaining({ selectedDropdown: SearchBarDropdown.When }),
            );
            expect(props.freezeHeight).toHaveBeenCalled();

            await userEvent.click(screen.queryAllByTestId('height-animated-container')[2]);

            rerender(<SearchPodInner {...props} />);

            waitFor(() => {
                expect(mockSearchBarProps).toHaveBeenCalledWith(expect.objectContaining({ selectedDropdown: null }));
                expect(props.resetHeight).toHaveBeenCalled();
            });
        });

        it('should set value to selectedDropdown by trigger onOpenSearchBarDropdown', async () => {
            props.params.AlternativeView = SearchPodAlternativeView.SummarisedView;

            const { rerender } = render(<SearchPodInner {...props} />);

            await userEvent.click(screen.getByTestId('search-parameters-preview'));

            rerender(<SearchPodInner {...props} />);

            expect(mockSearchBarProps).toHaveBeenCalledWith(
                expect.objectContaining({ selectedDropdown: SearchBarDropdown.When }),
            );
        });

        it('should auto open when field if edit mode and isReferer = true and hasOffers = false', async () => {
            props.params.AlternativeView = SearchPodAlternativeView.SummarisedView;
            mockStores.queryParamStore.isReferer = true;
            mockStores.hotelsStore.hasOffers = false;

            const { rerender } = render(<SearchPodInner {...props} />);

            await userEvent.click(screen.getByTestId('search-parameters-preview'));

            rerender(<SearchPodInner {...props} />);

            expect(mockStores.searchStore.setNeedOpenWhenField).toHaveBeenCalledWith(true);
        });

        it('should NOT set value to selectedDropdown by trigger onOpenSearchBarDropdown when isReferer = true and hasOffers = false', async () => {
            props.params.AlternativeView = SearchPodAlternativeView.SummarisedView;
            mockStores.queryParamStore.isReferer = true;
            mockStores.hotelsStore.hasOffers = false;

            const { rerender } = render(<SearchPodInner {...props} />);

            await userEvent.click(screen.getByTestId('search-parameters-preview'));

            rerender(<SearchPodInner {...props} />);

            expect(mockSearchBarProps).toHaveBeenCalledWith(expect.objectContaining({ selectedDropdown: null }));
        });
    });

    it('should call useClickOutside hook', async () => {
        render(<SearchPodInner {...props} />);

        await userEvent.click(screen.getByTestId('search-pod-inner'));

        expect(mockUseClickOutside).toHaveBeenCalled();
    });
});
