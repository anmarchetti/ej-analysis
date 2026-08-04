import * as React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { IReviewsData } from 'frontend/store/base';
import { TripAdvisorAwardType } from 'models/enum/TripAdvisorAwardType';

import { TripAdvisorCertificates } from './TripAdvisorCertificates';

let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<TripAdvisorCertificates />', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            hotelReviewsStore: {
                data: {
                    averageRating: null,
                    totalReviewsAmount: 0,
                    reviews: [],
                    reviewRatingAmounts: [],
                    subratings: [],
                    certificates: [],
                    webUrl: '',
                } as IReviewsData,
            },
        });
    });

    it('should standart render', () => {
        render(<TripAdvisorCertificates />);
        expect(screen.getByTestId('trip-advisor-certificates')).toBeInTheDocument();
        expect(screen.queryAllByTestId('trip-advisor-certificate')).toHaveLength(0);
    });

    it('should render certificate', () => {
        mockStores.hotelReviewsStore.data.certificates = [
            {
                award_type: TripAdvisorAwardType.TravelersChoice,
                year: '2021',
                images: {
                    small: 'http://www.tripadvisor.com/img/cdsi/img2/awards/CERTIFICATE_OF_EXCELLENCE_v2_small-63520-5.jpg',
                    large: 'http://www.tripadvisor.com/img/cdsi/img2/awards/CERTIFICATE_OF_EXCELLENCE_2021_en_US_large-63520-5.jpg',
                },
            },
        ];
        render(<TripAdvisorCertificates />);
        expect(screen.getByTestId('trip-advisor-certificate')).toBeInTheDocument();
        expect(screen.getByTestId('tripadvisor-certificate-image')).toHaveAttribute(
            'style',
            'background-image: url(http://www.tripadvisor.com/img/cdsi/img2/awards/CERTIFICATE_OF_EXCELLENCE_2021_en_US_large-63520-5.jpg);',
        );
    });

    it('should render two certificates', () => {
        mockStores.hotelReviewsStore.data.certificates = [
            {
                award_type: TripAdvisorAwardType.TravelersChoice,
                year: '2021',
                images: {
                    small: 'http://www.tripadvisor.com/img/cdsi/img2/awards/CERTIFICATE_OF_EXCELLENCE_v2_small-63520-5.jpg',
                    large: 'http://www.tripadvisor.com/img/cdsi/img2/awards/CERTIFICATE_OF_EXCELLENCE_2021_en_US_large-63520-5.jpg',
                },
            },
            {
                award_type: TripAdvisorAwardType.TravelersChoiceBestOfBest,
                year: '2021',
                images: {
                    small: 'http://www.tripadvisor.com/img/cdsi/img2/awards/CERTIFICATE_OF_EXCELLENCE_v2_small-63520-5.jpg',
                    large: 'http://www.tripadvisor.com/img/cdsi/img2/awards/CERTIFICATE_OF_EXCELLENCE_2021_en_US_large-63520-5.jpg',
                },
            },
        ];
        render(<TripAdvisorCertificates />);

        const images = screen.getAllByTestId('tripadvisor-certificate-image');

        expect(screen.getAllByTestId('trip-advisor-certificate')).toHaveLength(2);
        expect(images[0]).toHaveAttribute(
            'style',
            'background-image: url(http://www.tripadvisor.com/img/cdsi/img2/awards/CERTIFICATE_OF_EXCELLENCE_2021_en_US_large-63520-5.jpg);',
        );

        expect(images[1]).toHaveAttribute(
            'style',
            'background-image: url(http://www.tripadvisor.com/img/cdsi/img2/awards/CERTIFICATE_OF_EXCELLENCE_2021_en_US_large-63520-5.jpg);',
        );
    });
});
