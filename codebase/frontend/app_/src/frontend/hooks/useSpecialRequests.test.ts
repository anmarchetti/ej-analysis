import { act, renderHook } from '@testing-library/react';

import * as isBackendUtil from 'frontend/utils/isBackend';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import * as webStorageUtils from 'frontend/utils/webStorage.utils';
import { ISpecialRequestContradictoryGroup, ISpecialRequestsType } from 'models/data/SpecialRequest';
import { WebStorageKeys } from 'models/enum/WebStorageKeys';

import useSpecialRequests, {
    addPreselectedToIgnored,
    getAllSpecialRequests,
    getIgnoredCodes,
    updateIgnoreCodes,
} from './useSpecialRequests';

jest.mock('frontend/utils/isBackend');
jest.mock('frontend/utils/webStorage.utils');

const mockIsBackend = isBackendUtil.default as jest.MockedFunction<typeof isBackendUtil.default>;
const mockGetWebStorageItem = webStorageUtils.getWebStorageItem as jest.MockedFunction<
    typeof webStorageUtils.getWebStorageItem
>;
const mockSetWebStorageItem = webStorageUtils.setWebStorageItem as jest.MockedFunction<
    typeof webStorageUtils.setWebStorageItem
>;

const createMockStores = (overrides = {}) => ({
    bookingStore: {
        isEligibleToAddSpecialRequest: true,
        packageId: 'package-123',
        infantsQuantity: 0,
        addSpecialRequests: jest.fn(),
    },
    queryParamStore: {
        specialRequests: [],
    },
    routerStore: {
        hardSyncQueryStore: jest.fn(),
    },
    hotelsStore: {
        setSpecialRequestsTypesByCode: jest.fn(),
    },
    ...overrides,
});

let mockStores = createMockStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => ({ ...mockStores }),
}));

const mockSpecialRequestType: ISpecialRequestsType = {
    id: 'type-1',
    fields: {
        Code: mockSitecoreField('TYPE1'),
        Name: mockSitecoreField('Type 1'),
        SpecialRequests: [
            {
                id: 'req-1',
                fields: {
                    Code: mockSitecoreField('REQ1'),
                    DisplayName: mockSitecoreField('Request 1'),
                    Name: mockSitecoreField('Request 1 Name'),
                    PreSelectedForInfant: mockSitecoreField(false),
                    PreSelectedForInfantAlert: mockSitecoreField(''),
                    AlertTitle: mockSitecoreField(''),
                },
            },
            {
                id: 'req-2',
                fields: {
                    Code: mockSitecoreField('REQ2'),
                    DisplayName: mockSitecoreField('Request 2'),
                    Name: mockSitecoreField('Request 2 Name'),
                    PreSelectedForInfant: mockSitecoreField(false),
                    PreSelectedForInfantAlert: mockSitecoreField(''),
                    AlertTitle: mockSitecoreField(''),
                },
            },
        ],
    },
};

const mockInfantPreselectedType: ISpecialRequestsType = {
    id: 'type-2',
    fields: {
        Code: mockSitecoreField('TYPE2'),
        Name: mockSitecoreField('Type 2'),
        SpecialRequests: [
            {
                id: 'cot-1',
                fields: {
                    Code: mockSitecoreField('COT1'),
                    DisplayName: mockSitecoreField('Infant Cot'),
                    Name: mockSitecoreField('Infant Cot Name'),
                    PreSelectedForInfant: mockSitecoreField(true),
                    PreSelectedForInfantAlert: mockSitecoreField('Cot alert message'),
                    AlertTitle: mockSitecoreField('Cot Alert Title'),
                },
            },
        ],
    },
};

const mockContradictoryGroup: ISpecialRequestContradictoryGroup = {
    id: 'group-1',
    fields: {
        Options: [
            {
                id: 'contra-req-1',
                fields: {
                    Code: mockSitecoreField('REQ1'),
                    DisplayName: mockSitecoreField('Request 1'),
                    Name: mockSitecoreField('Request 1 Name'),
                    PreSelectedForInfant: mockSitecoreField(false),
                    PreSelectedForInfantAlert: mockSitecoreField(''),
                    AlertTitle: mockSitecoreField(''),
                },
            },
        ],
    },
};

