import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { ApiErrors } from 'models/enum/ApiErrors';

import ErrorPopup from './ErrorPopup';

const fields = {
    ErrorPopupTitle: { value: 'Error' },
    ErrorPopupSubtext: { value: 'Error subtext' },
    ErrorPopupIcon: {
        value: {
            src: 'https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png',
        },
    },
    RestrictionsPopupTitle: { value: 'Change error' },
    ChangeLimitRestriction: { value: 'Change limit error' },
    CharacterLimitRestriction: { value: 'Character limit error' },
    LeadPassengerRestriction: { value: 'Lead passenger error' },
    RemovePassengerRestriction: { value: 'Remove passenger error' },
    Phone: { value: '12345' },
} as any;

const generateProps = () =>
    ({
        fields,
        onClose: jest.fn(),
        error: {
            errorType: 'Generic',
        },
    } as any);

let props = generateProps();
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('ErrorPopup', () => {
    beforeEach(() => {
        props = generateProps();
        mockStores = createMockStores({
            amendPassengerStore: {
                amendPassengerNameCharacterCount: 3,
                submitError: null,
            },
            tracking: {
                onCommitPassengersNameChangeError: jest.fn(),
            },
        });
    });

    it('Renders with generic error', () => {
        const { container } = render(<ErrorPopup {...props} />);

        expect(screen.getByText('Error')).toBeInTheDocument();
        expect(screen.getByText('Error subtext')).toBeInTheDocument();
        expect(container.querySelector('.errorPopupIcon')).toBeInTheDocument();
    });

    it('should fire tracking error event', () => {
        props.error = {
            errorType: 'Generic',
            errorStatus: 400,
        };
        render(<ErrorPopup {...props} />);

        expect(mockStores.tracking.onCommitPassengersNameChangeError).toHaveBeenCalledWith('Error subtext', 400);
    });

    it('Renders with Change limit exceeded error', () => {
        render(
            <ErrorPopup
                {...props}
                error={{
                    errorType: ApiErrors.ChangeLimitExeeded,
                }}
            />,
        );

        expect(screen.getByText('Change error')).toBeInTheDocument();
        expect(screen.getByText('Change limit error')).toBeInTheDocument();
    });

    it('Renders with Character limit exceeded error', () => {
        render(
            <ErrorPopup
                {...props}
                error={{
                    errorType: ApiErrors.CharactersChangeLimitExeeded,
                }}
            />,
        );

        expect(screen.getByText('Change error')).toBeInTheDocument();
        expect(screen.getByText('Character limit error')).toBeInTheDocument();
    });

    it('Renders with Lead passenger error', () => {
        render(
            <ErrorPopup
                {...props}
                error={{
                    errorType: 'LeadPassengerRestriction',
                }}
            />,
        );

        expect(screen.getByText('Change error')).toBeInTheDocument();
        expect(screen.getByText('Lead passenger error')).toBeInTheDocument();
    });

    it('Renders with Remove passenger error', () => {
        render(
            <ErrorPopup
                {...props}
                error={{
                    errorType: 'RemovePassengerRestriction',
                }}
            />,
        );

        expect(screen.getByText('Change error')).toBeInTheDocument();
        expect(screen.getByText('Remove passenger error')).toBeInTheDocument();
    });

    it('Calls onClose when close button is clicked', async () => {
        render(<ErrorPopup {...props} />);

        const button = screen.getByText('Globals.Buttons.Close');
        await userEvent.click(button);

        expect(props.onClose).toHaveBeenCalledTimes(1);
    });

    it('Renders phone number', () => {
        props.fields.ErrorPopupSubtext = { value: 'Error subtext {number}' };
        render(<ErrorPopup {...props} />);

        expect(screen.getByText('12345')).toBeInTheDocument();
    });

    it('Does not render field if it is not provided', () => {
        props.fields.ErrorPopupSubtext = undefined;
        render(<ErrorPopup {...props} />);

        expect(screen.queryByText('Error subtext')).not.toBeInTheDocument();
    });
});
