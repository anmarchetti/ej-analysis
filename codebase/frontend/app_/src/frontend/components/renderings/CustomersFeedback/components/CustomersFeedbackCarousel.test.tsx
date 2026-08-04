import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__/createMockStores';

import CustomersFeedbackCarousel from './CustomersFeedbackCarousel';

const createProps = () => ({
    items: [
        { title: 'title1', text: 'text1', date: 'date1', rating: 2, customerName: 'customerName1' },
        { title: 'title2', text: 'text2', date: 'date2', rating: 3, customerName: 'customerName2' },
        { title: 'title3', text: 'text3', date: 'date3', rating: 4, customerName: 'customerName3' },
        { title: 'title4', text: 'text4', date: 'date4', rating: 5, customerName: 'customerName4' },
    ],
    showTitlesAndComments: true,
    itemsPerSlideDesktop: 2,
    itemsPerSlideMobile: 1,
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/renderings/CustomersFeedback/components/CustomerFeedbackCard', () => () => (
    <div data-tid='customer-feedback-card' />
));

jest.mock('frontend/components/common/CarouselWrapper/CarouselWrapper', () => {
    const { forwardRef } = jest.requireActual('react');

    return {
        __esModule: true,
        default: forwardRef(({ children }: any, ref: any) => {
            ref.current = {
                goToSlide: jest.fn(),
                ...ref.current,
            };

            return (
                <div data-tid='carousel'>
                    <div>{children}</div>
                </div>
            );
        }),
    };
});

describe('<CustomersFeedbackCarousel />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores({
            layoutStore: { isFullMaintenance: false },
            appStore: { isNavigationBooking: false, isScreenLessMedium: true },
            bookingStore: { isValidatingPackage: false },
        });
    });

    it('should render Carousel', () => {
        render(<CustomersFeedbackCarousel {...mockProps} />);

        expect(screen.getByTestId('carousel')).toBeInTheDocument();
    });

    it('should render 4 CustomerFeedbackCards', () => {
        render(<CustomersFeedbackCarousel {...mockProps} />);

        expect(screen.getAllByTestId('customer-feedback-card')).toHaveLength(4);
    });

    it('should render 8 dots - 1 active dot, 3 regular dots, 1 small dot and 3 hidden dots', () => {
        mockProps.items = [
            { title: 'title1', text: 'text1', date: 'date1', rating: 2, customerName: 'customerName1' },
            { title: 'title2', text: 'text2', date: 'date2', rating: 3, customerName: 'customerName2' },
            { title: 'title3', text: 'text3', date: 'date3', rating: 4, customerName: 'customerName3' },
            { title: 'title4', text: 'text4', date: 'date4', rating: 5, customerName: 'customerName4' },
            { title: 'title5', text: 'text1', date: 'date1', rating: 2, customerName: 'customerName1' },
            { title: 'title6', text: 'text2', date: 'date2', rating: 3, customerName: 'customerName2' },
            { title: 'title7', text: 'text3', date: 'date3', rating: 4, customerName: 'customerName3' },
            { title: 'title8', text: 'text4', date: 'date4', rating: 5, customerName: 'customerName4' },
        ];
        const { container } = render(<CustomersFeedbackCarousel {...mockProps} />);

        expect(screen.getAllByRole('listitem')).toHaveLength(8);
        expect(container.getElementsByClassName('carousel-dot--active')).toHaveLength(1);
        expect(container.getElementsByClassName('carousel-dot--small')).toHaveLength(1);
        expect(container.getElementsByClassName('carousel-dot--regular')).toHaveLength(3);
        expect(container.getElementsByClassName('carousel-dot--hidden')).toHaveLength(3);
    });

    it('should change dots on click', async () => {
        mockProps.items = [
            { title: 'title1', text: 'text1', date: 'date1', rating: 2, customerName: 'customerName1' },
            { title: 'title2', text: 'text2', date: 'date2', rating: 3, customerName: 'customerName2' },
        ];
        const { container } = render(<CustomersFeedbackCarousel {...mockProps} />);

        const button = screen.getAllByRole('listitem')[1];
        await userEvent.click(button);
        expect(container.getElementsByClassName('carousel-dot--active')).toHaveLength(1);
    });
});
