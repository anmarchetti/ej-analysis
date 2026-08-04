import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__/createMockStores';
import helpCenterService from 'frontend/services/helpCenter.service';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import FeedbackForm from './FeedbackForm';

const createProps = () => ({
    fields: {
        Title: { value: 'test' },
        ScaleTitle: { value: 'scale' },
        Scale: [
            {
                id: 1,
                fields: {
                    Name: { value: 'name' },
                    Icon: { value: { src: 'image' } },
                    ScaleValue: { value: 1 },
                },
                url: 'url',
            },
        ],
        IsCommentFieldEnabled: { value: true },
        CommentTitle: { value: 'comment' },
        Delay: { value: 0 },
    },
    isInDrawer: false,
    onClose: jest.fn(),
    onSuccessSubmit: jest.fn(),
    trackClickAction: jest.fn(),
});

const createStores = () =>
    createMockStores({
        layoutStore: { getPhrase: jest.fn(p => p) },
        bookingStore: { booking: {} },
    });

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/ErrorMessage', () => () => <div data-tid='error' />);

describe('<FeedbackForm />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should NOT render when booking is null', () => {
        mockStores.bookingStore.booking = null;
        const { container } = render(<FeedbackForm {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render: title, scale title, comment title, error message, drawer actions', () => {
        mockProps.fields.Title = null;
        mockProps.fields.ScaleTitle = null;
        mockProps.fields.CommentTitle = null;

        const { queryByRole, queryByTestId, queryByText } = render(<FeedbackForm {...mockProps} />);

        expect(queryByRole('heading')).not.toBeInTheDocument();
        expect(queryByTestId('error')).not.toBeInTheDocument();
        expect(queryByText('scale')).not.toBeInTheDocument();
        expect(queryByTestId('feedback-form-drawer-actions')).not.toBeInTheDocument();
        expect(
            queryByRole('button', { name: SitecoreDictionary.FeedbackPopupButtonsDontGiveFeedback }),
        ).not.toBeInTheDocument();
    });

    it('should render: title, scale title, comment title', () => {
        const { getByText, getByRole } = render(<FeedbackForm {...mockProps} />);

        expect(getByRole('heading')).toHaveTextContent('test');
        expect(getByText('scale')).toBeInTheDocument();
    });

    it('should render subtitle and no form comment', () => {
        mockProps.fields.IsCommentFieldEnabled = { value: false };
        const { queryByTestId, getByText } = render(<FeedbackForm {...mockProps} />);

        expect(getByText('scale')).toBeInTheDocument();
        expect(queryByTestId('feedback-form-comment')).not.toBeInTheDocument();
    });

    it('should render drawer actions and call onClose and trackClickAction functions on click', () => {
        mockProps.isInDrawer = true;
        const { getAllByTestId, getByRole } = render(<FeedbackForm {...mockProps} />);
        const button = getByRole('button', { name: SitecoreDictionary.FeedbackPopupButtonsDontGiveFeedback });

        expect(getAllByTestId('feedback-form-drawer-actions')).toHaveLength(1);
        fireEvent.click(button);
        expect(mockProps.onClose).toHaveBeenCalledTimes(1);
        expect(mockProps.trackClickAction).toHaveBeenCalledTimes(1);
    });

    describe('submit', () => {
        it('should disable submit button when no scale is selected', () => {
            const { getByTestId } = render(<FeedbackForm {...mockProps} />);

            expect(getByTestId('feedback-form-submit-button')).toBeDisabled();
        });

        it('should call saveFeedback with correct arguments on submit', async () => {
            helpCenterService.saveFeedback = jest.fn().mockResolvedValueOnce(undefined);
            const { getByTestId, getByRole } = render(<FeedbackForm {...mockProps} />);

            await userEvent.click(getByRole('radio', { name: 'name' }));
            await userEvent.click(getByTestId('feedback-form-submit-button'));

            expect(helpCenterService.saveFeedback).toHaveBeenCalledWith(
                'test',
                1,
                '',
                expect.any(String),
                '',
                'standard',
            );
        });

        it('should call onSuccessSubmit and trackClickAction with the selected scale name on successful submit', async () => {
            helpCenterService.saveFeedback = jest.fn().mockResolvedValueOnce(undefined);
            const { getByTestId, getByRole } = render(<FeedbackForm {...mockProps} />);

            await userEvent.click(getByRole('radio', { name: 'name' }));
            await userEvent.click(getByTestId('feedback-form-submit-button'));

            expect(mockProps.onSuccessSubmit).toHaveBeenCalledTimes(1);
            expect(mockProps.trackClickAction).toHaveBeenCalledWith('name');
        });

        it('should NOT call onSuccessSubmit and show error message when saveFeedback fails', async () => {
            helpCenterService.saveFeedback = jest.fn().mockRejectedValueOnce(new Error('network error'));
            const { getByTestId, getByRole } = render(<FeedbackForm {...mockProps} />);

            await userEvent.click(getByRole('radio', { name: 'name' }));
            await userEvent.click(getByTestId('feedback-form-submit-button'));

            expect(mockProps.onSuccessSubmit).not.toHaveBeenCalled();
            expect(getByTestId('error')).toBeInTheDocument();
        });
    });
});
