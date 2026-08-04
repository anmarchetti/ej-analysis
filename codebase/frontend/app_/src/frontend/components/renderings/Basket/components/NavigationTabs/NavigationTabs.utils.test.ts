import { RefObject } from 'react';
import { renderHook, waitFor } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__/createMockStores';
import * as utils from 'frontend/utils/ui.utils';

import useNavigationTabsPreparedData, {
    DESKTOP_DEFAULT_HEIGHT,
    HotelPageComponents,
    MOBILE_DEFAULT_HEIGHT,
    NavigationTabIds,
    OFFSET_TOP,
    useNavigationTabsList,
} from './NavigationTabs.utils';

const mockUseState = jest.fn(init => [init, jest.fn()]);
const mockUseRef = jest.fn(() => ({ current: { offsetHeight: 10 } } as RefObject<HTMLDivElement>));
jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
    useState: init => mockUseState(init),
    useRef: () => mockUseRef(),
}));

const createNavigationTab = (idValue: string, id: string) => ({
    fields: {
        Icon: {
            value: {
                src: `/img/${id}.svg`,
                alt: '',
            },
        },
        Id: {
            value: idValue,
        },
        Name: { value: `name-${id}` },
    },
    id,
});

const mockUseMediaQuery = jest.fn(() => false);
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMediaQuery: () => mockUseMediaQuery(),
}));

const mockUseAnchorHighlight = jest.fn();
jest.mock('frontend/hooks/useAnchorScrollTracker', () => ({
    __esModule: true,
    useAnchorScrollTracker: props => {
        mockUseAnchorHighlight(props);
        const result = [...props.items];
        result[0] = { ...result[0], isActive: true };

        return result;
    },
}));

let mockStores;
let props;

const createProps = () => ({
    list: Array.from({ length: 5 }).map((_, idx) => ({
        fields: {
            Icon: {
                value: {
                    src: '/holidays/cms/media/-/jssmedia/project/holidays/de…1.svg?iar=0&hash=4DB2EE8BA315A8B5A1B3A562FDD6E0F9',
                    alt: '',
                },
            },
            Id: {
                value: `id-${idx}`,
            },
            Name: { value: `name-${idx}` },
        },
        id: `id-${idx}`,
    })),
});

