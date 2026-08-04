import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';

import LoadingAnimation from './LoadingAnimation';

jest.mock('frontend/components/common/JSSImage', () => () => <div data-tid='image' />);

let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<LoadingAnimation />', () => {
    beforeEach(() => {
        mockStores = createMockStores();
    });

    it('should NOT render when image is NOT provided', () => {
        mockStores.layoutStore.getSetting = jest.fn(() => undefined);
        const { container } = render(<LoadingAnimation />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render image', () => {
        render(<LoadingAnimation />);

        expect(screen.getByTestId('image')).toBeInTheDocument();
    });

    it('should render image and loading-animation-container with animationContainer class', () => {
        render(<LoadingAnimation />);

        expect(screen.getByTestId('image')).toBeInTheDocument();
        expect(screen.getByTestId('loading-animation-container')).toHaveClass('animationContainer');
    });

    it('should render loading-animation-container with centered class and className from props when isCentered is true and className is provided', () => {
        render(<LoadingAnimation isCentered className='test' />);

        expect(screen.getByTestId('loading-animation-container')).toHaveClass('animationContainer centered test');
    });
});
