import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import helpCenterService from 'frontend/services/helpCenter.service';
import * as storageUtils from 'frontend/utils/webStorage.utils';
import { IFAQRatingById } from 'models/data/IFAQRatingFields';
import { MediaSize } from 'models/data/MediaSizeParams';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { WebStorageKeys } from 'models/enum/WebStorageKeys';
import { mockFAQRatingFields } from 'frontend/components/renderings/Help/__mocks__/mockFAQRatingFields';

import FaqRating, { IFaqRatingProps } from './FaqRating';

jest.mock('frontend/components/common/JSSImage', () => () => <div data-tid='jss-image' />);

const createProps = (): IFaqRatingProps => ({
    questionId: '123',
    categoryName: 'categoryName',
    questionName: 'questionName',
    categoryNavParameter: 'category',
    questionNavParameter: 'question',
    fields: mockFAQRatingFields,
});

const createStores = () =>
    createMockStores({
        layoutStore: {
            getPhrase: jest.fn(p => p),
        },
        trackingStore: {
            trackHelpWasUseful: jest.fn(),
        },
    });

let mockStores = createStores();
let mockProps = createProps();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockGetWebStorageItem: IFAQRatingById[] = [];
jest.mock('frontend/utils/webStorage.utils', () => ({
    __esModule: true,
    getWebStorageItem: jest.fn(() => mockGetWebStorageItem),
    removeWebStorageItem: jest.fn(),
    setWebStorageItem: jest.fn(),
}));

jest.mock('frontend/services/helpCenter.service', () => ({
    saveQuestionFeedback: jest.fn(),
}));

const mockDate = '01.10.2023';
jest.mock('frontend/utils/date.utils', () => ({
    formatDateL10n: jest.fn(() => mockDate),
}));

const mockButtonProps = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: props => {
        mockButtonProps(props);

        return (
            <button
                data-tid={props.dataTid}
                onClick={props.onClick}
                type={props.type || 'button'}
                disabled={props.disabled}
            >
                {props.children}
            </button>
        );
    },
}));

const mockJSSIMageNextProps = jest.fn();
jest.mock('frontend/components/common/JSSImageNext/JSSImageNext', () => ({
    __esModule: true,
    JSSImageNext: props => {
        mockJSSIMageNextProps(props);

        return <div data-tid='jss-image-next' />;
    },
}));

const mockTextProps = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: props => {
        mockTextProps(props);

        return <div data-tid={props[`data-tid`]} />;
    },
}));