describe('useNavigationTabsPreparedData', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            engageStore: {
                contentOrder: null,
            },
        });
        props = createProps();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should return correct data', () => {
        const { result } = renderHook(() => useNavigationTabsPreparedData(props));

        expect(result.current.onClick).toEqual(expect.any(Function));
        expect(result.current.onOpen).toEqual(expect.any(Function));
        expect(result.current.onClose).toEqual(expect.any(Function));
        expect(result.current.isMobileActiveItemDisplayed).toEqual(false);
        expect(result.current.isMobileCollapseItemDisplayed).toEqual(false);
        expect(result.current.isListDisplayed).toEqual(true);
        expect(result.current.wrapperClassNames).toEqual('wrapper');
        expect(result.current.linksClassNames).toEqual('links start');

        waitFor(() => expect(result.current.active).toEqual(props.list[0]));
    });

    it('should call useAnchorScrollTracker with correct props', () => {
        jest.spyOn(document, 'getElementById').mockImplementation(id => {
            const mockElement = document.createElement('div');
            mockElement.id = id;

            return mockElement;
        });
        const { result } = renderHook(() => useNavigationTabsPreparedData(props));

        expect(mockUseAnchorHighlight).toHaveBeenCalledWith({
            rootMargin: '-20% 0% -80% 0%',
            items: props.list.map(item => ({ id: item.fields.Id.value })),
            threshold: 0,
            keepTabSelection: true,
        });
        expect(result.current.active).toEqual(props.list[0]);
    });

    describe('onClick', () => {
        it('should NOT call setIsExpended/scrollToElement when isMobile is false', () => {
            const scrollToElement = jest.spyOn(utils, 'scrollToElement').mockImplementation(jest.fn());

            const setIsExpanded = jest.fn();
            mockUseState.mockReturnValueOnce([false, setIsExpanded]);

            const { result } = renderHook(() => useNavigationTabsPreparedData(props));

            result.current.onClick('');

            expect(setIsExpanded).not.toHaveBeenCalled();
            expect(scrollToElement).not.toHaveBeenCalled();
        });

        it('should call setIsExpended and scrollToElement when isMobile is true', () => {
            mockUseMediaQuery.mockReturnValueOnce(true);
            document.getElementById = jest.fn(() => props.list[1]);

            const scrollToElement = jest.spyOn(utils, 'scrollToElement').mockImplementation(jest.fn());

            const setIsExpanded = jest.fn();
            mockUseState.mockReturnValueOnce([false, setIsExpanded]);

            const { result } = renderHook(() => useNavigationTabsPreparedData(props));

            result.current.onClick('id-2');

            expect(setIsExpanded).toHaveBeenCalledWith(false);
            expect(scrollToElement).toHaveBeenCalledWith(props.list[1], MOBILE_DEFAULT_HEIGHT + OFFSET_TOP);
        });

        it('should scrollToElement  with offset from ref when isMobile is false', () => {
            document.getElementById = jest.fn(() => props.list[0]);

            const scrollToElement = jest.spyOn(utils, 'scrollToElement').mockImplementation(jest.fn());

            const setIsExpanded = jest.fn();
            mockUseState.mockReturnValueOnce([false, setIsExpanded]);

            const { result } = renderHook(() => useNavigationTabsPreparedData(props));

            result.current.onClick('id-1');

            expect(setIsExpanded).not.toHaveBeenCalled();
            expect(scrollToElement).toHaveBeenCalledWith(props.list[0], 10 + OFFSET_TOP);
        });

        it('should scrollToElement with default offset when isMobile is false and ref.current is null', () => {
            document.getElementById = jest.fn(() => props.list[0]);
            mockUseRef.mockReturnValueOnce({ current: null });

            const scrollToElement = jest.spyOn(utils, 'scrollToElement').mockImplementation(jest.fn());

            const setIsExpanded = jest.fn();
            mockUseState.mockReturnValueOnce([false, setIsExpanded]);

            const { result } = renderHook(() => useNavigationTabsPreparedData(props));

            result.current.onClick('id-1');

            expect(setIsExpanded).not.toHaveBeenCalled();
            expect(scrollToElement).toHaveBeenCalledWith(props.list[0], DESKTOP_DEFAULT_HEIGHT + OFFSET_TOP);
        });
    });

    describe('isMobileActiveItemDisplayed', () => {
        it('should be true when isMobile is true and isExpanded is false', () => {
            mockUseMediaQuery.mockReturnValueOnce(true);

            const { result } = renderHook(() => useNavigationTabsPreparedData(props));

            expect(result.current.isMobileActiveItemDisplayed).toEqual(true);
        });

        it('should be false when both isMobile/isExpanded is true', () => {
            mockUseMediaQuery.mockReturnValueOnce(true);
            mockUseState.mockReturnValueOnce([true, jest.fn()]);

            const { result } = renderHook(() => useNavigationTabsPreparedData(props));

            expect(result.current.isMobileActiveItemDisplayed).toEqual(false);
        });

        it('should be false when both isMobile/isExpanded is false', () => {
            const { result } = renderHook(() => useNavigationTabsPreparedData(props));

            expect(result.current.isMobileActiveItemDisplayed).toEqual(false);
        });
    });

    describe('isMobileCollapseItemDisplayed', () => {
        it('should be true when both isMobile/isExpanded is true', () => {
            mockUseMediaQuery.mockReturnValueOnce(true);
            mockUseState.mockReturnValueOnce([true, jest.fn()]);

            const { result } = renderHook(() => useNavigationTabsPreparedData(props));

            expect(result.current.isMobileCollapseItemDisplayed).toEqual(true);
        });

        it('should be false when either isMobile or isExpanded is false', () => {
            const { result } = renderHook(() => useNavigationTabsPreparedData(props));

            expect(result.current.isMobileCollapseItemDisplayed).toEqual(false);
        });
    });

    describe('isListDisplayed', () => {
        it('should be true when both isMobile/isExpanded is true', () => {
            mockUseMediaQuery.mockReturnValueOnce(true);
            mockUseState.mockReturnValueOnce([true, jest.fn()]);

            const { result } = renderHook(() => useNavigationTabsPreparedData(props));

            expect(result.current.isMobileCollapseItemDisplayed).toEqual(true);
        });

        it('should be true when isMobile is false and isExpanded is false', () => {
            const { result } = renderHook(() => useNavigationTabsPreparedData(props));

            expect(result.current.isListDisplayed).toEqual(true);
        });
    });

    describe('wrapperClassNames', () => {
        it('should include tablet when isMobile is false and isScreenLessMedium is true', () => {
            mockStores.appStore.isScreenLessMedium = true;

            const { result } = renderHook(() => useNavigationTabsPreparedData(props));

            expect(result.current.wrapperClassNames).toEqual('wrapper tablet');
        });

        it('should NOT include tablet when isMobile is true', () => {
            mockStores.appStore.isScreenLessMedium = false;

            const { result } = renderHook(() => useNavigationTabsPreparedData(props));

            expect(result.current.wrapperClassNames).toEqual('wrapper');
        });

        it('should include mobile when isMobile is true', () => {
            mockUseMediaQuery.mockReturnValueOnce(true);

            const { result } = renderHook(() => useNavigationTabsPreparedData(props));

            expect(result.current.wrapperClassNames).toEqual('wrapper mobile');
        });

        it('should NOT include mobile when isMobile is false', () => {
            const { result } = renderHook(() => useNavigationTabsPreparedData(props));

            expect(result.current.wrapperClassNames).toEqual('wrapper');
        });
    });

    describe('linksClassNames', () => {
        it('should include only links when isScreenLessMedium is true and isMobile is false', () => {
            mockStores.appStore.isScreenLessMedium = true;

            const { result } = renderHook(() => useNavigationTabsPreparedData(props));

            expect(result.current.linksClassNames).toEqual('links');
        });

        it('should include start when arr.length < 5 for desktop', () => {
            props.list.splice(3, 1);
            const { result } = renderHook(() => useNavigationTabsPreparedData(props));

            expect(result.current.linksClassNames).toEqual('links start');
        });

        it('should include start when arr.length < 5 for tablet', () => {
            mockUseMediaQuery.mockReturnValue(true);
            props.list.splice(3, 1);

            const { result } = renderHook(() => useNavigationTabsPreparedData(props));

            expect(result.current.linksClassNames).toEqual('links start');
        });

        it('should include vertical when arr.length > 4 when isVertical is true and isMobile is false', () => {
            mockUseMediaQuery.mockReturnValueOnce(false).mockReturnValueOnce(true);
            mockUseState.mockReturnValueOnce([true, jest.fn()]);

            const { result } = renderHook(() => useNavigationTabsPreparedData(props));

            expect(result.current.linksClassNames).toEqual('links vertical');
        });
    });

    describe('onOpen', () => {
        it('should call setIsExpanded', () => {
            const setIsExpanded = jest.fn();
            mockUseState.mockReturnValueOnce([false, setIsExpanded]);

            const { result } = renderHook(() => useNavigationTabsPreparedData(props));

            result.current.onOpen();

            expect(setIsExpanded).toHaveBeenCalledWith(true);
        });
    });

    describe('onClose', () => {
        it('should call setIsExpanded', () => {
            const setIsExpanded = jest.fn();
            mockUseState.mockReturnValueOnce([false, setIsExpanded]);

            const { result } = renderHook(() => useNavigationTabsPreparedData(props));

            result.current.onClose();

            expect(setIsExpanded).toHaveBeenCalledWith(false);
        });
    });
});

