import React from 'react';
import { render } from '@testing-library/react';

import TriangleBackground from 'frontend/components/common/TriangleBackground';

const createProps = () => ({
    isTransparent: false,
    isGray: false,
    isOverlaid: false,
    className: '',
    imageURL: '',
    fallbackImageURL: '',
});

let mockProps;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
}));

describe('<TriangleBackground />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render triangle background without any other class and style', () => {
        const { container } = render(<TriangleBackground {...mockProps} />);

        const triangleBackground = container.getElementsByClassName('triangle-background')[0];
        expect(triangleBackground).not.toHaveClass('semi-transparent');
        expect(triangleBackground).not.toHaveClass('gray');
        expect(triangleBackground).not.toHaveClass('with-overlay');
        expect(triangleBackground).toHaveStyle({ backgroundImage: '' });
    });

    it('should render triangle background with semi-transparent class', () => {
        mockProps.isTransparent = true;
        const { container } = render(<TriangleBackground {...mockProps} />);

        expect(container.getElementsByClassName('triangle-background')[0]).toHaveClass('semi-transparent');
    });

    it('should render triangle background with gray class', () => {
        mockProps.isGray = true;
        const { container } = render(<TriangleBackground {...mockProps} />);

        expect(container.getElementsByClassName('triangle-background')[0]).toHaveClass('gray');
    });

    it('should render triangle background with with-overlay class', () => {
        mockProps.isOverlaid = true;
        const { container } = render(<TriangleBackground {...mockProps} />);

        expect(container.getElementsByClassName('triangle-background')[0]).toHaveClass('with-overlay');
    });

    it('should render triangle background with custom class', () => {
        mockProps.className = 'custom';
        const { container } = render(<TriangleBackground {...mockProps} />);

        expect(container.getElementsByClassName('triangle-background')[0]).toHaveClass('custom');
    });

    it('should render triangle background with styles', () => {
        mockProps.imageURL = 'url1';
        mockProps.fallbackImageURL = 'url2';
        const { container } = render(<TriangleBackground {...mockProps} />);

        expect(container.getElementsByClassName('triangle-background')[0]).toHaveStyle({
            backgroundImage: 'url("url1"), url("url2")',
        });
    });
});