describe('getAllSpecialRequests', () => {
    it('should return empty arrays when no types provided', () => {
        const [requests, preselectedCodes] = getAllSpecialRequests([]);

        expect(requests).toEqual([]);
        expect(preselectedCodes).toEqual([]);
    });

    it('should process basic special requests correctly', () => {
        const [requests, preselectedCodes] = getAllSpecialRequests([mockSpecialRequestType]);

        expect(requests).toHaveLength(2);
        expect(requests[0]).toEqual({
            code: 'REQ1',
            groupCode: 'TYPE1',
            name: 'Request 1',
            isSelected: false,
        });
        expect(requests[1]).toEqual({
            code: 'REQ2',
            groupCode: 'TYPE1',
            name: 'Request 2',
            isSelected: false,
        });
        expect(preselectedCodes).toEqual([]);
    });

    it('should mark requests as selected based on selectedCodes', () => {
        const [requests] = getAllSpecialRequests([mockSpecialRequestType], ['REQ1']);

        expect(requests[0].isSelected).toBe(true);
        expect(requests[1].isSelected).toBe(false);
    });

    it('should handle infant preselection', () => {
        const [requests, preselectedCodes] = getAllSpecialRequests([mockInfantPreselectedType], [], true);

        expect(requests).toHaveLength(1);
        expect(requests[0]).toEqual({
            code: 'COT1',
            groupCode: 'TYPE2',
            name: 'Infant Cot',
            isSelected: false,
            isPreselected: true,
            preselectedAlert: { value: 'Cot alert message' },
            AlertTitle: { value: 'Cot Alert Title' },
        });
        expect(preselectedCodes).toEqual(['COT1']);
    });

    it('should not preselect ignored codes for infants', () => {
        const [requests, preselectedCodes] = getAllSpecialRequests([mockInfantPreselectedType], [], true, ['COT1']);

        expect(requests[0].isPreselected).toBeUndefined();
        expect(preselectedCodes).toEqual([]);
    });

    it('should sort preselected requests to the beginning', () => {
        const mixedTypes: ISpecialRequestsType[] = [mockSpecialRequestType, mockInfantPreselectedType];

        const [requests] = getAllSpecialRequests(mixedTypes, [], true);

        expect(requests[0].code).toBe('COT1');
        expect(requests[0].isPreselected).toBe(true);
    });

    it('should filter out requests without code or name', () => {
        const incompleteType: ISpecialRequestsType = {
            id: 'type-3',
            fields: {
                Code: mockSitecoreField('TYPE3'),
                Name: mockSitecoreField('Type 3'),
                SpecialRequests: [
                    {
                        id: 'req-3',
                        fields: {
                            Code: mockSitecoreField('REQ3'),
                            DisplayName: mockSitecoreField(''),
                            Name: mockSitecoreField('Request 3 Name'),
                            PreSelectedForInfant: mockSitecoreField(false),
                            PreSelectedForInfantAlert: mockSitecoreField(''),
                            AlertTitle: mockSitecoreField(''),
                        },
                    },
                    {
                        id: 'req-4',
                        fields: {
                            Code: mockSitecoreField(''),
                            DisplayName: mockSitecoreField('Request 4'),
                            Name: mockSitecoreField('Request 4 Name'),
                            PreSelectedForInfant: mockSitecoreField(false),
                            PreSelectedForInfantAlert: mockSitecoreField(''),
                            AlertTitle: mockSitecoreField(''),
                        },
                    },
                ],
            },
        };

        const [requests] = getAllSpecialRequests([incompleteType]);

        expect(requests).toHaveLength(0);
    });

    it('should handle contradictory groups', () => {
        const [requests] = getAllSpecialRequests([mockSpecialRequestType], [], false, [], [mockContradictoryGroup]);

        expect(requests[0].contradictoryGroupId).toBe('group-1');
        expect(requests[1].contradictoryGroupId).toBeUndefined();
    });
});

describe('addPreselectedToIgnored', () => {
    beforeEach(() => {
        mockGetWebStorageItem.mockClear();
        mockSetWebStorageItem.mockClear();
    });

    it('should create new storage entry when none exists', () => {
        mockGetWebStorageItem.mockReturnValue(null);

        addPreselectedToIgnored(['REQ1', 'REQ2'], 'package-123');

        expect(mockSetWebStorageItem).toHaveBeenCalledWith(
            WebStorageKeys.IgnoredPreselectedRequests,
            {
                'package-123': ['REQ1', 'REQ2'],
            },
            sessionStorage,
        );
    });

    it('should add to existing package entry', () => {
        mockGetWebStorageItem.mockReturnValue({
            'package-456': ['REQ3'],
        });

        addPreselectedToIgnored(['REQ1'], 'package-123');

        expect(mockSetWebStorageItem).toHaveBeenCalledWith(
            WebStorageKeys.IgnoredPreselectedRequests,
            {
                'package-456': ['REQ3'],
                'package-123': ['REQ1'],
            },
            sessionStorage,
        );
    });

    it('should append to existing array for same package', () => {
        mockGetWebStorageItem.mockReturnValue({
            'package-123': ['REQ1'],
        });

        addPreselectedToIgnored(['REQ2', 'REQ3'], 'package-123');

        expect(mockSetWebStorageItem).toHaveBeenCalledWith(
            WebStorageKeys.IgnoredPreselectedRequests,
            {
                'package-123': ['REQ1', 'REQ2', 'REQ3'],
            },
            sessionStorage,
        );
    });

    it('should call setWebStorageItem with correct parameters', () => {
        mockGetWebStorageItem.mockReturnValue(null);

        addPreselectedToIgnored(['REQ1'], 'package-123');

        expect(mockGetWebStorageItem).toHaveBeenCalledWith(
            WebStorageKeys.IgnoredPreselectedRequests,
            true,
            sessionStorage,
        );
        expect(mockSetWebStorageItem).toHaveBeenCalledTimes(1);
    });
});

