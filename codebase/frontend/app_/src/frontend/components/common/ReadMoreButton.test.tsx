import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { IReadMoreButtonProps, ReadMoreButton } from './ReadMoreButton';

jest.mock('frontend/components/icons/ChevronUp', () => () => <div data-tid='chevron-up-icon' />);
jest.mock('frontend/components/icons/ChevronDown', () => () => <div data-tid='chevron-down-icon' />);

jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: ({ onClick, children, dataTid }) => (
        <button data-tid={dataTid} onClick={onClick} onKeyDown={jest.fn()}>
            {children}
        </button>
    ),
}));

const resetMocks = () =>
    ({
        isReadLess: false,
        dataTid: 'read-more-button',
        readLessText: 'ReadLess',
        readMoreText: 'ReadMore',
        onClick: jest.fn(),
    } as IReadMoreButtonProps);

let mocks;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mocks,
}));

describe('<ReadMoreButton />', () => {
    beforeEach(() => {
        mocks = resetMocks();
    });

    it('should render Read More state', () => {
        render(<ReadMoreButton {...mocks} />);

        expect(screen.getByTestId('read-more-button')).toBeInTheDocument();
        expect(screen.getByTestId('chevron-down-icon')).toBeInTheDocument();
        expect(screen.getByText('ReadMore')).toBeInTheDocument();
    });

    it('should render Read Less state', () => {
        mocks.isReadLess = true;

        render(<ReadMoreButton {...mocks} />);

        expect(screen.getByTestId('read-more-button')).toBeInTheDocument();
        expect(screen.getByTestId('chevron-up-icon')).toBeInTheDocument();
        expect(screen.getByText('ReadLess')).toBeInTheDocument();
    });

    it('should call onClick', async () => {
        render(<ReadMoreButton {...mocks} />);

        await userEvent.click(screen.getByTestId('read-more-button'));

        expect(mocks.onClick).toHaveBeenCalled();
    });
});
