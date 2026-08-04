import React from 'react';
import { StateCallBack } from 'react-multi-carousel';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import CarouselButtonsGroup, { ICarouselButtonsGroupProps } from './CarouselButtonsGroup';

const createProps = (): ICarouselButtonsGroupProps => ({
    next: jest.fn(),
    previous: jest.fn(),
    carouselState: { currentSlide: 1, totalItems: 5, slidesToShow: 3 } as StateCallBack,
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/icons-new/ChevronLeft', () => () => <div data-tid='chevron-left' />);

jest.mock('frontend/components/icons-new/ChevronRight', () => () => <div data-tid='chevron-right' />);

describe('<CarouselPrevAndNextButtons />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores();
    });

    it('should NOT render when next function is undefined', () => {
        mockProps.next = undefined;
        const { container } = render(<CarouselButtonsGroup {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when previous function is undefined', () => {
        mockProps.previous = undefined;
        const { container } = render(<CarouselButtonsGroup {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when carouselState is undefined', () => {
        mockProps.carouselState = undefined;
        const { container } = render(<CarouselButtonsGroup {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when total items is 4 and minNumberOfItems is 5', () => {
        mockProps.carouselState.totalItems = 4;
        mockProps.minNumberOfItems = 5;
        const { container } = render(<CarouselButtonsGroup {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when total items is 3', () => {
        mockProps.carouselState.totalItems = 3;
        const { container } = render(<CarouselButtonsGroup {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render 2 buttons', () => {
        render(<CarouselButtonsGroup {...mockProps} />);

        expect(screen.getAllByRole('button').length).toBe(2);

        expect(screen.getByLabelText(SitecoreDictionary.AccessibilityAriaLabelsNextButton)).toBeInTheDocument();
        expect(screen.getByLabelText(SitecoreDictionary.AccessibilityAriaLabelsPreviousButton)).toBeInTheDocument();
    });

    describe('Previous button', () => {
        it('should render ChevronLeft', () => {
            render(<CarouselButtonsGroup {...mockProps} />);

            const prevButton = screen.getByTestId('carousel-button-previous');
            expect(prevButton).toContainElement(screen.getByTestId('chevron-left'));
        });

        it('should render disable button when current slides is 0', () => {
            mockProps.carouselState.currentSlide = 0;
            render(<CarouselButtonsGroup {...mockProps} />);

            const prevButton = screen.getByTestId('carousel-button-previous');
            expect(prevButton).toHaveAttribute('disabled');
            expect(prevButton).toHaveClass('disabled');
        });

        it('should call previous on click', async () => {
            render(<CarouselButtonsGroup {...mockProps} />);

            const prevButton = screen.getByTestId('carousel-button-previous');
            await userEvent.click(prevButton);
            expect(mockProps.previous).toHaveBeenCalled();
        });

        it('should add class from props', () => {
            mockProps.prevClassName = 'test';
            render(<CarouselButtonsGroup {...mockProps} />);

            const prevButton = screen.getByTestId('carousel-button-previous');
            expect(prevButton).toHaveClass(mockProps.prevClassName);
        });
    });

    describe('Next button', () => {
        it('should render ChevronLeft', () => {
            render(<CarouselButtonsGroup {...mockProps} />);

            const nextButton = screen.getByTestId('carousel-button-next');
            expect(nextButton).toContainElement(screen.getByTestId('chevron-right'));
        });

        it('should render disable button when current slides is equal to totalItems - slidesToShow', () => {
            mockProps.carouselState.currentSlide = 2;
            render(<CarouselButtonsGroup {...mockProps} />);

            const nextButton = screen.getByTestId('carousel-button-next');
            expect(nextButton).toHaveAttribute('disabled');
            expect(nextButton).toHaveClass('disabled');
        });

        it('should call next on click', async () => {
            render(<CarouselButtonsGroup {...mockProps} />);

            const nextButton = screen.getByTestId('carousel-button-next');
            await userEvent.click(nextButton);
            expect(mockProps.next).toHaveBeenCalled();
        });

        it('should add class from props', () => {
            mockProps.nextClassName = 'test';
            render(<CarouselButtonsGroup {...mockProps} />);

            const nextButton = screen.getByTestId('carousel-button-next');
            expect(nextButton).toHaveClass(mockProps.nextClassName);
        });
    });
});
