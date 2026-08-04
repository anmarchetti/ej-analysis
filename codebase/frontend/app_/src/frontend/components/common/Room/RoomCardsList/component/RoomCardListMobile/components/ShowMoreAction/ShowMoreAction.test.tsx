import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { createMockStores } from 'frontend/__mocks__';

import ShowMoreAction, { IShowMoreActionProps } from './ShowMoreAction';

expect.extend(toHaveNoViolations);

const createProps = (): IShowMoreActionProps => ({
    label: 'label',
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockButtonProps = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockButtonProps(props);

        return <div data-tid='button'>{children}</div>;
    },
}));

const mockSvgProps = jest.fn();
jest.mock('frontend/components/icons-new/ExternalLink', () => ({
    __esModule: true,
    default: props => {
        mockSvgProps(props);

        return <div data-tid='svg' />;
    },
}));

describe('<ShowMoreAction />', () => {
    beforeEach(() => {
        mockStores = createMockStores();
        mockProps = createProps();
    });

    it('Should render children', () => {
        render(<ShowMoreAction {...mockProps} />);

        expect(screen.getByTestId('button')).toBeInTheDocument();
        expect(screen.getByTestId('svg')).toBeInTheDocument();
        expect(screen.getByText('label')).toBeInTheDocument();
        expect(mockButtonProps).toHaveBeenCalledWith(
            expect.objectContaining({
                isOutlined: true,
                isFullWidth: true,
                'data-tid': 'show-more-rooms-button-mobile',
                className: 'showMore',
                'aria-label': 'label',
            }),
        );
        expect(mockSvgProps).toHaveBeenCalledWith(
            expect.objectContaining({
                className: 'btnIcon',
            }),
        );
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<ShowMoreAction {...mockProps} />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
