import { webApiUrls } from 'code/endpoints';
import { ApiError } from 'models/data/ApiError';

import HelpCenterService from './helpCenter.service';

const mockAxiosPost = jest.fn();

jest.mock('axios', () => ({
    create: () => ({
        post: mockAxiosPost,
    }),
    isCancel: () => jest.fn(),
    isAxiosError: jest.fn(),
}));

describe('HelpCenterService', () => {
    beforeEach(() => {
        jest.restoreAllMocks();
    });

    describe('saveFeedback', () => {
        it('should call axios post with correct data', async () => {
            mockAxiosPost.mockResolvedValueOnce({ data: 'result' });
            await HelpCenterService.saveFeedback(
                'question',
                1,
                'comment',
                'localTime',
                'bookingMarketCode',
                'bookingType',
            );

            expect(mockAxiosPost).toHaveBeenCalledWith(
                webApiUrls.saveFeedback(),
                {
                    comment: 'comment',
                    icon: 1,
                    localTime: 'localTime',
                    marketCode: 'bookingMarketCode',
                    question: 'question',
                    bookingType: 'bookingType',
                },
                undefined,
            );
        });

        it('should throw error', async () => {
            mockAxiosPost.mockRejectedValueOnce(new ApiError({} as any));

            try {
                await HelpCenterService.saveFeedback(
                    'question',
                    1,
                    'comment',
                    'localTime',
                    'bookingMarketCode',
                    'bookingType',
                );
            } catch (e) {
                expect(e.message).toBe('');
            }
        });
    });

    describe('saveQuestionFeedback', () => {
        it('should call axios post with correct data', async () => {
            mockAxiosPost.mockResolvedValueOnce({ data: 'result' });
            await HelpCenterService.saveQuestionFeedback('question', 'questionHeader', false, 'text', 'localTime');

            expect(mockAxiosPost).toHaveBeenCalledWith(
                webApiUrls.saveFaqFeedback(),
                {
                    localTime: 'localTime',
                    question: 'question',
                    questionHeader: 'questionHeader',
                    text: 'text',
                    wasUseful: false,
                },
                undefined,
            );
        });

        it('should throw error', async () => {
            mockAxiosPost.mockRejectedValueOnce(new ApiError({} as any));

            try {
                await HelpCenterService.saveQuestionFeedback('question', 'questionHeader', false, 'text', 'localTime');
            } catch (e) {
                expect(e.message).toBe('');
            }
        });
    });

    describe('sendContactForm', () => {
        it('should call axios post with correct data', async () => {
            mockAxiosPost.mockResolvedValueOnce({ data: 'result' });
            await HelpCenterService.sendContactForm(new FormData(), 'captcha');

            expect(mockAxiosPost).toHaveBeenCalled();
        });

        it('should throw error', async () => {
            mockAxiosPost.mockRejectedValueOnce(new ApiError({} as any));

            try {
                await HelpCenterService.sendContactForm(new FormData(), 'captcha');
            } catch (e) {
                expect(e.message).toBe('');
            }
        });
    });
});
