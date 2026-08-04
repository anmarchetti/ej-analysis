import * as React from 'react';
import { render, screen } from '@testing-library/react';

import ThreeDS1Frame from './ThreeDS1Frame';

jest.mock('frontend/services/logging');

const mockSubmit = jest.fn();
HTMLFormElement.prototype.submit = mockSubmit;

describe('ThreeDS1Frame', () => {
    beforeEach(() => {
        mockSubmit.mockClear();
    });

    it('should render form with field and submit form on did mount', () => {
        render(
            <ThreeDS1Frame
                issuerUrl={'https://issuerUrl'}
                md={'md'}
                paReq={'paReq'}
                termUrl={'termUrl'}
                onError={() => jest.fn()}
            />,
        );

        expect(screen.getByTestId('pa-req-input')).toBeInTheDocument();
        expect(screen.getByTestId('md-input')).toBeInTheDocument();
        expect(screen.getByTestId('term-url-input')).toBeInTheDocument();
        expect(screen.getByTestId('three-ds-one-form')).toBeInTheDocument();
        expect(screen.getByTestId('three-ds-one-iframe')).toBeInTheDocument();
        expect(mockSubmit).toHaveBeenCalled();
    });

    it.each([
        ['https://issuerUrl', 'paReq', 'md', 'termUrl', true],
        ['invalidIssuerUrl', 'paReq', 'md', 'termUrl', false],
        ['https://issuerUrl', '', 'md', 'termUrl', false],
        ['https://issuerUrl', 'paReq', '', 'termUrl', false],
        ['https://issuerUrl', 'paReq', 'md', '', false],
    ])('should call onError if input data is not valid $isValid', (issuerUrl, paReq, md, termUrl, isValid) => {
        const onError = jest.fn();

        render(<ThreeDS1Frame issuerUrl={issuerUrl} md={md} paReq={paReq} termUrl={termUrl} onError={onError} />);

        if (isValid) {
            expect(onError).not.toHaveBeenCalled();
            expect(mockSubmit).toHaveBeenCalled();
        } else {
            expect(onError).toHaveBeenCalled();
            expect(mockSubmit).not.toHaveBeenCalled();
        }
    });
});
