import { FileType } from 'models/enum/FileType';

import { FeedbackFormInfo, FeedbackFormInfoFields } from './FeedbackFormInfo';

let mockFeedback: FeedbackFormInfo;

describe('FeedbackFormInfo', () => {
    beforeEach(() => {
        mockFeedback = new FeedbackFormInfo({
            maxFileSize: 10,
            fileTypes: [FileType.Jpeg, FileType.Pdf],
            fileErrorLabel: 'fileErrorLabel',
            maxFileCount: 2,
        });
    });

    it('should return false "isValid"', () => {
        expect(mockFeedback.isValid).toBe(false);
    });

    it('should return error for booking reference with validateField', () => {
        expect(mockFeedback.validateField(FeedbackFormInfoFields.Email)[0].errorMessage).toBe(
            'Globals.ErrorMessages.EmailFieldRequired',
        );
    });

    it('should apply new values within onChangeField method', () => {
        mockFeedback.onChangeField(FeedbackFormInfoFields.Email, 'new_email');

        expect(mockFeedback[FeedbackFormInfoFields.Email]).toBe('new_email');
    });
});
