import { ComponentRendering } from '@sitecore-jss/sitecore-jss-nextjs';

import { getLayoutMock } from 'frontend/__mocks__/layout';

import {
    filterPlaceholdersByIndex,
    getAllPlaceholdersPathsFromParentComponents,
    updateImagesWithLazyLoading,
} from './layout.utils';

let mockedRendering;
const createRendering = (): ComponentRendering => ({
    componentName: 'component 0 Name',
    placeholders: {
        test: [
            {
                componentName: 'component 1 Name',
            },
            {
                componentName: 'component 2 Name',
            },
        ],
        test1: [
            {
                componentName: 'component 3 Name',
            },
        ],
    },
});

describe('filterPlaceholdersByIndex', () => {
    beforeEach(() => {
        mockedRendering = createRendering();
    });

    it('should filterPlaceholdersByIndex', () => {
        expect(filterPlaceholdersByIndex(mockedRendering, 'test', 1)).toEqual({
            componentName: 'component 0 Name',
            placeholders: {
                test: [
                    {
                        componentName: 'component 2 Name',
                    },
                ],
                test1: [
                    {
                        componentName: 'component 3 Name',
                    },
                ],
            },
        });
    });

    it('should return empty placeholder list if index is out of bounds', () => {
        expect(filterPlaceholdersByIndex(mockedRendering, 'test', 2)).toEqual({
            componentName: 'component 0 Name',
            placeholders: {
                test: [],
                test1: [
                    {
                        componentName: 'component 3 Name',
                    },
                ],
            },
        });
    });

    it('should return the same object if placeholder does not exist', () => {
        expect(filterPlaceholdersByIndex(mockedRendering, 'test2', 0)).toEqual(mockedRendering);
    });
});

describe('getAllPlaceholdersPathsFromParentComponents', () => {
    it('should return AllPlaceholdersPathsFromParentComponents correctly', () => {
        const mockedComponents = [
            {
                component: {
                    componentName: 'componentName',
                    uid: 'uid1',
                },
                placeholderPath: 'path',
            },
            {
                component: {
                    componentName: 'componentName 3',
                    uid: 'uid3',
                    placeholders: {
                        ['test']: [],
                    },
                },
                placeholderPath: 'path 3',
            },
            {
                component: {
                    componentName: 'componentName 4',
                    uid: 'uid4',
                    placeholders: {
                        ['test']: [
                            {
                                componentName: 'inner componentName',
                            },
                        ],
                    },
                },
                placeholderPath: 'path 4',
            },
        ];

        expect(getAllPlaceholdersPathsFromParentComponents(mockedComponents)).toEqual([
            'path 3/test-{uid3}-0',
            'path 4/test-{uid4}-0',
        ]);
    });

    it('should filter repeated placeholder paths', () => {
        const mockedComponents = [
            {
                component: {
                    componentName: 'componentName 5',
                    uid: 'uid5',
                    placeholders: {
                        test: [
                            {
                                componentName: 'inner componentName',
                            },
                            {
                                componentName: 'inner componentName',
                            },
                        ],
                    },
                },
                placeholderPath: 'path 5',
            },
        ];
        expect(getAllPlaceholdersPathsFromParentComponents(mockedComponents)).toEqual(['path 5/test-{uid5}-0']);
    });
});

describe('updateImagesWithLazyLoading', () => {
    beforeEach(() => {
        mockedRendering = getLayoutMock();
    });

    it('should updateImagesWithLazyLoading', () => {
        expect(updateImagesWithLazyLoading(mockedRendering, 'DisableLazyLoading', 'Image', 'priority', true)).toEqual(
            getLayoutMock(true),
        );
    });

    it('should not updateImagesWithLazyLoading when DisableLazyLoading is not presented', () => {
        mockedRendering.sitecore.route.placeholders.body[0].params.DisableLazyLoading = undefined;
        expect(updateImagesWithLazyLoading(mockedRendering, 'DisableLazyLoading', 'Image', 'priority', true)).toEqual(
            mockedRendering,
        );
    });
});
