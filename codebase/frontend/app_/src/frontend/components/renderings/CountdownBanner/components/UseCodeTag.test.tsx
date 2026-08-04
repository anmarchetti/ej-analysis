import React from 'react';
import { render } from '@testing-library/react';

import UseCodeTag from './UseCodeTag';

const createProps = () => ({
    useCode: { value: 'useCode' },
    useCodeLabel: { value: 'useCodeLabel' },
    classNames: 'classnames',
});

let mockProps;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
}));

describe('<UseCodeTag />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    describe('should return null when', () => {
        it('useCode is not defined', () => {
            mockProps.useCode = null;
            const { container } = render(<UseCodeTag {...mockProps} />);

            expect(container).toBeEmptyDOMElement();
        });

        it('useCodeLabel is not defined', () => {
            mockProps.useCodeLabel = null;
            const { container } = render(<UseCodeTag {...mockProps} />);

            expect(container).toBeEmptyDOMElement();
        });
    });

    it('should return null when useCode is not defined', () => {
        mockProps.useCode = null;
        const { container } = render(<UseCodeTag {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when useCode NOT provided', () => {
        mockProps.useCode.value = null;
        const { container } = render(<UseCodeTag {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when useCodeLabel NOT provided', () => {
        mockProps.useCodeLabel.value = null;
        const { container } = render(<UseCodeTag {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render UseCode', () => {
        const { getByText } = render(<UseCodeTag {...mockProps} />);

        expect(getByText('useCode')).toBeInTheDocument();
    });

    it('should render UseCodeLabel', () => {
        const { getByText } = render(<UseCodeTag {...mockProps} />);

        expect(getByText('useCodeLabel')).toBeInTheDocument();
    });

    it('should render container with classnames', () => {
        const { container } = render(<UseCodeTag {...mockProps} />);

        expect(container.getElementsByClassName('classnames').length).toBe(1);
    });
});