describe('getIgnoredCodes', () => {
    beforeEach(() => {
        mockIsBackend.mockReturnValue(false);
        mockGetWebStorageItem.mockClear();
    });

    it('should return empty array when no data exists', () => {
        mockGetWebStorageItem.mockReturnValue(null);

        const result = getIgnoredCodes('package-123');

        expect(result).toEqual([]);
    });

    it('should return correct codes for packageId', () => {
        mockGetWebStorageItem.mockReturnValue({
            'package-123': ['REQ1', 'REQ2'],
            'package-456': ['REQ3'],
        });

        const result = getIgnoredCodes('package-123');

        expect(result).toEqual(['REQ1', 'REQ2']);
    });

    it('should return empty array on backend', () => {
        mockIsBackend.mockReturnValue(true);

        const result = getIgnoredCodes('package-123');

        expect(result).toEqual([]);
        expect(mockGetWebStorageItem).not.toHaveBeenCalled();
    });

    it('should return empty array for non-existent packageId', () => {
        mockGetWebStorageItem.mockReturnValue({
            'package-123': ['REQ1'],
        });

        const result = getIgnoredCodes('package-456');

        expect(result).toEqual([]);
    });
});

describe('updateIgnoreCodes', () => {
    beforeEach(() => {
        mockIsBackend.mockReturnValue(false);
        mockGetWebStorageItem.mockClear();
        mockSetWebStorageItem.mockClear();
    });

    it('should add unique codes to ignored list', () => {
        mockGetWebStorageItem.mockReturnValue({
            'package-123': ['REQ1'],
        });

        updateIgnoreCodes('package-123', ['REQ2', 'REQ3']);

        expect(mockSetWebStorageItem).toHaveBeenCalledWith(
            WebStorageKeys.IgnoredPreselectedRequests,
            {
                'package-123': ['REQ1', 'REQ2', 'REQ3'],
            },
            sessionStorage,
        );
    });

    it('should skip duplicate codes', () => {
        mockGetWebStorageItem.mockReturnValue({
            'package-123': ['REQ1', 'REQ2'],
        });

        updateIgnoreCodes('package-123', ['REQ2', 'REQ3']);

        expect(mockSetWebStorageItem).toHaveBeenCalledWith(
            WebStorageKeys.IgnoredPreselectedRequests,
            {
                'package-123': ['REQ1', 'REQ2', 'REQ3'],
            },
            sessionStorage,
        );
    });
});

