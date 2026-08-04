import { act, renderHook } from '@testing-library/react';

import * as destinationUtils from 'frontend/utils/destinations.utils';
import { DestinationType } from 'models/enum/DestinationType';

import {
    IUseDestinationSelectionHandlersProps,
    useDestinationSelectionHandlers,
} from './DestinationCheckboxGroup.hooks';

const mockParent = {
    code: 'destination_country_code',
    name: 'destination_country_name',
    children: [
        {
            code: 'destination_country_child_code',
            name: 'destination_country_child_name',
            type: DestinationType.Region,
            available: true,
            showOnSearchPod: true,
            giataCode: 'giataCod_child',
        },
    ],
};

const mockParentIDestination = {
    code: 'destination_code',
    name: 'destination_name',
};

const mockFirstChildRelatedRegionCode = 'related_region';
const mockFirstChildRelatedRegionIDestination = {
    code: 'related_region_code',
    name: 'related_region_name',
};

const mockChildIDestination = {
    code: 'child_code',
    name: 'child_name',
    relatedRegions: [mockFirstChildRelatedRegionCode],
};

const mockSecondChildCode = 'destination_country_child_code2';
const mockSecondChildIDestination = {
    code: 'child2_code',
    name: 'child2_name',
};

const createMockProps = (): IUseDestinationSelectionHandlersProps => ({
    addDestination: jest.fn(),
    removeDestination: jest.fn(),
    updateDestinationCodes: jest.fn(),
    isDisabledItem: jest.fn().mockReturnValue(false),
    isCheckedItem: jest.fn().mockReturnValue(false),
    availableCodes: null,
    parent: { ...mockParent }, // should be copied to prevent shared state between tests
    trackToRegionSelectAll: jest.fn(),
    trackToRegionSelectSingle: jest.fn(),
    selectedDestinations: [],
    availableDestinationsCodes: [],
});
let mockProps;

