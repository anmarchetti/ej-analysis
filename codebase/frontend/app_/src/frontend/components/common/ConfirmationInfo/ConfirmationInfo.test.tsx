import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';

import { ConfirmationInfo, IConfirmationInfoProps } from './ConfirmationInfo';

const createStores = () => ({
    layoutStore: { getPhrase: jest.fn(p => p) },
});
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/icons/InfoCircle', () => () => <svg data-tid='icon-info-circle' />);

const mockConfirmationInfoText = jest.fn();
jest.mock('./ConfirmationInfoText', () =>
    jest.fn(({ text }) => {
        mockConfirmationInfoText({ text });

        return <div data-tid='confirmation-info-text'>{text}</div>;
    }),
);

const mockConfirmationCheckbox = jest.fn();
jest.mock('./ConfirmationCheckbox', () =>
    jest.fn(({ checked, disabled, label, onChange, hasError, errorMessage, large }) => {
        mockConfirmationCheckbox({ checked, disabled, label, hasError, errorMessage, large });

        const labelText =
            typeof label === 'string' ? label : (label as ISitecoreField<string>)?.value || 'Default Checkbox Label';

        return (
            <div data-tid='confirmation-checkbox-mock'>
                <label htmlFor='mocked-confirm-checkbox-input'>{labelText}</label>
                <input
                    type='checkbox'
                    id='mocked-confirm-checkbox-input'
                    data-tid='mocked-confirm-checkbox-input'
                    checked={!!checked}
                    disabled={!!disabled}
                    onChange={onChange}
                    aria-invalid={!!hasError}
                />
                {hasError && errorMessage && <span data-tid='cc-error-message'>{errorMessage}</span>}
            </div>
        );
    }),
);

let props;

describe('<ConfirmationInfo />', () => {
    const resetMocks = () =>
        ({
            onClick: jest.fn(),
            isConfirmPolicyValid: true,
            isConfirmPolicyChecked: true,
            importantInformation: { value: 'importantInformation' },
            checkboxLabel: '',
        } as IConfirmationInfoProps);

    beforeEach(() => {
        props = resetMocks();
        mockStores = createStores();
    });

    it('should render the main container, info head, important text, and confirmation checkbox by default', () => {
        render(<ConfirmationInfo {...props} />);

        expect(screen.getByTestId('information-section')).toBeInTheDocument();

        expect(screen.getByTestId('icon-info-circle')).toBeInTheDocument();
        expect(screen.getByText(SitecoreDictionary.GlobalsLabelsImportantInformation)).toBeInTheDocument();

        expect(screen.getByTestId('confirmation-info-text')).toHaveTextContent(props.importantInformation.value);
        expect(mockConfirmationInfoText).toHaveBeenCalledWith({ text: props.importantInformation.value });

        expect(screen.getByTestId('confirmation-checkbox-mock')).toBeInTheDocument();
        expect(mockConfirmationCheckbox).toHaveBeenCalledWith(
            expect.objectContaining({
                checked: props.isConfirmPolicyChecked,
                hasError: false,
                label: props.checkboxLabel,
                errorMessage: SitecoreDictionary.GuestDetailsErrorMessagesConfirmCheckboxDoesNotCheck,
            }),
        );
    });

    it('should pass hasError equal to true to ConfirmationCheckbox when isConfirmPolicyValid is false', () => {
        props.isConfirmPolicyValid = false;

        render(<ConfirmationInfo {...props} />);

        expect(mockConfirmationCheckbox).toHaveBeenCalledWith(
            expect.objectContaining({
                hasError: true,
                errorMessage: SitecoreDictionary.GuestDetailsErrorMessagesConfirmCheckboxDoesNotCheck,
            }),
        );
    });

    it('should NOT render ConfirmationInfoText if importantInformation is undefined or has no value', () => {
        props.importantInformation = undefined;
        const { rerender } = render(<ConfirmationInfo {...props} />);
        expect(screen.queryByTestId('confirmation-info-text')).not.toBeInTheDocument();

        props.importantInformation = { value: '' };
        rerender(<ConfirmationInfo {...props} />);
        expect(screen.queryByTestId('confirmation-info-text')).not.toBeInTheDocument();
    });

    it('should NOT render info head if hideInfoHead is true', () => {
        props.hideInfoHead = true;

        render(<ConfirmationInfo {...props} />);

        expect(screen.queryByTestId('icon-info-circle')).not.toBeInTheDocument();
        expect(screen.queryByText(SitecoreDictionary.GlobalsLabelsImportantInformation)).not.toBeInTheDocument();
    });

    it('should trigger Checkbox onChange (passed as onClick prop) when the checkbox is clicked', async () => {
        props.checkboxLabel = 'Agree to policy';

        render(<ConfirmationInfo {...props} />);

        const checkboxInput = screen.getByRole('checkbox', { name: 'Agree to policy' });

        fireEvent.click(checkboxInput);

        expect(props.onClick).toHaveBeenCalledTimes(1);
        expect(props.onClick).toHaveBeenCalledWith(
            expect.objectContaining({
                target: expect.any(HTMLInputElement),
            }),
        );
    });

    it('should render children if provided', () => {
        const childText = 'I am a child element';
        render(
            <ConfirmationInfo {...props}>
                <div data-tid='child-content'>{childText}</div>
            </ConfirmationInfo>,
        );
        expect(screen.getByTestId('child-content')).toHaveTextContent(childText);
    });

    it('should pass containerClassName to the main div', () => {
        const customClass = 'my-custom-container-class';
        props.containerClassName = customClass;

        render(<ConfirmationInfo {...props} />);

        expect(screen.getByTestId('information-section')).toHaveClass(customClass);
        expect(screen.getByTestId('information-section')).toHaveClass('info');
    });

    it('Should pass disabled and largeCheckbox props to ConfirmationCheckbox', () => {
        props.disabled = true;
        props.largeCheckbox = true;

        render(<ConfirmationInfo {...props} />);

        expect(mockConfirmationCheckbox).toHaveBeenCalledWith(
            expect.objectContaining({
                disabled: true,
                large: true,
            }),
        );
    });
});
