import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';

import ConfirmationCheckbox from './ConfirmationCheckbox';

const mockCheckboxRender = jest.fn();
jest.mock('frontend/components/common/Checkbox', () =>
    jest.fn(props => {
        mockCheckboxRender(props);
        const labelText =
            typeof props.label === 'string' ? props.label : (props.label as ISitecoreField<string>)?.value;
        const testIdToUse =
            props.dataTid || `mock-checkbox-${props.id || labelText?.replace(/\s+/g, '-') || 'default'}`;

        return (
            <div data-testid={`${testIdToUse}-wrapper`}>
                <label htmlFor={props.id}>{labelText}</label>
                <input
                    type='checkbox'
                    id={props.id}
                    data-tid={testIdToUse}
                    checked={!!props.checked}
                    disabled={!!props.disabled}
                    onChange={e => {
                        if (props.onChange) props.onChange(e);
                    }}
                    required={!!props.required}
                    aria-invalid={!!props.hasError}
                />
            </div>
        );
    }),
);

const mockErrorMessage = jest.fn();
jest.mock('frontend/components/common/ErrorMessage', () =>
    jest.fn(({ message, description, icon, errorMessageClass }) => {
        mockErrorMessage({ message, description, icon, errorMessageClass });

        return (
            <div data-tid='error-message' className={errorMessageClass}>
                {icon}
                <span>{message}</span>
                {description && <span>{typeof description === 'string' ? description : 'JSX Description'}</span>}
            </div>
        );
    }),
);

jest.mock('frontend/components/icons-new/WarningFilled', () => () => <svg data-tid='svg-warning-filled' />);

const createProps = () => ({
    checked: true,
    onChange: jest.fn(),
    disabled: false,
});

let props;

describe('<ConfirmationCheckbox />', () => {
    beforeEach(() => {
        props = createProps();
    });

    it('should render with default props', () => {
        render(<ConfirmationCheckbox {...props} />);

        const wrapper = screen.getByTestId('confirmation-checkbox-wrapper');
        expect(wrapper).toBeInTheDocument();

        expect(screen.getByTestId('confirmation-checkbox')).toBeInTheDocument();

        expect(screen.queryByRole('heading')).not.toBeInTheDocument();
        expect(wrapper).not.toHaveClass('confirmation-checkbox--large');
        expect(wrapper).not.toHaveClass('error');
        expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
    });

    it('should render title when title prop is provided', () => {
        props.title = 'My Checkbox Title';

        render(<ConfirmationCheckbox {...props} />);

        expect(screen.getByRole('heading', { name: 'My Checkbox Title', level: 2 })).toBeInTheDocument();
    });

    it('should apply large style when large prop is true', () => {
        props.large = true;

        render(<ConfirmationCheckbox {...props} />);

        expect(screen.getByTestId('confirmation-checkbox-wrapper')).toHaveClass('confirmation-checkbox--large');
    });

    it('should apply error style when hasError prop is true', () => {
        props.hasError = true;

        render(<ConfirmationCheckbox {...props} />);

        expect(screen.getByTestId('confirmation-checkbox-wrapper')).toHaveClass('error');
    });

    it('should render ErrorMessage when hasError and errorMessage props are provided', () => {
        props.hasError = true;
        props.errorMessage = 'This is an error.';

        render(<ConfirmationCheckbox {...props} />);

        expect(screen.getByTestId('confirmation-checkbox-wrapper')).toHaveClass('error');
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
        expect(screen.getByText('This is an error.')).toBeInTheDocument();
        expect(screen.getByTestId('svg-warning-filled')).toBeInTheDocument();
    });

    it('should pass relevant props to the child Checkbox component', () => {
        const labelText = 'Agree to terms';

        props.checked = true;
        props.disabled = true;
        props.large = true;
        props.hasError = true;
        props.label = labelText;

        render(<ConfirmationCheckbox {...props} />);

        expect(mockCheckboxRender).toHaveBeenCalledWith(
            expect.objectContaining({
                id: 'confirmation-checkbox',
                large: true,
                textRight: true,
                tick: true,
                hasError: true,
                checked: true,
                disabled: true,
                required: true,
                label: labelText,
                dataTid: 'confirmation-checkbox',
            }),
        );

        const checkboxInput = screen.getByTestId('confirmation-checkbox');

        expect(checkboxInput).toBeChecked();
        expect(checkboxInput).toBeDisabled();
        expect(checkboxInput).toHaveAttribute('aria-invalid', 'true');
    });

    it('should call onChange prop when the checkbox is clicked', async () => {
        props.checked = false;

        render(<ConfirmationCheckbox {...props} />);

        const checkboxInput = screen.getByTestId('confirmation-checkbox');
        fireEvent.click(checkboxInput);

        expect(props.onChange).toHaveBeenCalledTimes(1);
        expect(props.onChange).toHaveBeenCalledWith(expect.any(Object));
    });
});
