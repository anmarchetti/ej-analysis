import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';

import MobilePOIDrawerContent, { IMobilePOIDrawerContentProps } from './MobilePOIDrawerContent';

const createProps = (): IMobilePOIDrawerContentProps => ({
    categoriesWithItems: [
        {
            name: mockSitecoreField('Category 1'),
            key: 'category1',
            items: [
                {
                    distance: '1km',
                    name: 'point 1',
                    categoryName: 'category1',
                },
                {
                    distance: '2km',
                    name: 'point 2',
                    categoryName: 'category1',
                },
            ],
            icon: mockSitecoreField(mockSitecoreImageField('test1')),
        },
        {
            name: mockSitecoreField('Category 2'),
            key: 'category2',
            items: [
                {
                    distance: '1km',
                    name: 'point 1',
                    categoryName: 'category2',
                },
                {
                    distance: '2km',
                    name: 'point 2',
                    categoryName: 'category2',
                },
            ],
            icon: mockSitecoreField(mockSitecoreImageField('test2')),
        },
    ],
    handleCategoryClick: jest.fn(),
});

let mockProps;

jest.mock('frontend/components/renderings/MapPointsOfInterest/components/SinglePointCard', () => ({
    __esModule: true,
    default: () => <div data-tid='single-point-card' />,
}));

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: () => <div data-tid='text' />,
}));

jest.mock('frontend/components/common/AnimatedAccordion/AnimatedAccordion.tsx', () => ({
    __esModule: true,
    default: ({ buttonContent, children, onClick }) => (
        <button onClick={onClick} data-tid='animated-accordion'>
            {children}
            {buttonContent}
        </button>
    ),
}));

jest.mock('frontend/components/common/JSSImage', () => ({
    __esModule: true,
    default: () => <div data-tid='jss-image' />,
}));

describe('<MobilePOIDrawerContent />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should standard render', () => {
        render(<MobilePOIDrawerContent {...mockProps} />);

        expect(screen.getAllByTestId('single-point-card')).toHaveLength(4);
        expect(screen.getAllByTestId('animated-accordion')).toHaveLength(2);
        expect(screen.getAllByTestId('text')).toHaveLength(3);
        expect(screen.getAllByTestId('jss-image')).toHaveLength(2);
    });

    it('should call handleCategoryClick when animated accordion is clicked', async () => {
        render(<MobilePOIDrawerContent {...mockProps} />);

        await userEvent.click(screen.getAllByTestId('animated-accordion')[0]);

        expect(mockProps.handleCategoryClick).toHaveBeenCalled();
    });
});
