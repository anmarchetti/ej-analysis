import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import {
    createOriDisplayValueByCodes,
    getRoomAllocationFromQueryRoom,
    getWhoField,
} from 'frontend/utils/search/search.utils';
import { MarketCode } from 'models/data/MarketSettings';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SiteSettings from 'models/enum/SiteSettings';
import { getAdultsQuantity, getChildrenQuantity, getInfantsQuantity } from 'models/RoomAllocation.utils';
import RecentSearchesContent, {
    IRecentSearchesContentProps,
} from 'frontend/components/renderings/SearchPod/components/SearchBar/components/RecentSearchesPanel/components/RecentSearchesContent/RecentSearchesContent';
import { createMockLocalStore } from 'frontend/components/renderings/SearchPod/stores/mocks';

const mockButtonComponent = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: ({ children, onClick, ...props }) => {
        mockButtonComponent(props);

        return <button onClick={onClick}>{children}</button>;
    },
}));

const mockRecentSearchItemComponent = jest.fn();
jest.mock(
    'frontend/components/renderings/SearchPod/components/SearchBar/components/RecentSearchesPanel/components/RecentSearchItem/RecentSearchItem',
    () => ({
        __esModule: true,
        default: ({ onClear, onClick, ...props }) => {
            mockRecentSearchItemComponent(props);

            return (
                <div data-tid='recent-search-item'>
                    <button onClick={onClick}>onClick</button>
                    <button onClick={onClear}>onClear</button>
                </div>
            );
        },
    }),
);

jest.mock('frontend/utils/search/search.utils', () => ({
    __esModule: true,
    createOriDisplayValueByCodes: jest.fn(() => ({ add: 'add', main: 'main' })),
    getWhoField: jest.fn(() => 'whoValue'),
    getRoomAllocationFromQueryRoom: jest.fn(),
}));

jest.mock('models/RoomAllocation.utils', () => ({
    __esModule: true,
    getChildrenQuantity: jest.fn(),
    getInfantsQuantity: jest.fn(),
    getAdultsQuantity: jest.fn(),
}));

const createProps = (): IRecentSearchesContentProps => ({
    items: [],
    onApply: jest.fn(),
    onCancel: jest.fn(),
    onClearAll: jest.fn(),
    onClearOne: jest.fn(),
    selectedIndex: null,
});

const createStores = () => ({
    searchStore: {
        originsWithNames: [],
        loadDestinationsForRecentSearches: jest.fn().mockReturnValue([]),
        searchTo: {
            createDstDisplayValueByCodes: jest.fn(),
        },
    },
    layoutStore: {
        getPhrase: jest.fn(p => p),
        isTradePortal: true,
        getSettingAsNumber: jest.fn(k => k),
    },
    marketStore: {
        marketCode: MarketCode.UK,
    },
});

let mockProps;
let mockStores = createStores();
let mockLocalStore;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/renderings/SearchPod/stores/createStore', () => ({
    ...jest.requireActual('frontend/components/renderings/SearchPod/stores/createStore'),
    useSearchPodStore: () => mockLocalStore,
}));

let mockUseMobileViewport = false;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMobileViewport: () => mockUseMobileViewport,
}));

const mockRecentSearch = {
    createdAt: '2020-11-10',
    startDate: '2020-11-10',
    durations: ['13', '21'],
    departure: 'dep',
    geog: 'geog',
    dest: 'LGW',
    rooms: [],
    autoAllocation: false,
    flexDays: 1,
};