describe('<FaqRating />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
        mockGetWebStorageItem = [];
    });

    it('Should render component standard', () => {
        render(<FaqRating {...mockProps} />);
        expect(screen.getByTestId('faq-rating-form')).toBeInTheDocument();

        expect(mockTextProps).toHaveBeenCalledWith({
            field: mockProps.fields?.RatingQuestion,
            tag: 'p',
            className: 'title',
            'data-tid': 'title',
        });

        expect(screen.getByTestId('positive-rating-button')).toBeInTheDocument();
        expect(mockButtonProps).toHaveBeenCalledWith({
            className: 'icon',
            onClick: expect.any(Function),
            'aria-label': SitecoreDictionary.GlobalsFormFieldsRadioButtonsYes,
            'aria-pressed': false,
            dataTid: 'positive-rating-button',
            children: expect.anything(),
        });
        expect(mockJSSIMageNextProps).toHaveBeenCalledWith({
            field: mockProps.fields?.PositiveInactiveIcon,
            mediaSize: MediaSize.Small,
        });

        expect(screen.getByTestId('negative-rating-button')).toBeInTheDocument();
        expect(mockButtonProps).toHaveBeenCalledWith({
            className: 'icon',
            onClick: expect.any(Function),
            'aria-label': SitecoreDictionary.GlobalsFormFieldsRadioButtonsNo,
            'aria-pressed': false,
            dataTid: 'negative-rating-button',
            name: 'question-rating',
            children: expect.anything(),
        });
        expect(mockJSSIMageNextProps).toHaveBeenCalledWith({
            field: mockProps.fields?.NegativeInactiveIcon,
            mediaSize: MediaSize.Small,
        });

        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
        expect(screen.queryByTestId('faq-rating-comment')).not.toBeInTheDocument();

        expect(screen.queryByTestId('submit-faq-rating')).not.toBeInTheDocument();
    });

    describe('Should handle click on Negative Feedback button', () => {
        it('Change icon of the button and aria passed label', async () => {
            render(<FaqRating {...mockProps} />);

            await userEvent.click(screen.getByTestId('negative-rating-button'));

            expect(mockButtonProps).toHaveBeenCalledWith({
                className: 'icon',
                onClick: expect.any(Function),
                'aria-label': SitecoreDictionary.GlobalsFormFieldsRadioButtonsNo,
                'aria-pressed': true,
                dataTid: 'negative-rating-button',
                name: 'question-rating',
                children: expect.anything(),
            });
            expect(mockJSSIMageNextProps).toHaveBeenCalledWith({
                field: mockProps.fields?.NegativeInactiveIcon,
                mediaSize: MediaSize.Small,
            });
        });

        it('Should render text aria for feedback and submit button', async () => {
            render(<FaqRating {...mockProps} />);

            await userEvent.click(screen.getByTestId('negative-rating-button'));

            const textArea = screen.getByRole('textbox');
            expect(textArea).toBeInTheDocument();
            expect(textArea).toHaveAttribute('maxLength', '1000');
            expect(textArea).toHaveClass('comment');
            expect(textArea).toHaveAttribute('placeholder', mockProps.fields?.ThumbDownPlaceholder.value);
            expect(textArea).toHaveAttribute('aria-label', SitecoreDictionary.FaqRatingLabelsYourFeedback);

            expect(screen.getByTestId('faq-rating-comment')).toBeInTheDocument();

            expect(screen.getByTestId('submit-faq-rating')).toBeInTheDocument();
            expect(mockButtonProps).toHaveBeenCalledWith({
                className: 'submitButton',
                disabled: true,
                type: 'submit',
                isLoading: false,
                dataTid: 'submit-faq-rating',
                children: expect.anything(),
            });
        });

        it('Should add Negative feedback value to the web storage', async () => {
            render(<FaqRating {...mockProps} />);

            await userEvent.click(screen.getByTestId('negative-rating-button'));

            expect(storageUtils.setWebStorageItem).toHaveBeenCalledWith(
                WebStorageKeys.FaqRating,
                '[{"id":"123","rating":false}]',
            );
            expect(mockStores.trackingStore.trackHelpWasUseful).toHaveBeenCalledWith(
                false,
                mockProps.categoryNavParameter,
                mockProps.questionNavParameter,
            );
        });

        it('Should remove Negative feedback value from the web storage when it was already selected', async () => {
            mockGetWebStorageItem = [
                {
                    id: '123',
                    rating: false,
                },
            ];
            render(<FaqRating {...mockProps} />);

            await userEvent.click(screen.getByTestId('negative-rating-button'));

            expect(storageUtils.setWebStorageItem).toHaveBeenCalledWith(WebStorageKeys.FaqRating, '[]');
        });
    });

    describe('Should handle click on Positive Feedback button', () => {
        it('Change icon of the button and aria passed label', async () => {
            render(<FaqRating {...mockProps} />);

            await userEvent.click(screen.getByTestId('positive-rating-button'));

            expect(mockButtonProps).toHaveBeenCalledWith({
                className: 'icon',
                onClick: expect.any(Function),
                'aria-label': SitecoreDictionary.GlobalsFormFieldsRadioButtonsYes,
                'aria-pressed': true,
                dataTid: 'positive-rating-button',
                children: expect.anything(),
            });
            expect(mockJSSIMageNextProps).toHaveBeenCalledWith({
                field: mockProps.fields?.PositiveInactiveIcon,
                mediaSize: MediaSize.Small,
            });
        });

        it('Should render text aria for feedback and submit button', async () => {
            render(<FaqRating {...mockProps} />);

            await userEvent.click(screen.getByTestId('positive-rating-button'));

            const textArea = screen.getByTestId('faq-rating-comment');
            expect(textArea).toBeInTheDocument();
            expect(textArea).toHaveAttribute('maxLength', '1000');
            expect(textArea).toHaveClass('comment');
            expect(textArea).toHaveAttribute('placeholder', mockProps.fields?.ThumbUpPlaceholder.value);
            expect(textArea).toHaveAttribute('aria-label', SitecoreDictionary.FaqRatingLabelsYourFeedback);

            expect(screen.getByTestId('submit-faq-rating')).toBeInTheDocument;
            expect(mockButtonProps).toHaveBeenCalledWith({
                className: 'submitButton',
                disabled: true,
                type: 'submit',
                isLoading: false,
                dataTid: 'submit-faq-rating',
                children: expect.anything(),
            });
        });

        it('Should add Positive feedback value to the web storage', async () => {
            render(<FaqRating {...mockProps} />);

            await userEvent.click(screen.getByTestId('positive-rating-button'));

            expect(storageUtils.setWebStorageItem).toHaveBeenCalledWith(
                WebStorageKeys.FaqRating,
                '[{"id":"123","rating":true}]',
            );
            expect(mockStores.trackingStore.trackHelpWasUseful).toHaveBeenCalledWith(
                true,
                mockProps.categoryNavParameter,
                mockProps.questionNavParameter,
            );
        });

        it('Should remove Positive feedback value from the web storage when it was already selected', async () => {
            mockGetWebStorageItem = [
                {
                    id: '123',
                    rating: true,
                },
            ];
            render(<FaqRating {...mockProps} />);

            await userEvent.click(screen.getByTestId('positive-rating-button'));

            expect(storageUtils.setWebStorageItem).toHaveBeenCalledWith(WebStorageKeys.FaqRating, '[]');
        });
    });

    it('Should NOT show loading sate for component when error occurs during feedback submitting', async () => {
        const textValue = 'feedback text';
        jest.spyOn(helpCenterService, 'saveQuestionFeedback').mockImplementationOnce(() => {
            throw new Error('error');
        });

        render(<FaqRating {...mockProps} />);

        await userEvent.click(screen.getByTestId('positive-rating-button'));

        const textArea = screen.getByRole('textbox');
        await userEvent.type(textArea, textValue);
        expect(textArea).toHaveValue(textValue);

        await userEvent.click(screen.getByTestId('submit-faq-rating'));

        expect(helpCenterService.saveQuestionFeedback).toHaveBeenCalled();

        expect(mockButtonProps).toHaveBeenLastCalledWith({
            className: 'submitButton',
            disabled: false,
            type: 'submit',
            isLoading: false,
            dataTid: 'submit-faq-rating',
            children: expect.anything(),
        });
    });

    it('Should submit NOT submit feedback when user did NOT provide text feedback', async () => {
        render(<FaqRating {...mockProps} />);

        await userEvent.click(screen.getByTestId('positive-rating-button'));
        await userEvent.click(screen.getByTestId('submit-faq-rating'));

        expect(helpCenterService.saveQuestionFeedback).not.toHaveBeenCalled();
        expect(mockButtonProps).toHaveBeenCalledWith({
            className: 'submitButton',
            disabled: true,
            type: 'submit',
            isLoading: false,
            dataTid: 'submit-faq-rating',
            children: expect.anything(),
        });
    });

    it('Should remove feedback value from the web storage when error occurs during web storage set up', async () => {
        jest.spyOn(storageUtils, 'setWebStorageItem').mockImplementationOnce(() => {
            throw new Error('error');
        });
        render(<FaqRating {...mockProps} />);

        await userEvent.click(screen.getByTestId('negative-rating-button'));

        expect(storageUtils.removeWebStorageItem).toHaveBeenCalled();
    });

    it('Should submit feedback and show message when user submits feedback', async () => {
        const textValue = 'feedback text';

        render(<FaqRating {...mockProps} />);

        await userEvent.click(screen.getByTestId('positive-rating-button'));

        const textArea = screen.getByRole('textbox');
        await userEvent.type(textArea, textValue);
        expect(textArea).toHaveValue(textValue);

        await userEvent.click(screen.getByTestId('submit-faq-rating'));

        expect(helpCenterService.saveQuestionFeedback).toHaveBeenCalledWith(
            mockProps.categoryName,
            mockProps.questionName,
            true,
            textValue,
            mockDate,
        );
        expect(screen.getByTestId('submitted-message')).toBeInTheDocument();
    });

    it('Should reset submit message when user resubmits feedback', async () => {
        const textValue = 'feedback text';

        render(<FaqRating {...mockProps} />);

        await userEvent.click(screen.getByTestId('positive-rating-button'));
        await userEvent.type(screen.getByRole('textbox'), textValue);
        await userEvent.click(screen.getByTestId('submit-faq-rating'));

        expect(screen.getByTestId('submitted-message')).toBeInTheDocument();

        await userEvent.click(screen.getByTestId('negative-rating-button'));

        expect(screen.queryByTestId('submitted-message')).not.toBeInTheDocument();
    });

    it('Should NOT render component when fields are NOT provided', () => {
        mockProps.fields = undefined;
        const { container } = render(<FaqRating {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });
});
