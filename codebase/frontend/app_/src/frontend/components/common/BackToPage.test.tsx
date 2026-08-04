import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import BackToPage from './BackToPage';

jest.mock('frontend/components/icons/ChevronLeft', () => ({
    __esModule: true,
    default: () => <svg data-tid='icon-chevron-left' />,
}));

const resetMocks = () => ({
    text: 'Text',
    onClick: jest.fn(),
});

let mocks;

beforeEach(() => {
    mocks = resetMocks();
});

describe('<BackToPage />', () => {
    it('Should render component', () => {
        const { container } = render(<BackToPage {...mocks} />);

        expect(container).not.toBeEmptyDOMElement();
        expect(screen.getByTestId('icon-chevron-left')).toBeInTheDocument();
    });

    it('Should call OnClick function when link is clicked', () => {
        const { getByText } = render(<BackToPage {...mocks} />);
        fireEvent.click(getByText(mocks.text));
        expect(mocks.onClick).toBeCalled();
    });
});
