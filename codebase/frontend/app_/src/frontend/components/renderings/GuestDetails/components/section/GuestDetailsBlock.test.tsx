import React from 'react';
import { render, screen } from '@testing-library/react';

import GuestDetailsBlock from './GuestDetailsBlock';

const mockAnimationWrapper = jest.fn();
jest.mock('frontend/components/common/AnimatedWrapper/AnimatedWrapper', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockAnimationWrapper(props);

        return <div data-tid='animation-wrapper'>{children}</div>;
    },
}));

describe('<GuestDetailsBlock />', () => {
    const resetMocks = () => ({
        id: 'id',
        title: 'mainText',
        secondaryText: 'secondaryText',
        icon: <img src='test.png' alt='test image' />,
        children: <div data-tid='child-component' />,
        wrapperClassName: 'custom-class-name',
        defaultStatus: true,
        isLead: true,
    });

    const mocks = resetMocks();

    it('Should standard render', () => {
        const { container } = render(<GuestDetailsBlock {...mocks} />);

        const wrapper = container.querySelector('.wrapper') as HTMLDivElement;

        expect(wrapper).toBeInTheDocument();
        expect(wrapper).toHaveClass(mocks.wrapperClassName);
        expect(wrapper.dataset.status).toBe('expanded');
        expect(screen.getByText('mainText')).toBeInTheDocument();
        expect(screen.getByTestId('child-component')).toBeInTheDocument();
        expect(mockAnimationWrapper).toHaveBeenCalledWith({
            entranceClass: 'open',
            exitClass: '',
            isShown: true,
            keepMounted: true,
            wrapperClass: 'closed',
        });
    });

    it('should be collapsed when isLead is false', () => {
        mocks.isLead = false;

        const { container } = render(<GuestDetailsBlock {...mocks} />);

        const wrapper = container.querySelector('.wrapper') as HTMLDivElement;

        expect(wrapper.dataset.status).toBe('collapsed');
        expect(mockAnimationWrapper).toHaveBeenCalledWith({
            entranceClass: 'open',
            exitClass: '',
            isShown: false,
            keepMounted: true,
            wrapperClass: 'closed',
        });
    });
});
