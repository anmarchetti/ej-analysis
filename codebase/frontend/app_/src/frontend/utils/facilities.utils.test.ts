import { IFacilityGroup, IImage } from 'models/data/IHotel';
import { VirtualFacilityGroupCode } from 'models/enum/VirtualFacilityGroupCode';

import { filterOutOverviewGroup, shouldRenderFacilityItems } from './facilities.utils';

describe('facilities.utils', () => {
    describe('shouldRenderFacilityItems', () => {
        const mockFacilityItem = {
            code: 'FAC001',
            name: 'Test Facility',
        };

        it('should return false when facilityGroup has no items', () => {
            const facilityGroup: IFacilityGroup = {
                code: 'TEST',
                description: 'Test Description',
                iconUrl: '',
                id: '123',
                image: {} as IImage,
                items: [],
                name: 'Test Group',
                title: 'Test Title',
            };

            expect(shouldRenderFacilityItems(facilityGroup)).toBe(false);
        });

        it('should return false when facilityGroup code is Overview', () => {
            const facilityGroup: IFacilityGroup = {
                code: VirtualFacilityGroupCode.Overview,
                description: 'Overview Description',
                iconUrl: '',
                id: '123',
                image: {} as IImage,
                items: [mockFacilityItem],
                name: 'Overview',
                title: 'Overview',
            };

            expect(shouldRenderFacilityItems(facilityGroup)).toBe(false);
        });

        it('should return false when facilityGroup is FoodAndDrink with description', () => {
            const facilityGroup: IFacilityGroup = {
                code: VirtualFacilityGroupCode.FoodAndDrink,
                description: 'Food and Drink description with hardcoded facilities',
                iconUrl: '',
                id: '123',
                image: {} as IImage,
                items: [mockFacilityItem],
                name: 'Food & Drink',
                title: 'Food & Drink',
            };

            expect(shouldRenderFacilityItems(facilityGroup)).toBe(false);
        });

        it('should return true when facilityGroup is FoodAndDrink without description', () => {
            const facilityGroup: IFacilityGroup = {
                code: VirtualFacilityGroupCode.FoodAndDrink,
                description: '',
                iconUrl: '',
                id: '123',
                image: {} as IImage,
                items: [mockFacilityItem],
                name: 'Food & Drink',
                title: 'Food & Drink',
            };

            expect(shouldRenderFacilityItems(facilityGroup)).toBe(true);
        });

        it('should return false when facilityGroup is FamilyFacility with description', () => {
            const facilityGroup: IFacilityGroup = {
                code: VirtualFacilityGroupCode.FamilyFacility,
                description: 'Family facilities description with hardcoded facilities',
                iconUrl: '',
                id: '123',
                image: {} as IImage,
                items: [mockFacilityItem],
                name: 'Family Facilities',
                title: 'Family Facilities',
            };

            expect(shouldRenderFacilityItems(facilityGroup)).toBe(false);
        });

        it('should return true when facilityGroup is FamilyFacility without description', () => {
            const facilityGroup: IFacilityGroup = {
                code: VirtualFacilityGroupCode.FamilyFacility,
                description: '',
                iconUrl: '',
                id: '123',
                image: {} as IImage,
                items: [mockFacilityItem],
                name: 'Family Facilities',
                title: 'Family Facilities',
            };

            expect(shouldRenderFacilityItems(facilityGroup)).toBe(true);
        });

        it('should return true when facilityGroup is a regular group with items', () => {
            const facilityGroup: IFacilityGroup = {
                code: VirtualFacilityGroupCode.SportsAndHealth,
                description: 'Sports and Health description',
                iconUrl: '',
                id: '123',
                image: {} as IImage,
                items: [mockFacilityItem],
                name: 'Sports & Health',
                title: 'Sports & Health',
            };

            expect(shouldRenderFacilityItems(facilityGroup)).toBe(true);
        });

        it('should return true when facilityGroup is Accommodation with items', () => {
            const facilityGroup: IFacilityGroup = {
                code: VirtualFacilityGroupCode.Accommodation,
                description: '',
                iconUrl: '',
                id: '123',
                image: {} as IImage,
                items: [mockFacilityItem],
                name: 'Accommodation',
                title: 'Accommodation',
            };

            expect(shouldRenderFacilityItems(facilityGroup)).toBe(true);
        });

        it('should return true when facilityGroup is Entertainment with items and description', () => {
            const facilityGroup: IFacilityGroup = {
                code: VirtualFacilityGroupCode.Entertainment,
                description: 'Entertainment description',
                iconUrl: '',
                id: '123',
                image: {} as IImage,
                items: [mockFacilityItem],
                name: 'Entertainment',
                title: 'Entertainment',
            };

            expect(shouldRenderFacilityItems(facilityGroup)).toBe(true);
        });
    });

    describe('filterOutOverviewGroup', () => {
        const mockFacilityGroups: IFacilityGroup[] = [
            {
                code: VirtualFacilityGroupCode.Accommodation,
                description: '',
                iconUrl: '',
                id: '1',
                image: {} as IImage,
                items: [],
                name: 'Accommodation',
                title: 'Accommodation',
            },
            {
                code: VirtualFacilityGroupCode.Overview,
                description: '',
                iconUrl: '',
                id: '2',
                image: {} as IImage,
                items: [],
                name: 'Overview',
                title: 'Overview',
            },
            {
                code: VirtualFacilityGroupCode.FoodAndDrink,
                description: '',
                iconUrl: '',
                id: '3',
                image: {} as IImage,
                items: [],
                name: 'Food & Drink',
                title: 'Food & Drink',
            },
        ];

        it('should return all groups when isEcoFacility is true', () => {
            const result = filterOutOverviewGroup(mockFacilityGroups, true);

            expect(result).toHaveLength(3);
            expect(result).toEqual(mockFacilityGroups);
        });

        it('should filter out Overview group without description when isEcoFacility is false', () => {
            const result = filterOutOverviewGroup(mockFacilityGroups, false);

            expect(result).toHaveLength(2);
            expect(result.some(group => group.code === VirtualFacilityGroupCode.Overview)).toBe(false);
            expect(result.some(group => group.code === VirtualFacilityGroupCode.Accommodation)).toBe(true);
            expect(result.some(group => group.code === VirtualFacilityGroupCode.FoodAndDrink)).toBe(true);
        });

        it('should keep Overview group with description when isEcoFacility is false', () => {
            const groupsWithOverviewDescription: IFacilityGroup[] = [
                {
                    code: VirtualFacilityGroupCode.Accommodation,
                    description: '',
                    iconUrl: '',
                    id: '1',
                    image: {} as IImage,
                    items: [],
                    name: 'Accommodation',
                    title: 'Accommodation',
                },
                {
                    code: VirtualFacilityGroupCode.Overview,
                    description: 'This is an overview description',
                    iconUrl: '',
                    id: '2',
                    image: {} as IImage,
                    items: [],
                    name: 'Overview',
                    title: 'Overview',
                },
            ];

            const result = filterOutOverviewGroup(groupsWithOverviewDescription, false);

            expect(result).toHaveLength(2);
            expect(result.some(group => group.code === VirtualFacilityGroupCode.Overview)).toBe(true);
        });

        it('should return all non-Overview groups when isEcoFacility is false', () => {
            const groupsWithoutOverview: IFacilityGroup[] = [
                {
                    code: VirtualFacilityGroupCode.Accommodation,
                    description: '',
                    iconUrl: '',
                    id: '1',
                    image: {} as IImage,
                    items: [],
                    name: 'Accommodation',
                    title: 'Accommodation',
                },
                {
                    code: VirtualFacilityGroupCode.SportsAndHealth,
                    description: '',
                    iconUrl: '',
                    id: '3',
                    image: {} as IImage,
                    items: [],
                    name: 'Sports & Health',
                    title: 'Sports & Health',
                },
            ];

            const result = filterOutOverviewGroup(groupsWithoutOverview, false);

            expect(result).toHaveLength(2);
            expect(result).toEqual(groupsWithoutOverview);
        });

        it('should handle empty array', () => {
            const result = filterOutOverviewGroup([], false);

            expect(result).toHaveLength(0);
            expect(result).toEqual([]);
        });

        it('should return empty array for eco facility with empty input', () => {
            const result = filterOutOverviewGroup([], true);

            expect(result).toHaveLength(0);
            expect(result).toEqual([]);
        });
    });
});
