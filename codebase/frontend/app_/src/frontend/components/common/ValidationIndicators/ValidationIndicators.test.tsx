import React from 'react';
import { render, screen } from '@testing-library/react';

import { IValidationError } from 'models/data/validation/IValidationError';
import { ValidationType } from 'models/enum/ValidationType';

import { ValidationIndicators } from './ValidationIndicators';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => ({
        layoutStore: {
            getPhrase: jest.fn(p => p),
        },
    }),
}));

const createProps = () => ({
    title: 'title',
    messages: ['test'],
    errors: [] as IValidationError[],
    hasFieldValue: false,
    isFieldBlurred: false,
});
let props = createProps();

describe('<ValidationIndicators />', () => {
    beforeEach(() => {
        props = createProps();
    });

    it('Should render indicators in default state', () => {
        props.messages = ['test-1', 'test-2', 'test-3'];
        const { container } = render(<ValidationIndicators {...props} />);

        expect(screen.getByText('title')).toHaveClass('validation-indicators__title');
        expect(container.getElementsByClassName('validation-indicator')).toHaveLength(props.messages.length);
        expect(container.getElementsByClassName('validation-indicator--valid')).toHaveLength(0);
        expect(container.getElementsByClassName('validation-indicator--invalid')).toHaveLength(0);
    });

    it('Should render indicator in VALID state if there is value and NO errors', () => {
        props.hasFieldValue = true;
        const { container } = render(<ValidationIndicators {...props} />);
        const indicator = container.getElementsByClassName('validation-indicator')[0];

        expect(indicator).toHaveClass('validation-indicator--valid');
    });

    it('Should render indicator in INVALID state if there is touch error and value', () => {
        props.errors = [{ errorMessage: 'test', trigger: ValidationType.OnType }];
        props.hasFieldValue = true;
        const { container } = render(<ValidationIndicators {...props} />);
        const indicator = container.getElementsByClassName('validation-indicator')[0];

        expect(indicator).toHaveClass('validation-indicator--invalid');
    });

    it('Should render indicator in DEFAULT state if there is touch error, but no value', () => {
        props.errors = [{ errorMessage: 'test', trigger: ValidationType.OnType }];
        props.hasFieldValue = false;
        const { container } = render(<ValidationIndicators {...props} />);
        const indicator = container.getElementsByClassName('validation-indicator')[0];

        expect(indicator).not.toHaveClass('validation-indicator--valid validation-indicator--invalid');
    });

    it('Should render indicator in INVALID state if there is blur error and field is blurred', () => {
        props.errors = [{ errorMessage: 'test', trigger: ValidationType.OnBlur }];
        props.isFieldBlurred = true;
        const { container } = render(<ValidationIndicators {...props} />);
        const indicator = container.getElementsByClassName('validation-indicator')[0];

        expect(indicator).toHaveClass('validation-indicator--invalid');
    });

    it('Should render indicator in default state if there is blur error, but field is NOT blurred', () => {
        props.errors = [{ errorMessage: 'test', trigger: ValidationType.OnBlur }];
        props.isFieldBlurred = false;
        const { container } = render(<ValidationIndicators {...props} />);
        const indicator = container.getElementsByClassName('validation-indicator')[0];

        expect(indicator).not.toHaveClass('validation-indicator--invalid');
    });
});
