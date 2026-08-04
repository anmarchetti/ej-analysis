import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { DownloadableImage } from './DownloadableImage';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
}));

describe('<DownloadableImage />', () => {
    const resetMocks = () => ({
        name: 'Hotel Name',
        size: 23,
        src: 'src',
    });
    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
    });

    it('should render img', () => {
        render(<DownloadableImage {...mocks} />);

        expect(screen.getByTestId('downloadable-image')).toBeInTheDocument();
    });

    it('should not render img', () => {
        mocks.src = '';
        render(<DownloadableImage {...mocks} />);

        expect(screen.queryByTestId('downloadable-image')).not.toBeInTheDocument();
    });

    it('should call preventDefault when clicked', () => {
        const { container } = render(<DownloadableImage {...mocks} />);
        const isPrevented = fireEvent.click(container);

        expect(isPrevented).toBe(true);
    });
});
