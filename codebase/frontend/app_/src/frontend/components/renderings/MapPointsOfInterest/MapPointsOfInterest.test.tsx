import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import * as utils from 'frontend/components/renderings/MapPointsOfInterest/useMapPointsOfInterest';

import { TMapPointsOfInterestProps } from './IMapPointsOfInterest';
import MapPointsOfInterest from './MapPointsOfInterest';

const createProps = (): TMapPointsOfInterestProps => ({
    fields: {
        Categories: [],
        DisclaimerText: mockSitecoreField('Disclaimer text'),
        DisclaimerTooltip: mockSitecoreField('Disclaimer tooltip'),
        MobileDrawerTitle: mockSitecoreField('Mobile drawer title'),
        ShowMoreButtonText: mockSitecoreField('Show more button text'),
        Title: mockSitecoreField('Title'),
        Distance: mockSitecoreField('Distance'),
    },
    params: {},
    rendering: {},
});

const mockPoints = {
    categoriesWithItems: [
        {
            name: mockSitecoreField('Category 1'),
            items: [],
            icon: mockSitecoreField(mockSitecoreImageField('test')),
            key: 'category-1',
        },
    ],
    title: 'Test Title',
    isMobile: false,
    handleCategoryClick: jest.fn(),
    activeIndex: 0,
    setActiveIndex: jest.fn(),
};

let mockProps;

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: () => <div data-tid='text' />,
}));

const mockMobilePOIContent = jest.fn();
jest.mock('frontend/components/renderings/MapPointsOfInterest/components/MobilePOIContent.tsx', () => ({
    __esModule: true,
    default: ({ handleCategoryClick, ...props }) => {
        mockMobilePOIContent({ ...props });

        return <button onClick={handleCategoryClick} data-tid='mobile-poi-content' />;
    },
}));

const mockDesktopPOIContent = jest.fn();
jest.mock('frontend/components/renderings/MapPointsOfInterest/components/DesktopPOIContent.tsx', () => ({
    __esModule: true,
    default: ({ handleCategoryClick, ...props }) => {
        mockDesktopPOIContent({ ...props });

        return <button onClick={handleCategoryClick} data-tid='desktop-poi-content' />;
    },
}));

const mockUseMapPointsOfInterest = jest.spyOn(utils, 'useMapPointsOfInterest');

describe('<MapPointsOfInterest />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockUseMapPointsOfInterest.mockReturnValue(mockPoints);
    });

    it('should NOT render when fields are empty', () => {
        mockProps.fields = undefined;

        const { container } = render(<MapPointsOfInterest {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when categoriesWithItems are empty', () => {
        mockUseMapPointsOfInterest.mockReturnValue({ ...mockPoints, categoriesWithItems: [] });

        const { container } = render(<MapPointsOfInterest {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render desktop content when isMobile is false', () => {
        render(<MapPointsOfInterest {...mockProps} />);

        expect(screen.getByTestId('map-points-of-interest')).toBeInTheDocument();
        expect(screen.getByTestId('text')).toBeInTheDocument();
        expect(screen.getByTestId('desktop-poi-content')).toBeInTheDocument();
        expect(screen.queryByTestId('mobile-poi-content')).not.toBeInTheDocument();
        expect(mockDesktopPOIContent).toHaveBeenCalledWith({
            categoriesWithItems: mockPoints.categoriesWithItems,
            disclaimerText: 'Disclaimer text',
            disclaimerTooltip: 'Disclaimer tooltip',
            activeIndex: 0,
            setActiveIndex: expect.any(Function),
        });
    });

    it('should call handleCategoryClick when desktop button is clicked', async () => {
        render(<MapPointsOfInterest {...mockProps} />);

        await userEvent.click(screen.getByTestId('desktop-poi-content'));

        expect(mockPoints.handleCategoryClick).toHaveBeenCalled();
    });

    it('should render mobile content when isMobile is true', () => {
        mockProps.fields.DisclaimerText = {};
        mockProps.fields.DisclaimerTooltip = {};
        mockUseMapPointsOfInterest.mockReturnValue({ ...mockPoints, isMobile: true });

        render(<MapPointsOfInterest {...mockProps} />);

        expect(screen.getByTestId('map-points-of-interest')).toBeInTheDocument();
        expect(screen.getByTestId('text')).toBeInTheDocument();
        expect(screen.getByTestId('mobile-poi-content')).toBeInTheDocument();
        expect(screen.queryByTestId('desktop-poi-content')).not.toBeInTheDocument();
        expect(mockMobilePOIContent).toHaveBeenCalledWith({
            categoriesWithItems: mockPoints.categoriesWithItems,
            disclaimerText: '',
            disclaimerTooltip: '',
            showMoreText: 'Show more button text',
            drawerTitle: 'Mobile drawer title',
        });
    });

    it('should call handleCategoryClick when mobile button is clicked', async () => {
        mockUseMapPointsOfInterest.mockReturnValue({ ...mockPoints, isMobile: true });

        render(<MapPointsOfInterest {...mockProps} />);

        await userEvent.click(screen.getByTestId('mobile-poi-content'));

        expect(mockPoints.handleCategoryClick).toHaveBeenCalled();
    });
});
