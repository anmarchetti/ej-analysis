import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mockSitecoreField } from 'frontend/utils/tests.utils';

import TabComponent, { ITabComponent } from './TabComponent';

jest.mock('frontend/components/common/ComponentWithAnimatedHeight/ComponentWithAnimatedHeight', () => ({
    __esModule: true,
    default: ({ children }) => <div data-tid='component-with-animated-height'>{children}</div>,
}));

const mockLink = jest.fn();
jest.mock('frontend/components/common/Link', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockLink(props);

        return <div data-tid='link'>{children}</div>;
    },
}));

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    Text: ({ field }) => <div>{field.value}</div>,
}));

let mockProps;
const createMockProps = (): ITabComponent => ({
    data: [
        {
            Title: mockSitecoreField('Title 1'),
            Links: [
                { Url: 'url1', Name: 'name1', Id: 'id1' },
                { Url: 'url2', Name: 'name2', Id: 'id2' },
            ],
        },
        {
            Title: mockSitecoreField('Title 2'),
            Links: [
                { Url: 'url3', Name: 'name3', Id: 'id3' },
                { Url: 'url4', Name: 'name4', Id: 'id4' },
            ],
        },
    ],
});

describe('TabComponent', () => {
    beforeEach(() => {
        mockProps = createMockProps();
    });

    it('should render active button and active list', () => {
        render(<TabComponent {...mockProps} />);

        const buttons = screen.getAllByRole('button');

        expect(buttons[0]).toHaveClass('activeFirstTab');
        expect(buttons[0]).toHaveTextContent('Title 1');
        expect(screen.getByTestId('0-list')).toHaveClass('activeList');
        expect(screen.getByTestId('1-list')).not.toHaveClass('activeList');

        expect(screen.getByTestId('slider').getAttribute('style')).toBe(null);
    });

    it('should change active button and active list', async () => {
        Object.defineProperties(HTMLElement.prototype, {
            offsetLeft: { get: () => 10 },
            offsetWidth: { get: () => 20 },
        });

        render(<TabComponent {...mockProps} />);

        const buttons = screen.getAllByRole('button');

        await userEvent.click(buttons[1]);

        expect(buttons[1]).toHaveClass('activeButton');
        expect(screen.getByTestId('1-list')).toHaveClass('activeList');

        expect(screen.getByTestId('slider').getAttribute('style')).toBe('left: 10px; width: 20px;');
    });

    it('should not render link when it does not have name', () => {
        mockProps.data = [
            {
                Title: mockSitecoreField('Title 1'),
                Links: [{ Url: 'url1', Name: '', Id: 'id1' }],
            },
        ];
        render(<TabComponent {...mockProps} />);
        expect(screen.queryByTestId('link')).not.toBeInTheDocument();
    });

    it('should not render link when it does not have url', () => {
        mockProps.data = [
            {
                Title: mockSitecoreField('Title 1'),
                Links: [{ Url: '', Name: 'name1', Id: 'id1' }],
            },
        ];
        render(<TabComponent {...mockProps} />);
        expect(screen.queryByTestId('link')).not.toBeInTheDocument();
    });

    it('should render equal number of lists and titles', () => {
        mockProps.data = [
            {
                Title: mockSitecoreField('Title 1'),
                Links: [
                    { Url: 'url3', Name: 'name3', Id: 'id3' },
                    { Url: 'url4', Name: 'name4', Id: 'id4' },
                ],
            },
            {
                Title: mockSitecoreField('Title 2'),
                Links: [],
            },
        ];

        render(<TabComponent {...mockProps} />);

        expect(screen.getAllByTestId('tab-title')).toHaveLength(2);
        expect(screen.getByTestId('0-list')).toBeInTheDocument();
        expect(screen.getByTestId('1-list')).toBeInTheDocument();
    });

    it('should render link with purify url', () => {
        mockProps.data = [
            {
                Title: mockSitecoreField('Tab 1'),
                Links: [{ Url: '/destinations/spain/majorca', Name: 'Majorca', Id: 'id1' }],
            },
        ];
        render(<TabComponent {...mockProps} />);

        expect(mockLink).toHaveBeenCalledWith({ href: '/spain/majorca' });
    });
});
