import { mockSitecoreField, mockSitecoreImageField, mockSitecoreLinkField } from 'frontend/utils/tests.utils';

import { collapsibleLinksParamsMock } from './__mocks__/collapsibleLinksMocks';
import { useCollapsibleLinksByColumns, useMaxVisibleLinksInColumn } from './CollapsibleLinks.hooks';

let mockIsBackend = false;
jest.mock('frontend/utils/isBackend', () => ({
    __esModule: true,
    default: jest.fn(() => mockIsBackend),
}));

let mockIsMobileViewport = false;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useXSMobileViewport: () => mockIsMobileViewport,
}));

describe('CollapsibleLinks.hooks', () => {
    describe('useCollapsibleLinksByColumns', () => {
        const fields = {
            Pages: [
                {
                    Url: 'url-1',
                    Name: 'name-1',
                    Id: '1',
                },
                {
                    Url: 'url-2',
                    Name: 'name-2',
                    Id: '2',
                },
                {
                    Url: 'url-3',
                    Name: 'name-3',
                    Id: '3',
                },
            ],
            Links: [
                { fields: { Link: { ...mockSitecoreField(mockSitecoreLinkField('link-1', 'link-1')) } }, id: '1' },
                { fields: { Link: { ...mockSitecoreField(mockSitecoreLinkField('link-2', 'link-2')) } }, id: '1' },
                { fields: { Link: { ...mockSitecoreField(mockSitecoreLinkField('link-3', 'link-3')) } }, id: '1' },
                { fields: { Link: { ...mockSitecoreField(mockSitecoreLinkField('link-4', 'link-4')) } }, id: '1' },
            ],
            Icon: mockSitecoreField(mockSitecoreImageField('img')),
            Subtitle: mockSitecoreField('Subtitle'),
            Title: mockSitecoreField('Title'),
        };

        it('return correct object for desktop based on Pages field', () => {
            const res = useCollapsibleLinksByColumns(fields, collapsibleLinksParamsMock);

            expect(res).toEqual({
                links: [
                    {
                        value: {
                            href: 'url-1',
                            text: 'name-1',
                            id: '1',
                            linktype: 'internal',
                            target: '_blank',
                        },
                    },
                    {
                        value: {
                            href: 'url-2',
                            text: 'name-2',
                            id: '2',
                            linktype: 'internal',
                            target: '_blank',
                        },
                    },
                    {
                        value: {
                            href: 'url-3',
                            text: 'name-3',
                            id: '3',
                            linktype: 'internal',
                            target: '_blank',
                        },
                    },
                ],
                linksByColumns: [
                    [
                        {
                            value: {
                                href: 'url-1',
                                text: 'name-1',
                                id: '1',
                                linktype: 'internal',
                                target: '_blank',
                            },
                        },
                    ],
                    [
                        {
                            value: {
                                href: 'url-2',
                                text: 'name-2',
                                id: '2',
                                linktype: 'internal',
                                target: '_blank',
                            },
                        },
                    ],
                    [
                        {
                            value: {
                                href: 'url-3',
                                text: 'name-3',
                                id: '3',
                                linktype: 'internal',
                                target: '_blank',
                            },
                        },
                    ],
                ],
                numberOfColumns: 3,
            });
        });

        it('return correct object for mobile based on Links field', () => {
            fields.Pages = [];
            mockIsMobileViewport = true;

            const res = useCollapsibleLinksByColumns(fields, collapsibleLinksParamsMock);

            expect(res).toEqual({
                links: [
                    {
                        value: {
                            href: 'link-1',
                            text: 'link-1',
                            linktype: undefined,
                        },
                    },
                    {
                        value: {
                            href: 'link-2',
                            text: 'link-2',
                            linktype: undefined,
                        },
                    },
                    {
                        value: {
                            href: 'link-3',
                            text: 'link-3',
                            linktype: undefined,
                        },
                    },
                    {
                        value: {
                            href: 'link-4',
                            text: 'link-4',
                            linktype: undefined,
                        },
                    },
                ],
                linksByColumns: [
                    [
                        {
                            value: {
                                href: 'link-1',
                                text: 'link-1',
                                linktype: undefined,
                            },
                        },
                        {
                            value: {
                                href: 'link-2',
                                text: 'link-2',
                                linktype: undefined,
                            },
                        },
                    ],
                    [
                        {
                            value: {
                                href: 'link-3',
                                text: 'link-3',
                                linktype: undefined,
                            },
                        },
                        {
                            value: {
                                href: 'link-4',
                                text: 'link-4',
                                linktype: undefined,
                            },
                        },
                    ],
                ],
                numberOfColumns: 2,
            });
            mockIsMobileViewport = false;
        });
    });

    describe('useMaxVisibleLinksInColumn', () => {
        it('should calculate based on totalLinksNumber when call on server side', () => {
            mockIsBackend = true;

            const res = useMaxVisibleLinksInColumn(false, 5, 3, 2);

            expect(res).toBe(3);

            mockIsBackend = false;
        });

        it('should calculate based on totalLinksNumber when isBlockExpanded=true AND isExtraSmall=false ', () => {
            const res = useMaxVisibleLinksInColumn(true, 5, 3, 2);

            expect(res).toBe(3);
        });

        it('should calculate based on totalInitialVisibleLinks when isBlockExpanded=false ', () => {
            const res = useMaxVisibleLinksInColumn(false, 5, 3, 2);

            expect(res).toBe(2);
        });

        it('should calculate based on totalInitialVisibleLinks when isBlockExpanded=false ', () => {
            mockIsMobileViewport = true;

            const res = useMaxVisibleLinksInColumn(true, 5, 3, 2);

            expect(res).toBe(2);
        });
    });
});
