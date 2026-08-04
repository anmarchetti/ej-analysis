import { KeyboardEvent } from 'react';
import { act, renderHook } from '@testing-library/react';

import { IDestination } from 'models/data/IDestination';
import { IDestinationCountry } from 'models/data/IDestinationCountries';
import { DestinationType } from 'models/enum/DestinationType';
import { KeyboardKey } from 'models/enum/KeyboardKey';

import {
    findNextAvailablePlaceIndex,
    getSelectedCodes,
    handleSearchBarInputKeyDown,
    useSuggestionsPopupNavigation,
} from './useSuggestionsPopupNavigation';

describe('useSuggestionsPopupNavigation', () => {
    describe('getSelectedCodes', () => {
        let place: IDestinationCountry;
        let availableCodes;

        beforeEach(() => {
            place = {
                code: 'Group',
                name: 'GroupName',
                type: DestinationType.Group,
                children: [
                    { code: 'Resort1', type: DestinationType.Resort, name: 'Resort1Name' },
                    { code: 'Resort2', type: DestinationType.Resort, name: 'Resort2Name' },
                ],
            };
            availableCodes = null;
        });

        it("should return the place code when it's DestinationType is not a Group", () => {
            place = { ...place, type: DestinationType.Hotel };

            expect(getSelectedCodes(place, availableCodes)).toEqual([place.code]);
        });

        it('should return all child codes when place DestinationType is a Group and availableCodes is null', () => {
            expect(getSelectedCodes(place, availableCodes)).toEqual(['Resort1', 'Resort2']);
        });

        it('should return only matching child codes when availableCodes is provided', () => {
            availableCodes = ['Resort1'];

            expect(getSelectedCodes(place, availableCodes)).toEqual(['Resort1']);
        });

        it('should return an empty array if place is a group but has no children', () => {
            place = { ...place, children: [] };
            expect(getSelectedCodes(place, availableCodes)).toEqual([]);
        });

        it('should return an empty array if place is a group and no child codes match availableCodes', () => {
            availableCodes = ['Resort3'];

            expect(getSelectedCodes(place, availableCodes)).toEqual([]);
        });
    });

    describe('findNextAvailablePlaceIndex', () => {
        let places: Nullable<IDestinationCountry[] | IDestination[]>;
        let currentIndex;
        let delta;

        beforeEach(() => {
            places = [
                { code: 'A', name: 'testA', showOnSearchPod: false },
                { code: 'B', name: 'testB', showOnSearchPod: true },
                { code: 'C', name: 'testC', showOnSearchPod: true },
            ];
            currentIndex = 0;
            delta = 1;
        });

        describe('places is an empty array', () => {
            it('should return -1 when currentIndex is 0 and delta is 1', () => {
                places = [];

                expect(findNextAvailablePlaceIndex(places, currentIndex, delta)).toBe(-1);
            });

            it('should return -1 when currentIndex is -1 and delta is 1', () => {
                places = [];
                currentIndex = -1;

                expect(findNextAvailablePlaceIndex(places, currentIndex, delta)).toBe(-1);
            });

            it('should return -1 when currentIndex is 0 and delta is -1', () => {
                places = [];
                delta = -1;

                expect(findNextAvailablePlaceIndex(places, currentIndex, delta)).toBe(-1);
            });

            it('should return -1 when currentIndex is -1 and delta is -1', () => {
                places = [];
                currentIndex = -1;
                delta = -1;

                expect(findNextAvailablePlaceIndex(places, currentIndex, delta)).toBe(-1);
            });
        });

        it('should return -1 when places is null', () => {
            places = null;

            expect(findNextAvailablePlaceIndex(places, currentIndex, delta)).toBe(-1);
        });

        it('should find the next available place moving forward', () => {
            expect(findNextAvailablePlaceIndex(places, currentIndex, delta)).toBe(1);
        });

        it('should find the next available place moving backwards', () => {
            places = [
                { code: 'A', name: 'testA', showOnSearchPod: true },
                { code: 'B', name: 'testB', showOnSearchPod: false },
                { code: 'C', name: 'testC', showOnSearchPod: true },
            ];
            currentIndex = 2;
            delta = -1;

            expect(findNextAvailablePlaceIndex(places, currentIndex, delta)).toBe(0);
        });

        it('should return last index when currentIndex is last and item is shown on search pod', () => {
            places = [
                { code: 'A', name: 'testA', showOnSearchPod: true },
                { code: 'B', name: 'testB', showOnSearchPod: false },
                { code: 'C', name: 'testC', showOnSearchPod: true },
            ];
            currentIndex = 2;

            expect(findNextAvailablePlaceIndex(places, currentIndex, delta)).toBe(2);
        });

        it('should skip places where showOnSearchPod is false', () => {
            places = [
                { code: 'A', name: 'testA', showOnSearchPod: false },
                { code: 'B', name: 'testB', showOnSearchPod: false },
                { code: 'C', name: 'testC', showOnSearchPod: true },
            ];
            expect(findNextAvailablePlaceIndex(places, currentIndex, delta)).toBe(2);
        });

        it('should start from index 0 when currentIndex is -1', () => {
            currentIndex = -1;
            places = [
                { code: 'A', name: 'testA', showOnSearchPod: true },
                { code: 'B', name: 'testB', showOnSearchPod: false },
                { code: 'C', name: 'testC', showOnSearchPod: true },
            ];
            expect(findNextAvailablePlaceIndex(places, currentIndex, delta)).toBe(0);
        });
    });

    describe('handleSearchBarInputKeyDown', () => {
        let mockOnEnter: jest.Mock;
        let mockOnIndexUpdate: jest.Mock;

        beforeEach(() => {
            mockOnEnter = jest.fn();
            mockOnIndexUpdate = jest.fn();
        });

        it('should call onEnter when Enter key is pressed', () => {
            handleSearchBarInputKeyDown(
                {
                    key: KeyboardKey.ENTER,
                } as KeyboardEvent<HTMLInputElement>,
                mockOnEnter,
                mockOnIndexUpdate,
            );

            expect(mockOnEnter).toHaveBeenCalledTimes(1);
            expect(mockOnIndexUpdate).not.toHaveBeenCalled();
        });

        it('should call onIndexUpdate with -1 param value when ArrowUp key is pressed', () => {
            handleSearchBarInputKeyDown(
                {
                    key: KeyboardKey.ArrowUp,
                } as KeyboardEvent<HTMLInputElement>,
                mockOnEnter,
                mockOnIndexUpdate,
            );

            expect(mockOnIndexUpdate).toHaveBeenCalledWith(-1);
            expect(mockOnEnter).not.toHaveBeenCalled();
        });

        it('should call onIndexUpdate with 1 param value when ArrowDown key is pressed', () => {
            handleSearchBarInputKeyDown(
                {
                    key: KeyboardKey.ArrowDown,
                } as KeyboardEvent<HTMLInputElement>,
                mockOnEnter,
                mockOnIndexUpdate,
            );

            expect(mockOnIndexUpdate).toHaveBeenCalledWith(1);
            expect(mockOnEnter).not.toHaveBeenCalled();
        });

        it('should ignore when non-handled key is pressed', () => {
            handleSearchBarInputKeyDown(
                {
                    key: KeyboardKey.ArrowLeft,
                } as KeyboardEvent<HTMLInputElement>,
                mockOnEnter,
                mockOnIndexUpdate,
            );

            expect(mockOnEnter).not.toHaveBeenCalled();
            expect(mockOnIndexUpdate).not.toHaveBeenCalled();
        });
    });

    describe('useSuggestionsPopupNavigation', () => {
        let mockSelectCodes: jest.Mock;
        let mockFilteredPlaces: IDestinationCountry[];
        let mockAvailableOriginsCodes: string[] | null;

        beforeEach(() => {
            mockSelectCodes = jest.fn();
            mockFilteredPlaces = [
                {
                    name: 'Place 1',
                    code: 'P1',
                    type: DestinationType.Airport,
                    showOnSearchPod: true,
                },
                {
                    name: 'Place 2',
                    code: 'P2',
                    type: DestinationType.Airport,
                    showOnSearchPod: true,
                },
            ];
            mockAvailableOriginsCodes = ['P1', 'P2'];
        });

        it('should initialize popupItemHighlightedIdx with 0 value', () => {
            const { result } = renderHook(() =>
                useSuggestionsPopupNavigation(mockSelectCodes, mockFilteredPlaces, mockAvailableOriginsCodes),
            );

            expect(result.current.popupItemHighlightedIdx).toBe(0);
        });

        it('should reset popupItemHighlightedIdx to -1 on resetHighlightedIdx call', () => {
            const { result } = renderHook(() =>
                useSuggestionsPopupNavigation(mockSelectCodes, mockFilteredPlaces, mockAvailableOriginsCodes),
            );

            act(() => {
                result.current.sbInputKeyboardEvent({ key: 'ArrowDown' } as React.KeyboardEvent<HTMLInputElement>);
            });

            expect(result.current.popupItemHighlightedIdx).toBe(1);

            act(() => {
                result.current.resetHighlightedIdx();
            });

            expect(result.current.popupItemHighlightedIdx).toBe(0);
        });

        it('should update popupItemHighlightedIdx when sbInputKeyboardEvent handles ArrowUp or ArrowDown', () => {
            const { result } = renderHook(() =>
                useSuggestionsPopupNavigation(mockSelectCodes, mockFilteredPlaces, mockAvailableOriginsCodes),
            );

            act(() => {
                result.current.sbInputKeyboardEvent({ key: 'ArrowDown' } as React.KeyboardEvent<HTMLInputElement>);
            });

            expect(result.current.popupItemHighlightedIdx).toBe(1);

            act(() => {
                result.current.sbInputKeyboardEvent({ key: 'ArrowUp' } as React.KeyboardEvent<HTMLInputElement>);
            });

            expect(result.current.popupItemHighlightedIdx).toBe(0);
        });

        it('should call selectCodes when Enter key is pressed', () => {
            const { result } = renderHook(() =>
                useSuggestionsPopupNavigation(mockSelectCodes, mockFilteredPlaces, mockAvailableOriginsCodes),
            );

            act(() => {
                result.current.sbInputKeyboardEvent({ key: 'Enter' } as React.KeyboardEvent<HTMLInputElement>);
            });

            expect(mockSelectCodes).toHaveBeenCalledWith([mockFilteredPlaces[0].code], mockFilteredPlaces[0]);
        });
    });
});
