import { cmsUrls } from 'code/endpoints';
import { ApiError } from 'models/data/ApiError';

import SitecoreService from './sitecore.service';

const mockAxiosGet = jest.fn();
const mockAxiosPost = jest.fn();
const mockAxiosDelete = jest.fn();
const mockAxiosPatch = jest.fn();

jest.mock('axios', () => ({
    create: () => ({
        get: mockAxiosGet,
        post: mockAxiosPost,
        delete: mockAxiosDelete,
        patch: mockAxiosPatch,
    }),
    isCancel: () => jest.fn(),
    isAxiosError: jest.fn(),
}));

describe('SitecoreService', () => {
    beforeEach(() => {
        jest.restoreAllMocks();
    });

    describe('getItemDetails', () => {
        it('should call axios get with correct data', async () => {
            mockAxiosGet.mockResolvedValueOnce({ data: 'result' });
            const itemId = 'itemId';
            const fields = 'fields';
            const lang = 'en';
            await SitecoreService.getItemDetails(itemId, fields, lang);

            expect(mockAxiosGet).toHaveBeenCalledWith(cmsUrls.itemDetails(itemId, fields, lang), {
                headers: { 'Cache-Control': 'no-cache, no-store', Expires: '0', Pragma: 'no-cache' },
            });
        });

        it('should throw error', async () => {
            mockAxiosGet.mockRejectedValueOnce(new ApiError({} as any));

            try {
                await SitecoreService.getItemDetails('itemId', 'fields');
            } catch (e) {
                expect(e.message).toBe('');
            }
        });
    });

    describe('getItemChildren', () => {
        it('should call axios get with correct data', async () => {
            mockAxiosGet.mockResolvedValueOnce({ data: 'result' });
            const itemId = 'itemId';
            const fields = 'fields';
            const includeStandardTemplateFields = true;
            const lang = 'en';
            await SitecoreService.getItemChildren(itemId, fields, includeStandardTemplateFields, lang);

            expect(mockAxiosGet).toHaveBeenCalledWith(
                cmsUrls.itemChildren(itemId, fields, includeStandardTemplateFields, lang),
                undefined,
            );
        });

        it('should throw error', async () => {
            mockAxiosGet.mockRejectedValueOnce(new ApiError({} as any));

            try {
                await SitecoreService.getItemChildren('itemId', 'fields');
            } catch (e) {
                expect(e.message).toBe('');
            }
        });
    });

    describe('createItem', () => {
        it('should call axios post with correct data', async () => {
            mockAxiosPost.mockResolvedValueOnce({ data: 'result' });
            const parentPath = 'parentPath';
            const body = {};
            const lang = 'en';
            await SitecoreService.createItem(parentPath, body, lang);

            expect(mockAxiosPost).toHaveBeenCalledWith(cmsUrls.createItem(parentPath, lang), body, undefined);
        });

        it('should throw error', async () => {
            mockAxiosPost.mockRejectedValueOnce(new ApiError({} as any));

            try {
                await SitecoreService.createItem('parentPath', {});
            } catch (e) {
                expect(e.message).toBe('');
            }
        });
    });

    describe('deleteItem', () => {
        it('should call axios delete with correct data', async () => {
            mockAxiosDelete.mockResolvedValueOnce({ data: 'result' });
            const itemId = 'itemId';
            const lang = 'en';
            await SitecoreService.deleteItem(itemId, lang);

            expect(mockAxiosDelete).toHaveBeenCalledWith(cmsUrls.deleteItem(itemId, lang), undefined);
        });

        it('should throw error', async () => {
            mockAxiosDelete.mockRejectedValueOnce(new ApiError({} as any));

            try {
                await SitecoreService.deleteItem('itemId');
            } catch (e) {
                expect(e.message).toBe('');
            }
        });
    });

    describe('editItem', () => {
        it('should call axios patch and return correct data', async () => {
            mockAxiosPatch.mockResolvedValueOnce({ data: 'result' });
            const itemId = 'itemId';
            const body = {};
            const lang = 'en';
            await SitecoreService.editItem(itemId, body, lang);

            expect(mockAxiosPatch).toHaveBeenCalledWith(cmsUrls.itemDetails(itemId, '', lang), body, undefined);
        });

        it('should throw error', async () => {
            mockAxiosPatch.mockRejectedValueOnce(new ApiError({} as any));

            try {
                await SitecoreService.editItem('itemId', {}, 'en');
            } catch (e) {
                expect(e.message).toBe('');
            }
        });
    });

    describe('getVirtualFacilityGroupIdByFacilityId', () => {
        it('should call axios get with correct data', async () => {
            mockAxiosGet.mockResolvedValueOnce({ data: 'result' });
            const itemId = 'itemId';
            const lang = 'en';
            await SitecoreService.getVirtualFacilityGroupIdByFacilityId(itemId, lang);

            expect(mockAxiosGet).toHaveBeenCalledWith(
                cmsUrls.getVirtualFacilityGroupIdByFacilityId(itemId, lang),
                undefined,
            );
        });

        it('should throw error', async () => {
            mockAxiosGet.mockRejectedValueOnce(new ApiError({} as any));

            try {
                await SitecoreService.getVirtualFacilityGroupIdByFacilityId('itemId', 'en');
            } catch (e) {
                expect(e.message).toBe('');
            }
        });
    });

    describe('sortItems', () => {
        it('should call axios post with correct data', async () => {
            mockAxiosPost.mockResolvedValueOnce({ data: 'result' });
            const body = {} as any;
            const lang = 'en';
            await SitecoreService.sortItems(body, lang);

            expect(mockAxiosPost).toHaveBeenCalledWith(cmsUrls.sortItems(lang), body, undefined);
        });

        it('should throw error', async () => {
            mockAxiosPost.mockRejectedValueOnce(new ApiError({} as any));

            try {
                await SitecoreService.sortItems({} as any, 'en');
            } catch (e) {
                expect(e.message).toBe('');
            }
        });
    });

    describe('deleteItems', () => {
        it('should call axios post with correct data', async () => {
            mockAxiosPost.mockResolvedValueOnce({ data: 'result' });
            const items = ['id1', 'id2'] as any;
            const lang = 'en';
            await SitecoreService.deleteItems(items, lang);

            expect(mockAxiosPost).toHaveBeenCalledWith(cmsUrls.deleteItems(lang), items, undefined);
        });

        it('should throw error', async () => {
            mockAxiosPost.mockRejectedValueOnce(new ApiError({} as any));

            try {
                await SitecoreService.deleteItems(['id1', 'id2'] as any, 'en');
            } catch (e) {
                expect(e.message).toBe('');
            }
        });
    });

    describe('getPlaceholdersLayout', () => {
        it('should call axios get with correct data', async () => {
            mockAxiosGet.mockResolvedValueOnce({ data: 'result' });
            const path = 'path';
            const placeholders = ['placeholder1'];
            const lang = 'en';
            await SitecoreService.getPlaceholdersLayout(path, placeholders, lang);

            expect(mockAxiosGet).toHaveBeenCalledWith(cmsUrls.placeholdersLayout(path, placeholders, lang), undefined);
        });

        it('should throw error', async () => {
            mockAxiosGet.mockRejectedValueOnce(new ApiError({} as any));

            try {
                await SitecoreService.getPlaceholdersLayout('path', [], 'en');
            } catch (e) {
                expect(e.message).toBe('');
            }
        });
    });

    describe('getHotelImage', () => {
        it('should return hotel image Small URL when hotel image is available', async () => {
            const mockImageObject = {
                Id: 'mock-id-123',
                Small: '/mock-hotel-small.jpg',
                Medium: '/mock-hotel-medium.jpg',
                Large: '/mock-hotel-large.jpg',
                Description: '',
            };
            mockAxiosGet.mockResolvedValueOnce({ data: mockImageObject });

            const result = await SitecoreService.getHotelImage('MOCKHOTEL', 'MOCKRESORT');

            expect(mockAxiosGet).toHaveBeenCalledWith(cmsUrls.getHotelImage('MOCKHOTEL'), undefined);
            expect(result).toBe(mockImageObject.Small);
        });

        it('should fallback to resort image when hotel image fails', async () => {
            const mockResortImagePath = '/mock-resort.jpg';
            mockAxiosGet
                .mockRejectedValueOnce(new Error('Hotel image not found'))
                .mockResolvedValueOnce({ data: mockResortImagePath });

            const result = await SitecoreService.getHotelImage('MOCKHOTEL', 'MOCKRESORT');

            expect(mockAxiosGet).toHaveBeenCalledWith(cmsUrls.getHotelImage('MOCKHOTEL'), undefined);
            expect(mockAxiosGet).toHaveBeenCalledWith(cmsUrls.getDestinationImage('MOCKRESORT'), undefined);
            expect(result).toBe(mockResortImagePath);
        });

        it('should fallback to resort image when hotel image Small is empty', async () => {
            const mockResortImagePath = '/mock-resort.jpg';
            const mockImageObjectWithoutSmall = {
                Id: 'mock-id-456',
                Small: '',
                Medium: '/mock-hotel-medium.jpg',
                Large: '/mock-hotel-large.jpg',
                Description: '',
            };
            mockAxiosGet
                .mockResolvedValueOnce({ data: mockImageObjectWithoutSmall })
                .mockResolvedValueOnce({ data: mockResortImagePath });

            const result = await SitecoreService.getHotelImage('MOCKHOTEL', 'MOCKRESORT');

            expect(mockAxiosGet).toHaveBeenCalledWith(cmsUrls.getHotelImage('MOCKHOTEL'), undefined);
            expect(mockAxiosGet).toHaveBeenCalledWith(cmsUrls.getDestinationImage('MOCKRESORT'), undefined);
            expect(result).toBe(mockResortImagePath);
        });

        it('should fallback to resort image when hotel image Small is whitespace', async () => {
            const mockResortImagePath = '/mock-resort.jpg';
            const mockImageObjectWithWhitespace = {
                Id: 'mock-id-789',
                Small: '   ',
                Medium: '/mock-hotel-medium.jpg',
                Large: '/mock-hotel-large.jpg',
                Description: '',
            };
            mockAxiosGet
                .mockResolvedValueOnce({ data: mockImageObjectWithWhitespace })
                .mockResolvedValueOnce({ data: mockResortImagePath });

            const result = await SitecoreService.getHotelImage('MOCKHOTEL', 'MOCKRESORT');

            expect(mockAxiosGet).toHaveBeenCalledWith(cmsUrls.getHotelImage('MOCKHOTEL'), undefined);
            expect(mockAxiosGet).toHaveBeenCalledWith(cmsUrls.getDestinationImage('MOCKRESORT'), undefined);
            expect(result).toBe(mockResortImagePath);
        });

        it('should return null when both hotel and resort images fail', async () => {
            mockAxiosGet
                .mockRejectedValueOnce(new Error('Hotel image not found'))
                .mockRejectedValueOnce(new Error('Resort image not found'));

            const result = await SitecoreService.getHotelImage('MOCKHOTEL', 'MOCKRESORT');

            expect(result).toBeNull();
        });

        it('should return null when resort image response is empty', async () => {
            mockAxiosGet.mockRejectedValueOnce(new Error('Hotel image not found')).mockResolvedValueOnce({ data: '' });

            const result = await SitecoreService.getHotelImage('MOCKHOTEL', 'MOCKRESORT');

            expect(result).toBeNull();
        });

        it('should return null when resort image response is not a string', async () => {
            mockAxiosGet
                .mockRejectedValueOnce(new Error('Hotel image not found'))
                .mockResolvedValueOnce({ data: { invalid: 'object' } });

            const result = await SitecoreService.getHotelImage('MOCKHOTEL', 'MOCKRESORT');

            expect(result).toBeNull();
        });
    });
});
