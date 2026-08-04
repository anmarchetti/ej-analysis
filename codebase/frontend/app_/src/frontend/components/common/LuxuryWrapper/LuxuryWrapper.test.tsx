import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';

import LuxuryWrapper, { ILuxuryWrapperProps, LuxuryTheme } from './LuxuryWrapper';

const createProps = (): ILuxuryWrapperProps => ({
    children: <div data-tid='luxury-wrapper-children' />,
    label: 'luxury label',
    contentClassName: 'contentClassName',
    wrapperClassName: 'wrapperClassName',
});

let mockProps: ILuxuryWrapperProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('Luxury Wrapper', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores();
    });

    it('should render LuxuryWrapper with children and id', () => {
        mockProps.id = 'test-id';
        mockProps.label = undefined;

        render(<LuxuryWrapper {...mockProps} />);

        const wrapper = screen.getByTestId('luxury-wrapper');
        expect(wrapper).toHaveClass('wrapperClassName');
        expect(wrapper).toHaveAttribute('id', 'test-id');

        const contentElement = screen.getByTestId('luxury-content');
        expect(contentElement).toHaveClass(mockProps.contentClassName!, 'luxuryContent');
        expect(contentElement).not.toHaveClass('noBorders');

        expect(screen.getByTestId('luxury-banner')).toHaveTextContent('Globals.Labels.LuxuryCollection');
        expect(screen.getByTestId('luxury-wrapper-children')).toBeInTheDocument();
    });

    it('should apply noBorders class when isPostBookingPages is true', () => {
        mockStores.layoutStore.isPostBookingPages = true;

        render(<LuxuryWrapper {...mockProps} />);

        const contentElement = screen.getByTestId('luxury-content');
        expect(contentElement).toHaveClass('noBorders');
    });

    it('should apply light theme class when theme is Light', () => {
        render(<LuxuryWrapper {...mockProps} theme={LuxuryTheme.Light} />);

        expect(screen.getByTestId('luxury-wrapper')).toHaveClass('lightTheme');
    });

    it('should apply dark orange theme class when theme is DarkOrange', () => {
        render(<LuxuryWrapper {...mockProps} theme={LuxuryTheme.DarkOrange} />);

        expect(screen.getByTestId('luxury-wrapper')).toHaveClass('darkOrangeTheme');
    });

    it('should return children when renderChildrenOnly is true', () => {
        mockProps.renderChildrenOnly = true;
        mockProps.children = 'children content';

        render(<LuxuryWrapper {...mockProps} />);

        expect(screen.queryByTestId('luxury-wrapper')).not.toBeInTheDocument();
        expect(screen.getByText('children content')).toBeInTheDocument();
    });

    it('should render luxury-wrapper-without-banner with id from props when id is provided', () => {
        mockProps.renderChildrenOnly = true;
        mockProps.children = 'children content';
        mockProps.id = 'test-id';

        render(<LuxuryWrapper {...mockProps} />);

        expect(screen.queryByTestId('luxury-wrapper')).not.toBeInTheDocument();

        const wrapper = screen.getByTestId('luxury-wrapper-without-banner');
        expect(wrapper).toHaveClass('wrapperClassName');
        expect(wrapper).toHaveAttribute('id', 'test-id');
        expect(wrapper).toHaveTextContent('children content');
    });
});
