import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';

import NoResultsErrorBlock, { INoResultsErrorBlockProps } from './NoResultsErrorBlock';

let mockProps: INoResultsErrorBlockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockIconProps = jest.fn();
jest.mock('frontend/components/common/JSSImageNext/JSSImageNext', () => ({
    __esModule: true,
    JSSImageNext: props => {
        mockIconProps(props);

        return <div data-tid='icon' />;
    },
}));

describe('<NoResultsErrorBlock />', () => {
    beforeEach(() => {
        mockProps = {
            description: 'description',
            icon: 'icon',
            title: 'title',
        };
        mockStores = createMockStores();
    });

    it('should render component', () => {
        render(<NoResultsErrorBlock {...mockProps} />);

        expect(screen.getByTestId('no-results-block')).toHaveClass('container');
        expect(screen.getByTestId('icon')).toBeInTheDocument();
        expect(screen.getByText('description')).toBeInTheDocument();
        expect(screen.getByText('title')).toBeInTheDocument();

        expect(mockIconProps).toHaveBeenCalledWith({
            field: {
                value: {
                    src: 'icon',
                },
            },
            fill: true,
        });
    });

    it('should be rendered with children', () => {
        render(
            <NoResultsErrorBlock {...mockProps}>
                <div data-tid='children' />
            </NoResultsErrorBlock>,
        );

        expect(screen.getByTestId('children')).toBeInTheDocument();
        expect(screen.getByTestId('icon')).toBeInTheDocument();
        expect(screen.queryByText('description')).not.toBeInTheDocument();
        expect(screen.queryByText('title')).not.toBeInTheDocument();
    });
});
