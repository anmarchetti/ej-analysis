import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ValidationType } from 'models/enum/ValidationType';

import { ValidatablePasswordField } from './ValidatablePasswordField';

const resetMocks = () => ({
    label: 'label',
    onChange: jest.fn(),
    id: 'id',
    errors: [] as any,

    value: '',
    readonly: false,
    srLabel: '',
    hasGroup: false,
    fieldClass: '',
    isVertical: false,
    containerClass: '',
    inputClass: '',
    iconToRender: undefined,
    inputContainerClass: '',
    errorContainerClass: '',
    forceError: false,
    autoComplete: false,
    notShowValidIcon: false,
    name: '',
    trackValidation: jest.fn(),
    inputRef: undefined,

    getPhrase: jest.fn(p => p),
});

const errors = [
    {
        errorMessage: 'error-1 error message',
        trigger: ValidationType.OnBlur,
        propertyName: 'error-1 property name',
    },
    {
        errorMessage: 'error-2',
        trigger: ValidationType.OnType,
        propertyName: 'error-2',
    },
];

jest.mock('frontend/components/icons-new/Hide', () => ({
    __esModule: true,
    default: () => <i data-tid='icon-hide' />,
}));

jest.mock('frontend/components/icons-new/View', () => ({
    __esModule: true,
    default: () => <i data-tid='icon-view' />,
}));

let mocks;

describe('<ValidatablePasswordField />', () => {
    beforeEach(() => {
        mocks = resetMocks();
    });

    it('should not show error elements when no errors', async () => {
        render(<ValidatablePasswordField {...mocks} />);

        const input = screen.getByTestId('password-input');

        expect(screen.queryByRole('alert')).not.toBeInTheDocument();

        await userEvent.click(input);
        await userEvent.tab();

        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        expect(screen.queryByText('error-1 error message')).not.toBeInTheDocument();
    });

    it('should render the view icon initially and input type is password', () => {
        const { container } = render(<ValidatablePasswordField {...mocks} />);
        const input = screen.getByTestId('password-input') as HTMLInputElement;

        expect(screen.getByTestId('icon-view')).toBeInTheDocument();
        expect(screen.queryByTestId('icon-hide')).not.toBeInTheDocument();
        expect(input.type).toBe('password');

        expect(container.querySelector('#revealToggle')).toBeInTheDocument();
    });

    it('should NOT render the reveal toggle (and icons) when hasRevealIcon = false', () => {
        (mocks as any).hasRevealIcon = false;
        const { container } = render(<ValidatablePasswordField {...mocks} />);

        expect(container.querySelector('#revealToggle')).not.toBeInTheDocument();
        expect(screen.queryByTestId('icon-view')).not.toBeInTheDocument();
        expect(screen.queryByTestId('icon-hide')).not.toBeInTheDocument();
    });

    it('should show first error message via getPhrase when forceError', async () => {
        mocks.forceError = true;
        mocks.errors = errors;

        render(<ValidatablePasswordField {...mocks} />);

        const input = screen.getByTestId('password-input');

        await userEvent.click(input);
        await userEvent.tab();

        expect(screen.getByText('error-1 error message')).toBeInTheDocument();
        expect(mocks.trackValidation).toHaveBeenCalled();
        expect(mocks.getPhrase).toHaveBeenCalledWith('error-1 error message');
    });

    it('should track first error on blur', async () => {
        mocks.errors = errors;
        mocks.forceError = true;

        render(<ValidatablePasswordField {...mocks} />);

        const input = screen.getByTestId('password-input');

        await userEvent.click(input);
        await userEvent.tab();

        expect(mocks.trackValidation).toHaveBeenCalledWith('error-1 property name', 'error-1 error message');
    });

    it('should NOT track when disableValidationTraking = true', async () => {
        mocks.errors = errors;
        mocks.forceError = true;
        mocks.disableValidationTraking = true;

        render(<ValidatablePasswordField {...mocks} />);

        const input = screen.getByTestId('password-input');

        await userEvent.click(input);
        await userEvent.tab();

        expect(mocks.trackValidation).not.toHaveBeenCalled();
    });

    it('should be valid when no errors after touch (no error UI)', async () => {
        render(<ValidatablePasswordField {...mocks} />);
        const input = screen.getByTestId('password-input');

        await userEvent.click(input);
        await userEvent.tab();

        // "valid" = no error UI visible
        expect(screen.queryByText('error-1 error message')).not.toBeInTheDocument();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should call onChange with typed value', async () => {
        render(<ValidatablePasswordField {...mocks} />);
        const input = screen.getByTestId('password-input');

        await userEvent.click(input);
        await userEvent.tab();
        await userEvent.clear(input);
        await userEvent.type(input, 'test1');

        expect(mocks.onChange).toHaveBeenLastCalledWith('1');
    });

    it('should render .form-group when hasGroup', () => {
        mocks.hasGroup = true;

        const { container } = render(<ValidatablePasswordField {...mocks} />);

        expect(container.querySelector('.form-group')).toBeTruthy();
    });

    describe('Reveal icon', () => {
        it('should render toggle and password input by default', () => {
            const { container } = render(<ValidatablePasswordField {...mocks} />);

            const toggle = container.querySelector('#revealToggle');
            const input = screen.getByTestId('password-input') as HTMLInputElement;

            expect(toggle).toBeInTheDocument();
            expect(input.type).toBe('password');
        });

        it('should NOT reveal when there is NO value', async () => {
            mocks.value = '';
            const { container } = render(<ValidatablePasswordField {...mocks} />);
            const toggle = container.querySelector('#revealToggle')!;
            const input = screen.getByTestId('password-input') as HTMLInputElement;

            await userEvent.click(toggle);
            expect(input.type).toBe('password');
        });

        it('should NOT render reveal icon when hasRevealIcon = false', () => {
            (mocks as any).hasRevealIcon = false;
            const { container } = render(<ValidatablePasswordField {...mocks} />);
            expect(container.querySelector('#revealToggle')).not.toBeInTheDocument();
        });
    });

    describe('Validation Indicators', () => {
        it('should not render by default', () => {
            render(<ValidatablePasswordField {...mocks} />);
            expect(screen.queryByTestId('validation-indicators')).not.toBeInTheDocument();
        });

        it('should not render if enabled but field not touched', () => {
            (mocks as any).hasValidationIndicators = true;
            render(<ValidatablePasswordField {...mocks} />);
            expect(screen.queryByTestId('validation-indicators')).not.toBeInTheDocument();
        });
    });
});