describe('useNavigationTabsList', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            engageStore: {
                contentOrder: null,
            },
        });
    });

    it('should use contentOrder to calculate navigation tabs list', () => {
        const firstItem = createNavigationTab(NavigationTabIds.HotelInfo, 'tab-0');
        const roomsItem = createNavigationTab(NavigationTabIds.Rooms, 'tab-1');
        const flightsItem = createNavigationTab(NavigationTabIds.Flights, 'tab-2');
        const data = [firstItem, roomsItem, flightsItem];

        mockStores.engageStore.contentOrder = {
            groupName: 'grouping',
            uid: 'content-order',
            placeholders: {
                'sorter-wrapper-inner': [
                    { componentName: HotelPageComponents.Flights, uid: '1' },
                    { componentName: HotelPageComponents.Rooms, uid: '2' },
                    { componentName: 'missing', uid: '3' },
                ],
            },
        } as any;

        const { result } = renderHook(() => useNavigationTabsList(data));

        expect(result.current).toEqual([firstItem, flightsItem, roomsItem]);
    });

    it('should fallback to data when contentOrder is missing', () => {
        const data = [
            createNavigationTab(NavigationTabIds.HotelInfo, 'tab-0'),
            createNavigationTab(NavigationTabIds.Rooms, 'tab-1'),
            createNavigationTab(NavigationTabIds.Flights, 'tab-2'),
        ];

        mockStores.engageStore.contentOrder = null;

        const { result } = renderHook(() => useNavigationTabsList(data));

        expect(result.current).toEqual(data);
    });
});