describe('useSpecialRequests', () => {
    beforeEach(() => {
        mockIsBackend.mockReturnValue(false);
        mockGetWebStorageItem.mockReturnValue(null);
        mockStores = createMockStores();
    });

    it('should return requests when isBackend is true (SSR computes same list as client)', () => {
        mockIsBackend.mockReturnValue(true);

        const { result } = renderHook(() => useSpecialRequests([mockSpecialRequestType]));

        expect(result.current.requests).toEqual([
            expect.objectContaining({ code: 'REQ1' }),
            expect.objectContaining({ code: 'REQ2' }),
        ]);
        expect(result.current.alerts).toEqual([]);
    });

    it('should return empty requests when not eligible to add special requests', () => {
        mockStores = createMockStores({
            bookingStore: {
                ...mockStores.bookingStore,
                isEligibleToAddSpecialRequest: false,
            },
        });

        const { result } = renderHook(() => useSpecialRequests([mockSpecialRequestType]));

        expect(result.current.requests).toEqual([]);
        expect(result.current.alerts).toEqual([]);
    });

    it('should process special requests correctly with valid data', () => {
        const { result } = renderHook(() => useSpecialRequests([mockSpecialRequestType]));

        expect(result.current.requests).toHaveLength(2);
        expect(result.current.requests[0].code).toBe('REQ1');
        expect(result.current.requests[1].code).toBe('REQ2');
    });

    it('should initialize with ignored codes from storage', () => {
        mockGetWebStorageItem.mockReturnValue({
            'package-123': ['COT1'],
        });

        const { result } = renderHook(() => useSpecialRequests([mockInfantPreselectedType]));

        expect(result.current.alerts).toEqual([]);
    });

    it('should set special requests types by code', () => {
        const mockSetSpecialRequestsTypesByCode = jest.fn();
        mockStores = createMockStores({
            hotelsStore: {
                setSpecialRequestsTypesByCode: mockSetSpecialRequestsTypesByCode,
            },
        });

        renderHook(() => useSpecialRequests([mockSpecialRequestType]));

        expect(mockSetSpecialRequestsTypesByCode).toHaveBeenCalledWith({
            REQ1: 'TYPE1',
            REQ2: 'TYPE1',
        });
    });

    it('should generate alerts correctly for preselected requests', () => {
        mockStores = createMockStores({
            bookingStore: {
                ...mockStores.bookingStore,
                infantsQuantity: 1,
            },
        });

        const { result } = renderHook(() => useSpecialRequests([mockInfantPreselectedType]));

        expect(result.current.alerts).toHaveLength(1);
        expect(result.current.alerts[0]).toEqual({
            message: 'Cot Alert Title',
            description: 'Cot alert message',
        });
    });

    it('should call addSpecialRequests on mount with preselected codes', () => {
        const mockAddSpecialRequests = jest.fn();
        mockStores = createMockStores({
            bookingStore: {
                ...mockStores.bookingStore,
                infantsQuantity: 1,
                addSpecialRequests: mockAddSpecialRequests,
            },
        });

        renderHook(() => useSpecialRequests([mockInfantPreselectedType]));

        expect(mockAddSpecialRequests).toHaveBeenCalledWith(['COT1']);
    });

    it('should call hardSyncQueryStore on mount', () => {
        const mockHardSyncQueryStore = jest.fn();
        mockStores = createMockStores({
            bookingStore: {
                ...mockStores.bookingStore,
                infantsQuantity: 1,
            },
            routerStore: {
                hardSyncQueryStore: mockHardSyncQueryStore,
            },
        });

        renderHook(() => useSpecialRequests([mockInfantPreselectedType]));

        expect(mockHardSyncQueryStore).toHaveBeenCalled();
    });

    it('should remove preselected code via handlePreselectedDismissal', () => {
        mockStores = createMockStores({
            bookingStore: {
                ...mockStores.bookingStore,
                infantsQuantity: 1,
            },
        });

        const { result } = renderHook(() => useSpecialRequests([mockInfantPreselectedType]));

        expect(result.current.alerts).toHaveLength(1);

        act(() => {
            result.current.handlePreselectedDismissal('COT1');
        });

        expect(result.current.alerts).toHaveLength(0);
    });

    it('should update alerts when preselected codes removed', () => {
        mockStores = createMockStores({
            bookingStore: {
                ...mockStores.bookingStore,
                infantsQuantity: 1,
            },
        });

        const { result } = renderHook(() => useSpecialRequests([mockInfantPreselectedType]));

        const initialAlertsCount = result.current.alerts.length;
        expect(initialAlertsCount).toBe(1);

        act(() => {
            result.current.handlePreselectedDismissal('COT1');
        });

        expect(result.current.alerts.length).toBe(0);
    });

    it('should handle empty preselected codes without side effects', () => {
        const mockAddSpecialRequests = jest.fn();
        const mockHardSyncQueryStore = jest.fn();
        mockStores = createMockStores({
            bookingStore: {
                ...mockStores.bookingStore,
                addSpecialRequests: mockAddSpecialRequests,
            },
            routerStore: {
                hardSyncQueryStore: mockHardSyncQueryStore,
            },
        });

        renderHook(() => useSpecialRequests([mockSpecialRequestType]));

        expect(mockAddSpecialRequests).not.toHaveBeenCalled();
        expect(mockHardSyncQueryStore).not.toHaveBeenCalled();
    });

    it('should not call handlePreselectedDismissal for non-preselected codes', () => {
        mockStores = createMockStores({
            bookingStore: {
                ...mockStores.bookingStore,
                infantsQuantity: 1,
            },
        });

        const { result } = renderHook(() => useSpecialRequests([mockInfantPreselectedType]));

        const initialAlerts = result.current.alerts;

        act(() => {
            result.current.handlePreselectedDismissal('NON_EXISTENT');
        });

        expect(result.current.alerts).toEqual(initialAlerts);
    });

    describe('handlePreselectedDismissal - session storage', () => {
        beforeEach(() => {
            mockGetWebStorageItem.mockReturnValue(null);
            mockSetWebStorageItem.mockClear();
        });

        it('should save to session storage when dismissing a selected preselected request', () => {
            mockStores = createMockStores({
                bookingStore: {
                    ...mockStores.bookingStore,
                    infantsQuantity: 1,
                    packageId: 'package-123',
                },
                queryParamStore: {
                    specialRequests: ['COT1'],
                },
            });

            const { result } = renderHook(() => useSpecialRequests([mockInfantPreselectedType]));

            expect(result.current.requests[0].code).toBe('COT1');
            expect(result.current.requests[0].isSelected).toBe(true);
            expect(result.current.alerts).toHaveLength(1);

            act(() => {
                result.current.handlePreselectedDismissal('COT1');
            });

            expect(mockSetWebStorageItem).toHaveBeenCalledWith(
                WebStorageKeys.IgnoredPreselectedRequests,
                { 'package-123': ['COT1'] },
                sessionStorage,
            );
            expect(result.current.alerts).toHaveLength(0);
        });

        it('should NOT save to session storage when dismissing an unselected preselected request', () => {
            mockStores = createMockStores({
                bookingStore: {
                    ...mockStores.bookingStore,
                    infantsQuantity: 1,
                    packageId: 'package-123',
                },
                queryParamStore: {
                    specialRequests: [],
                },
            });

            const { result } = renderHook(() => useSpecialRequests([mockInfantPreselectedType]));

            expect(result.current.requests[0].code).toBe('COT1');
            expect(result.current.requests[0].isSelected).toBe(false);
            expect(result.current.alerts).toHaveLength(1);

            act(() => {
                result.current.handlePreselectedDismissal('COT1');
            });

            expect(mockSetWebStorageItem).not.toHaveBeenCalled();
            expect(result.current.alerts).toHaveLength(0);
        });

        it('should save to session storage with correct packageId', () => {
            const customPackageId = 'custom-package-999';
            mockStores = createMockStores({
                bookingStore: {
                    ...mockStores.bookingStore,
                    infantsQuantity: 1,
                    packageId: customPackageId,
                },
                queryParamStore: {
                    specialRequests: ['COT1'],
                },
            });

            const { result } = renderHook(() => useSpecialRequests([mockInfantPreselectedType]));

            expect(result.current.requests[0].code).toBe('COT1');
            expect(result.current.requests[0].isSelected).toBe(true);

            act(() => {
                result.current.handlePreselectedDismissal('COT1');
            });

            expect(mockSetWebStorageItem).toHaveBeenCalledWith(
                WebStorageKeys.IgnoredPreselectedRequests,
                { [customPackageId]: ['COT1'] },
                sessionStorage,
            );
        });
    });

    it('should work correctly with contradictory groups', () => {
        const { result } = renderHook(() => useSpecialRequests([mockSpecialRequestType], [mockContradictoryGroup]));

        expect(result.current.requests[0].contradictoryGroupId).toBe('group-1');
    });

    it('should handle selected requests from query params', () => {
        mockStores = createMockStores({
            queryParamStore: {
                specialRequests: ['REQ1'],
            },
        });

        const { result } = renderHook(() => useSpecialRequests([mockSpecialRequestType]));

        expect(result.current.requests[0].isSelected).toBe(true);
        expect(result.current.requests[1].isSelected).toBe(false);
    });

    it('should not generate alerts for preselected requests without alert message', () => {
        const typeWithoutAlert: ISpecialRequestsType = {
            id: 'type-3',
            fields: {
                Code: mockSitecoreField('TYPE3'),
                Name: mockSitecoreField('Type 3'),
                SpecialRequests: [
                    {
                        id: 'req-3',
                        fields: {
                            Code: mockSitecoreField('REQ3'),
                            DisplayName: mockSitecoreField('Request 3'),
                            Name: mockSitecoreField('Request 3 Name'),
                            PreSelectedForInfant: mockSitecoreField(true),
                            PreSelectedForInfantAlert: mockSitecoreField(''),
                            AlertTitle: mockSitecoreField(''),
                        },
                    },
                ],
            },
        };

        mockStores = createMockStores({
            bookingStore: {
                ...mockStores.bookingStore,
                infantsQuantity: 1,
            },
        });

        const { result } = renderHook(() => useSpecialRequests([typeWithoutAlert]));

        expect(result.current.alerts).toEqual([]);
    });
});
