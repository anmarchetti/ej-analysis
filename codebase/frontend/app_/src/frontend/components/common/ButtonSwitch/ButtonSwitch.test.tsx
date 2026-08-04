import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';

import ButtonSwitch, { IButtonSwitchProps } from './ButtonSwitch';

const createProps = (): IButtonSwitchProps => ({
    activeIndex: 0,
    items: [
        {
            icon: mockSitecoreField(mockSitecoreImageField('test1')),
            name: mockSitecoreField('Test 1'),
            key: 'test1',
        },
        {
            icon: mockSitecoreField(mockSitecoreImageField('test2')),
            name: mockSitecoreField('Test 2'),
            key: 'test2',
        },
        {
            icon: mockSitecoreField(mockSitecoreImageField('test3')),
            name: mockSitecoreField('Test 3'),
            key: 'test3',
        },
    ],
    onClick: jest.fn(),
    children: <div data-tid='children-content' />,
});

let mockProps;

jest.mock('frontend/components/common/JSSImage', () => ({
    __esModule: true,
    default: () => <div data-tid='image' />,
}));

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: () => <div data-tid='text' />,
}));

describe('<ButtonSwitch />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should standard render', () => {
        render(<ButtonSwitch {...mockProps} />);

        expect(screen.getByTestId('button-switch-container')).toBeInTheDocument();
        expect(screen.getAllByTestId('image')).toHaveLength(3);
        expect(screen.getAllByTestId('text')).toHaveLength(3);
        expect(screen.getAllByTestId('button-switch')).toHaveLength(3);
        expect(screen.getByTestId('children-content')).toBeInTheDocument();
    });

    it('should call onClick from props on button click', async () => {
        render(<ButtonSwitch {...mockProps} />);

        await userEvent.click(screen.getAllByRole('button')[1]);

        expect(mockProps.onClick).toHaveBeenCalledWith(1);
    });
});