describe('<RecentSearchesContent />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
        mockUseMobileViewport = false;
        mockLocalStore = createMockLocalStore();
    });

    describe('RecentSearchItem props', () => {
        it('should render RecentSearchItem when items prop is not empty', async () => {
            mockProps.items = [
                mockRecentSearch,
                {
                    ...mockRecentSearch,
                    geog: 'all',
                },
            ];
            mockProps.selectedIndex = 1;
            const mockPrettifySearchItem = {
                duration: expect.anything(),
                from: expect.anything(),
                to: expect.anything(),
                when: expect.anything(),
                who: expect.anything(),
            };
            const { container } = render(<RecentSearchesContent {...mockProps} />);

            const heading = screen.getByRole('heading', { level: 3 });
            const footer = container.querySelector('.footer') as HTMLElement;

            await waitFor(() => {
                expect(heading).toHaveTextContent(mockLocalStore.fields.RecentSearchesLabel.value);
                expect(heading).toHaveClass('title');
                expect(screen.getAllByTestId('recent-search-item')).toHaveLength(mockProps.items.length);
                expect(mockRecentSearchItemComponent).toHaveBeenCalledWith({
                    item: mockPrettifySearchItem,
                    isLoadingDestination: false,
                    isSelected: true,
                });
                expect(mockRecentSearchItemComponent).toHaveBeenCalledWith({
                    item: mockPrettifySearchItem,
                    isLoadingDestination: false,
                    isSelected: false,
                });
                expect(container.querySelector('.footer')).toBeInTheDocument();
                expect(
                    within(footer).getByRole('button', { name: mockLocalStore.fields.ClearRecentSearches.value }),
                ).toBeInTheDocument();
                expect(mockButtonComponent).toHaveBeenCalledWith({
                    className: 'clearBtn',
                    isText: true,
                    isTransparent: true,
                    dataTid: 'clear-recents-btn',
                });
            });
        });

        it('should call prettifySearch', async () => {
            mockProps.items = [
                {
                    ...mockRecentSearch,
                    dest: 'all',
                    destinations: [],
                    rooms: [
                        {
                            adults: 2,
                            children: 1,
                            infants: 0,
                            roomCode: '',
                            childrenAges: [],
                        },
                    ],
                },
            ];
            mockProps.selectedIndex = 0;
            const mockDestinations = ['LGW'];
            mockStores.searchStore.loadDestinationsForRecentSearches = jest.fn().mockReturnValue(mockDestinations);
            const mockRoomAllocation = { key: 'RoomAllocation  mock' };
            (getRoomAllocationFromQueryRoom as any).mockReturnValueOnce(mockRoomAllocation);

            render(<RecentSearchesContent {...mockProps} />);

            await waitFor(() => {
                expect(screen.getAllByTestId('recent-search-item')).toHaveLength(mockProps.items.length);
                expect(createOriDisplayValueByCodes).toHaveBeenCalledWith(
                    [mockProps.items[0].departure],
                    mockStores.searchStore.originsWithNames,
                    null,
                    expect.any(Function),
                    false,
                    mockStores.marketStore.marketCode,
                );
                expect(mockStores.searchStore.searchTo.createDstDisplayValueByCodes).toHaveBeenCalledWith(
                    [mockProps.items[0].dest],
                    mockDestinations,
                    null,
                    false,
                    SiteSettings.RecentSearchesMaxDestinationsDisplayed,
                );
                expect(getRoomAllocationFromQueryRoom).toHaveBeenCalledWith(
                    mockProps.items[0].rooms[0],
                    mockStores.layoutStore.isTradePortal,
                );
                expect(getWhoField).toHaveBeenCalledWith(
                    {
                        adults: undefined,
                        children: undefined,
                        infants: undefined,
                    },
                    mockProps.items[0].rooms.length,
                    mockProps.items[0].autoAllocation,
                    expect.any(Function),
                );
                expect(getAdultsQuantity).toHaveBeenCalledWith([mockRoomAllocation]);
                expect(getChildrenQuantity).toHaveBeenCalledWith([mockRoomAllocation]);
                expect(getInfantsQuantity).toHaveBeenCalledWith([mockRoomAllocation]);
            });
        });

        it('should call onApply by trigger RecentSearchItem onClick', async () => {
            mockProps.items = [mockRecentSearch];
            render(<RecentSearchesContent {...mockProps} />);

            fireEvent.click(screen.getByRole('button', { name: 'onClick' }));

            await waitFor(() => {
                expect(mockProps.onApply).toHaveBeenCalledWith(0);
            });
        });

        it('should call onClearOne by trigger RecentSearchItem onClear', async () => {
            mockProps.items = [mockRecentSearch];
            render(<RecentSearchesContent {...mockProps} />);

            fireEvent.click(screen.getByRole('button', { name: 'onClear' }));

            await waitFor(() => {
                expect(mockProps.onClearOne).toHaveBeenCalledWith(0);
            });
        });

        it('should call onClearAll by click on clear recents button', async () => {
            render(<RecentSearchesContent {...mockProps} />);

            fireEvent.click(screen.getByRole('button', { name: mockLocalStore.fields.ClearRecentSearches.value }));

            await waitFor(() => {
                expect(mockProps.onClearAll).toHaveBeenCalled();
            });
        });
    });

    describe('Cancel button', () => {
        it('should render when isMobile is false', async () => {
            render(<RecentSearchesContent {...mockProps} />);

            await waitFor(() => {
                expect(
                    screen.getByRole('button', { name: SitecoreDictionary.GlobalsButtonsCancel }),
                ).toBeInTheDocument();
                expect(mockButtonComponent).toHaveBeenCalledWith({
                    className: 'cancelBtn',
                    isText: true,
                    isTransparent: true,
                });
            });
        });

        it('should NOT render when on mobile', async () => {
            mockUseMobileViewport = true;
            render(<RecentSearchesContent {...mockProps} />);

            await waitFor(() => {
                expect(
                    screen.queryByRole('button', { name: SitecoreDictionary.GlobalsButtonsCancel }),
                ).not.toBeInTheDocument();
            });
        });

        it('should call onCancel on click', async () => {
            render(<RecentSearchesContent {...mockProps} />);

            fireEvent.click(screen.getByRole('button', { name: SitecoreDictionary.GlobalsButtonsCancel }));

            await waitFor(() => {
                expect(mockProps.onCancel).toHaveBeenCalled();
            });
        });
    });
});
