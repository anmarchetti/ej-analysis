import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import TabBar from './TabBar';

describe('<TabBar />', () => {
    const resetMocks = () => ({
        activeTab: 'test',
        tabs: [
            { accessor: 'test', label: 'test' },
            { accessor: 'test1', label: 'test1' },
        ],
        onClick: jest.fn(),
        tabClass: 'test-class',
    });

    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
    });

    it('should render tabs', () => {
        render(<TabBar {...mocks} />);
        expect(screen.getByTestId('anchors-box')).toBeInTheDocument();
    });

    it('should render active tab', () => {
        render(<TabBar {...mocks} />);
        expect(screen.getByTestId('anchors-box')).toBeInTheDocument();
        expect(screen.getByTestId('anchor-active')).toHaveClass('test-class');
    });

    it('should be clickable tab', () => {
        render(<TabBar {...mocks} />);
        const tab = screen.getByTestId('anchor-active');
        fireEvent.click(tab);
        expect(mocks.onClick).toHaveBeenCalled();
    });
});