describe('DestinationCheckboxGroup.hooks', () => {
    describe('useDestinationSelectionHandlers', () => {
        beforeAll(() => {
            jest.spyOn(destinationUtils, 'getIDestinationByCode').mockImplementation((_, code) => {
                if (code === mockParent.code) {
                    return mockParentIDestination;
                }

                if (code === mockParent.children[0].code) {
                    return mockChildIDestination;
                }

                if (code === mockSecondChildCode) {
                    return mockSecondChildIDestination;
                }

                if (code === mockFirstChildRelatedRegionCode) {
                    return mockFirstChildRelatedRegionIDestination;
                }

                return undefined as any; // getIDestinationByCode can return undefined despite the returning IDestination type
            });
        });

        beforeEach(() => {
            mockProps = createMockProps();
        });

        describe('changeGroupSelection', () => {
            it('should add parent destination and all children when call with true', () => {
                const { result } = renderHook(() => useDestinationSelectionHandlers(mockProps));

                act(() => {
                    result.current.changeGroupSelection(true);
                });

                expect(mockProps.addDestination).toHaveBeenCalledTimes(1);
                expect(mockProps.addDestination).toHaveBeenCalledWith(mockParentIDestination, true);
                expect(mockProps.removeDestination).toHaveBeenCalledTimes(1);
                expect(mockProps.removeDestination).toHaveBeenCalledWith(mockChildIDestination, true);
                expect(mockProps.updateDestinationCodes).toHaveBeenCalled();
            });

            it('should remove parent destination and all children when call with false', () => {
                const { result } = renderHook(() => useDestinationSelectionHandlers(mockProps));

                act(() => {
                    result.current.changeGroupSelection(false);
                });

                expect(mockProps.removeDestination).toHaveBeenCalledTimes(2);
                expect(mockProps.removeDestination).toHaveBeenNthCalledWith(1, mockParentIDestination, true);
                expect(mockProps.removeDestination).toHaveBeenNthCalledWith(2, mockChildIDestination, true);
                expect(mockProps.updateDestinationCodes).toHaveBeenCalled();
            });
        });

        describe('changeItemSelection', () => {
            it('should not do anything when passed code is an empty string', () => {
                const { result } = renderHook(() => useDestinationSelectionHandlers(mockProps));

                act(() => {
                    result.current.changeItemSelection(true, '');
                });

                expect(mockProps.addDestination).not.toHaveBeenCalled();
                expect(mockProps.removeDestination).not.toHaveBeenCalled();
                expect(mockProps.updateDestinationCodes).not.toHaveBeenCalled();
            });

            it('should call changeGroupSelection functionality with true value when code is equal to parent code and isSelected passed as true', () => {
                const { result } = renderHook(() => useDestinationSelectionHandlers(mockProps));

                act(() => {
                    result.current.changeItemSelection(true, mockProps.parent.code);
                });

                expect(mockProps.addDestination).toHaveBeenCalledTimes(1);
                expect(mockProps.addDestination).toHaveBeenCalledWith(mockParentIDestination, true);
                expect(mockProps.removeDestination).toHaveBeenCalledTimes(1);
                expect(mockProps.removeDestination).toHaveBeenCalledWith(mockChildIDestination, true);
                expect(mockProps.updateDestinationCodes).toHaveBeenCalled();
            });

            it('should call changeGroupSelection functionality with false value when code is equal to parent code and isSelected passed as true', () => {
                const { result } = renderHook(() => useDestinationSelectionHandlers(mockProps));

                act(() => {
                    result.current.changeItemSelection(false, mockProps.parent.code);
                });

                expect(mockProps.removeDestination).toHaveBeenCalledTimes(2);
                expect(mockProps.removeDestination).toHaveBeenNthCalledWith(1, mockParentIDestination, true);
                expect(mockProps.removeDestination).toHaveBeenNthCalledWith(2, mockChildIDestination, true);
                expect(mockProps.updateDestinationCodes).toHaveBeenCalled();
            });

            describe('selectItem', () => {
                beforeEach(() => {
                    mockProps.isDisabledItem = jest.fn().mockReturnValue(false);
                    mockProps.isCheckedItem = jest.fn().mockReturnValue(true);
                });

                it('should call changeGroupSelection functionality with true when parent is not disabled and is already checked', () => {
                    const { result } = renderHook(() => useDestinationSelectionHandlers(mockProps));

                    act(() => {
                        result.current.changeItemSelection(true, mockProps.parent.children[0].code);
                    });

                    expect(mockProps.addDestination).toHaveBeenCalledTimes(1);
                    expect(mockProps.addDestination).toHaveBeenCalledWith(mockParentIDestination, true);
                    expect(mockProps.removeDestination).toHaveBeenCalledTimes(1);
                    expect(mockProps.removeDestination).toHaveBeenCalledWith(mockChildIDestination, true);
                    expect(mockProps.updateDestinationCodes).toHaveBeenCalled();
                });

                it('should call addDestination with child destination when parent is not checked', () => {
                    mockProps.isCheckedItem = jest.fn().mockReturnValue(false);

                    const { result } = renderHook(() => useDestinationSelectionHandlers(mockProps));

                    act(() => {
                        result.current.changeItemSelection(true, mockProps.parent.children[0].code);
                    });

                    expect(mockProps.addDestination).toHaveBeenCalledWith(mockChildIDestination, true);
                });

                it('should call addDestination with child destination when parent is disabled', () => {
                    mockProps.isDisabledItem = jest.fn().mockReturnValue(true);

                    const { result } = renderHook(() => useDestinationSelectionHandlers(mockProps));

                    act(() => {
                        result.current.changeItemSelection(true, mockProps.parent.children[0].code);
                    });

                    expect(mockProps.addDestination).toHaveBeenCalledWith(mockChildIDestination, true);
                });

                it('should call addDestination with parent destination when all children are selected', () => {
                    mockProps.isCheckedItem = jest.fn().mockReturnValue(false);
                    mockProps.availableDestinationsCodes = [mockParent.children[0].code];

                    const { result } = renderHook(() => useDestinationSelectionHandlers(mockProps));

                    act(() => {
                        result.current.changeItemSelection(true, mockProps.parent.children[0].code);
                    });

                    expect(mockProps.addDestination).toHaveBeenCalledWith(
                        { code: 'destination_code', name: 'destination_name' },
                        true,
                    );
                });

                it('should call addDestination with parent destination when availableDestinationsCodes is null and all children are selected', () => {
                    mockProps.isCheckedItem = jest.fn().mockReturnValue(false);
                    mockProps.availableDestinationsCodes = null; // null means all items are available for selection

                    const { result } = renderHook(() => useDestinationSelectionHandlers(mockProps));

                    act(() => {
                        result.current.changeItemSelection(true, mockProps.parent.children[0].code);
                    });

                    expect(mockProps.addDestination).toHaveBeenCalledWith(
                        { code: 'destination_code', name: 'destination_name' },
                        true,
                    );
                });

                it('should call addDestination with child destination when availableDestinationsCodes prop is an empty array', () => {
                    const parent = {
                        ...mockParent,
                        children: [
                            mockParent.children[0],
                            { ...mockParent.children[0], ...mockSecondChildIDestination },
                        ],
                    };
                    mockProps.isCheckedItem = jest.fn().mockReturnValue(false);
                    mockProps.availableDestinationsCodes = [parent.children[0].code, parent.children[1].code];
                    mockProps.parent = parent;

                    const { result } = renderHook(() => useDestinationSelectionHandlers(mockProps));

                    act(() => {
                        result.current.changeItemSelection(true, parent.children[0].code);
                    });

                    expect(mockProps.addDestination).toHaveBeenCalledWith(
                        { code: 'child_code', name: 'child_name', relatedRegions: ['related_region'] },
                        true,
                    );
                });

                it('should call addDestination with child destination when not all children are selected', () => {
                    mockProps.isCheckedItem = jest.fn().mockReturnValue(false);

                    const { result } = renderHook(() => useDestinationSelectionHandlers(mockProps));

                    act(() => {
                        result.current.changeItemSelection(true, mockProps.parent.children[0].code);
                    });

                    expect(mockProps.addDestination).toHaveBeenCalledWith(
                        { code: 'child_code', name: 'child_name', relatedRegions: ['related_region'] },
                        true,
                    );
                });

                it('should select parent when unavailable child exists but all available children are selected', () => {
                    const parent = {
                        ...mockParent,
                        children: [
                            { ...mockParent.children[0] },
                            { ...mockParent.children[0], code: 'unavailable_child' },
                        ],
                    };
                    mockProps.parent = parent;
                    mockProps.isCheckedItem = jest.fn().mockReturnValue(false);
                    mockProps.availableDestinationsCodes = [parent.children[0].code];

                    const { result } = renderHook(() => useDestinationSelectionHandlers(mockProps));

                    act(() => {
                        result.current.changeItemSelection(true, parent.children[0].code);
                    });

                    expect(mockProps.addDestination).toHaveBeenCalledWith(
                        { code: 'destination_code', name: 'destination_name' },
                        true,
                    );
                });
            });

            describe('unselectItem', () => {
                it('should remove destination and its related regions and virtual regions when isWholeGroupSelected is false', () => {
                    const unselectedChildCode = mockProps.parent.children[0].code;
                    mockProps.isCheckedItem = jest.fn().mockReturnValue(false); // isWholeGroupSelected value mock
                    mockProps.parent.children = [
                        { ...mockProps.parent.children[0], relatedRegions: [] },
                        // virtual region
                        {
                            ...mockProps.parent.children[0],
                            code: mockSecondChildCode,
                            relatedRegions: [unselectedChildCode],
                        },
                    ];

                    const { result } = renderHook(() => useDestinationSelectionHandlers(mockProps));

                    act(() => {
                        result.current.changeItemSelection(false, unselectedChildCode);
                    });

                    expect(mockProps.removeDestination).toHaveBeenCalledWith(
                        mockFirstChildRelatedRegionIDestination,
                        true,
                    );
                    expect(mockProps.removeDestination).toHaveBeenCalledWith(mockSecondChildIDestination, true);
                    expect(mockProps.removeDestination).toHaveBeenCalledWith(mockChildIDestination, true);
                });

                it('should call changeGroupSelection(false) when parent has only one child and whole group is selected', () => {
                    mockProps.isCheckedItem = jest.fn().mockReturnValue(true); // isWholeGroupSelected value mock

                    const { result } = renderHook(() => useDestinationSelectionHandlers(mockProps));

                    act(() => {
                        result.current.changeItemSelection(false, mockProps.parent.children[0].code);
                    });

                    expect(mockProps.removeDestination).toHaveBeenCalledTimes(2);
                    expect(mockProps.removeDestination).toHaveBeenNthCalledWith(1, mockParentIDestination, true);
                    expect(mockProps.removeDestination).toHaveBeenNthCalledWith(2, mockChildIDestination, true);
                    expect(mockProps.updateDestinationCodes).toHaveBeenCalled();
                });

                describe('regular flow', () => {
                    beforeEach(() => {
                        mockProps.isCheckedItem = jest.fn().mockReturnValue(true); // isWholeGroupSelected value mock
                        mockProps.parent.children = [
                            { ...mockProps.parent.children[0], relatedRegions: [] },
                            {
                                ...mockProps.parent.children[0],
                                code: mockSecondChildCode,
                                relatedRegions: [],
                            },
                        ];
                    });

                    it('should uncheck parent and add remaining available children when parent has more than 1 child, whole group is selected and availableCodes prop is not defined', () => {
                        const { result } = renderHook(() => useDestinationSelectionHandlers(mockProps));

                        act(() => {
                            result.current.changeItemSelection(false, mockProps.parent.children[0].code);
                        });

                        expect(mockProps.removeDestination).toHaveBeenCalledWith(mockParentIDestination, true);
                        expect(mockProps.addDestination).toHaveBeenCalledWith(mockSecondChildIDestination, true);
                    });

                    it('should uncheck parent and add remaining available children when parent has more than 1 child, whole group is selected and availableCodes prop includes code of another child code', () => {
                        mockProps.availableCodes = [mockSecondChildCode];

                        const { result } = renderHook(() => useDestinationSelectionHandlers(mockProps));

                        act(() => {
                            result.current.changeItemSelection(false, mockProps.parent.children[0].code);
                        });

                        expect(mockProps.removeDestination).toHaveBeenCalledWith(mockParentIDestination, true);
                        expect(mockProps.addDestination).toHaveBeenCalledWith(mockSecondChildIDestination, true);
                    });

                    it('should uncheck parent and NOT add remaining available children when availableCodes prop is not include another child code', () => {
                        mockProps.availableCodes = [];

                        const { result } = renderHook(() => useDestinationSelectionHandlers(mockProps));

                        act(() => {
                            result.current.changeItemSelection(false, mockProps.parent.children[0].code);
                        });

                        expect(mockProps.removeDestination).toHaveBeenCalledWith(mockParentIDestination, true);
                        expect(mockProps.addDestination).not.toHaveBeenCalled();
                    });
                });
            });
        });

        describe('Tracking', () => {
            describe('trackToRegionSelectAll', () => {
                it('should call trackToRegionSelectAll when changeGroupSelection is called with true', () => {
                    const { result } = renderHook(() => useDestinationSelectionHandlers(mockProps));

                    act(() => {
                        result.current.changeGroupSelection(true);
                    });

                    expect(mockProps.trackToRegionSelectAll).toHaveBeenCalledTimes(1);
                    expect(mockProps.trackToRegionSelectAll).toHaveBeenCalledWith(mockProps.parent, true);
                });

                it('should call trackToRegionSelectAll when changeGroupSelection is called with false', () => {
                    const { result } = renderHook(() => useDestinationSelectionHandlers(mockProps));

                    act(() => {
                        result.current.changeGroupSelection(false);
                    });

                    expect(mockProps.trackToRegionSelectAll).toHaveBeenCalledTimes(1);
                    expect(mockProps.trackToRegionSelectAll).toHaveBeenCalledWith(mockProps.parent, false);
                });

                it('should call trackToRegionSelectAll with correct parent data', () => {
                    const customParent = {
                        code: 'ESP',
                        name: 'Spain',
                        children: [
                            { code: 'BCN', name: 'Barcelona' },
                            { code: 'MAD', name: 'Madrid' },
                        ],
                    };
                    mockProps.parent = customParent;

                    const { result } = renderHook(() => useDestinationSelectionHandlers(mockProps));

                    act(() => {
                        result.current.changeGroupSelection(true);
                    });

                    expect(mockProps.trackToRegionSelectAll).toHaveBeenCalledWith(customParent, true);
                });
            });

            describe('trackToRegionSelectSingle', () => {
                it('should call trackToRegionSelectSingle when changeItemSelection is called with true', () => {
                    mockProps.isCheckedItem = jest.fn().mockReturnValue(false);

                    const { result } = renderHook(() => useDestinationSelectionHandlers(mockProps));

                    act(() => {
                        result.current.changeItemSelection(true, mockProps.parent.children[0].code);
                    });

                    expect(mockProps.trackToRegionSelectSingle).toHaveBeenCalledTimes(1);
                    expect(mockProps.trackToRegionSelectSingle).toHaveBeenCalledWith(
                        mockProps.parent,
                        mockProps.parent.children[0].code,
                        true,
                    );
                });

                it('should call trackToRegionSelectSingle when changeItemSelection is called with false', () => {
                    mockProps.isCheckedItem = jest.fn().mockReturnValue(false);

                    const { result } = renderHook(() => useDestinationSelectionHandlers(mockProps));

                    act(() => {
                        result.current.changeItemSelection(false, mockProps.parent.children[0].code);
                    });

                    expect(mockProps.trackToRegionSelectSingle).toHaveBeenCalledTimes(1);
                    expect(mockProps.trackToRegionSelectSingle).toHaveBeenCalledWith(
                        mockProps.parent,
                        mockProps.parent.children[0].code,
                        false,
                    );
                });

                it('should NOT call trackToRegionSelectSingle when changeItemSelection is called with empty code', () => {
                    const { result } = renderHook(() => useDestinationSelectionHandlers(mockProps));

                    act(() => {
                        result.current.changeItemSelection(true, '');
                    });

                    expect(mockProps.trackToRegionSelectSingle).not.toHaveBeenCalled();
                });

                it('should NOT call trackToRegionSelectSingle when code equals parent code (uses changeGroupSelection instead)', () => {
                    const { result } = renderHook(() => useDestinationSelectionHandlers(mockProps));

                    act(() => {
                        result.current.changeItemSelection(true, mockProps.parent.code);
                    });

                    expect(mockProps.trackToRegionSelectSingle).not.toHaveBeenCalled();
                    expect(mockProps.trackToRegionSelectAll).toHaveBeenCalledTimes(1);
                });

                it('should call trackToRegionSelectSingle with correct child code', () => {
                    mockProps.isCheckedItem = jest.fn().mockReturnValue(false);
                    mockProps.parent.children = [
                        { ...mockProps.parent.children[0], relatedRegions: [] },
                        {
                            ...mockProps.parent.children[0],
                            code: mockSecondChildCode,
                            relatedRegions: [],
                        },
                    ];

                    const { result } = renderHook(() => useDestinationSelectionHandlers(mockProps));

                    act(() => {
                        result.current.changeItemSelection(true, mockSecondChildCode);
                    });

                    expect(mockProps.trackToRegionSelectSingle).toHaveBeenCalledWith(
                        mockProps.parent,
                        mockSecondChildCode,
                        true,
                    );
                });
            });

            describe('Tracking execution order', () => {
                it('should call updateDestinationCodes before trackToRegionSelectAll', () => {
                    const callOrder: string[] = [];
                    mockProps.updateDestinationCodes = jest.fn(() => callOrder.push('updateDestinationCodes'));
                    mockProps.trackToRegionSelectAll = jest.fn(() => callOrder.push('trackToRegionSelectAll'));

                    const { result } = renderHook(() => useDestinationSelectionHandlers(mockProps));

                    act(() => {
                        result.current.changeGroupSelection(true);
                    });

                    expect(callOrder).toEqual(['updateDestinationCodes', 'trackToRegionSelectAll']);
                });

                it('should call updateDestinationCodes before trackToRegionSelectSingle', () => {
                    const callOrder: string[] = [];
                    mockProps.isCheckedItem = jest.fn().mockReturnValue(false);
                    mockProps.updateDestinationCodes = jest.fn(() => callOrder.push('updateDestinationCodes'));
                    mockProps.trackToRegionSelectSingle = jest.fn(() => callOrder.push('trackToRegionSelectSingle'));

                    const { result } = renderHook(() => useDestinationSelectionHandlers(mockProps));

                    act(() => {
                        result.current.changeItemSelection(true, mockProps.parent.children[0].code);
                    });

                    expect(callOrder).toEqual(['updateDestinationCodes', 'trackToRegionSelectSingle']);
                });
            });
        });
    });
});
