import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mockSitecoreField } from 'frontend/utils/tests.utils';

import CancellationPopUp, { ICancellationPopUpProps } from './CancellationPopUp';

const createProps = (): ICancellationPopUpProps => ({
    CancellationPopUpBackButton: mockSitecoreField('back'),
    CancellationPopUpDescription: mockSitecoreField('description'),
    CancellationPopUpContinueButton: mockSitecoreField('continue'),
    CancellationPopUpTitle: mockSitecoreField('title'),
    onSeatMapClose: jest.fn(),
    setIsCancelPopupOpened: jest.fn(),
});

let mockProps;

const mockActionPopup = jest.fn();
jest.mock('frontend/components/common/ActionPopup', () => ({
    __esModule: true,
    default: props => {
        mockActionPopup(props);

        return (
            <div data-tid='popup'>
                <button data-tid='popup-continue-btn' onClick={props.onContinue} />
                <button data-tid='popup-cancel-btn' onClick={props.onCancel} />
            </div>
        );
    },
}));

describe('CancellationPopUp', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockActionPopup.mockClear();
    });

    it('should render CancellationPopUp with correct props', () => {
        render(<CancellationPopUp {...mockProps} />);

        expect(screen.getByTestId('popup')).toBeInTheDocument();
        expect(mockActionPopup).toHaveBeenCalledWith(
            expect.objectContaining({
                title: 'title',
                subtitle: 'description',
                continueLabel: 'back',
                cancelLabel: 'continue',
                isInnerPopup: true,
                onContinue: expect.any(Function),
                onCancel: expect.any(Function),
            }),
        );
    });

    describe('onContinue button click', () => {
        it('should call onSeatMapClose and setIsCancelPopupOpened', async () => {
            render(<CancellationPopUp {...mockProps} />);

            const btn = screen.getByTestId('popup-continue-btn');

            await userEvent.click(btn);

            expect(mockProps.onSeatMapClose).toHaveBeenCalled();
            expect(mockProps.setIsCancelPopupOpened).toHaveBeenCalledWith(false);
        });
    });

    describe('onCancel button click', () => {
        it('should call setIsCancelPopupOpened', async () => {
            render(<CancellationPopUp {...mockProps} />);

            const btn = screen.getByTestId('popup-cancel-btn');

            await userEvent.click(btn);

            expect(mockProps.setIsCancelPopupOpened).toHaveBeenCalledWith(false);
        });
    });
});
