import * as React from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TripAdvisorAwardType } from 'models/enum/TripAdvisorAwardType';

export const TripAdvisorCertificates = () => {
    const { reviewsData } = useStore(stores => ({
        reviewsData: stores.hotelReviewsStore.data,
    }));

    const getCertificatesToShow = () =>
        reviewsData.certificates.filter(
            apiCertificate =>
                (apiCertificate.award_type === TripAdvisorAwardType.TravelersChoiceBestOfBest ||
                    apiCertificate.award_type === TripAdvisorAwardType.TravelersChoice) &&
                !!apiCertificate.images.large,
        );

    const certificates = getCertificatesToShow();

    return (
        <div
            className={classNames('tripadvisor-certificates', {
                'tripadvisor-certificates--multiple': certificates.length > 1,
            })}
            data-tid='trip-advisor-certificates'
        >
            {certificates.map(certificate => (
                <div key={certificate.award_type} data-tid='trip-advisor-certificate'>
                    <div
                        data-tid='tripadvisor-certificate-image'
                        style={{ backgroundImage: `url(${certificate.images.large})` }}
                        className='tripadvisor-certificate-image'
                    />
                </div>
            ))}
        </div>
    );
};

export default observer(TripAdvisorCertificates);
