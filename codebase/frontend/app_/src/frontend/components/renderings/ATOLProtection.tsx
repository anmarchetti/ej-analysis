import * as React from 'react';
import { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { IBookingPdfRequest } from 'frontend/utils/viewBooking.utils';
import { FileType } from 'models/enum/FileType';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import FileDownload from 'frontend/components/common/FileDownload';
import JSSImage from 'frontend/components/common/JSSImage';

export enum ATOLProtectionVariant {
    Default = '',
    WithButtonsAndBorders = 'With buttons and borders',
    WithoutButtonsAndBorders = 'Without buttons and borders',
}

interface IATOLProtectionFields {
    Image: ISitecoreField<ISitecoreImage>;
    Text: ISitecoreField<string>;
    Title: ISitecoreField<string>;
}

interface IATOLProtectionParams {
    Variant: ATOLProtectionVariant;
}

interface IATOLProtectionProps extends ISitecoreComponent<IATOLProtectionFields, IATOLProtectionParams> {
    isLoggedInUserLead: boolean;
    bookingPdfFileName?: string;
    bookingPdfLink?: string;
    bookingPdfRequestData?: IBookingPdfRequest;
    isBookingCanceled?: boolean;
    isExternalAgency?: boolean;
    onLogin?: (event?: React.MouseEvent<HTMLButtonElement, MouseEvent>, shouldRedirectAfterLogin?: boolean) => void;
    showLoginButton?: boolean;
}

export const ATOLProtection: FC<IATOLProtectionProps> = ({
    fields,
    params,
    bookingPdfLink,
    bookingPdfFileName,
    bookingPdfRequestData,
    isBookingCanceled,
    isLoggedInUserLead,
    isExternalAgency,
    showLoginButton,
    onLogin,
}) => {
    const { getPhrase, isATOLProtectionEnabled, isConfirmationPage } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        isATOLProtectionEnabled: stores.layoutStore.isATOLProtectionEnabled,
        isConfirmationPage: stores.layoutStore.isConfirmationPage,
    }));
    const isWithoutButtonsAndBordersVariant = params.Variant === ATOLProtectionVariant.WithoutButtonsAndBorders;

    if (!fields || !isATOLProtectionEnabled) {
        return null;
    }

    return (
        <div
            className={classNames('rounded-container', 'booking-protected-container', 'no-print', {
                'no-borders': isWithoutButtonsAndBordersVariant,
            })}
        >
            {isBookingCanceled && <div className='overlay' />}

            <div className='booking-protected'>
                <div className='booking-protected__info'>
                    {fields.Image && <JSSImage field={fields.Image} className='booking-protected__image' />}
                    {fields.Title && <Text field={fields.Title} tag='h2' className='booking-protected__title' />}
                    {fields.Text && <Text field={fields.Text} tag='p' className='booking-protected__text' />}
                </div>

                {!isBookingCanceled && !isExternalAgency && !isWithoutButtonsAndBordersVariant && (
                    <div className='booking-protected__button no-print'>
                        {isLoggedInUserLead && bookingPdfFileName && bookingPdfLink && (
                            <FileDownload
                                fileName={bookingPdfFileName}
                                fileType={FileType.Pdf}
                                fileURL={bookingPdfLink}
                                fileRequestData={bookingPdfRequestData}
                                buttonClassName={classNames({
                                    'confirmation-button': isConfirmationPage,
                                })}
                                isPrimary
                            >
                                {getPhrase(SitecoreDictionary.BookingSummaryButtonsDownloadAtolCertificate)}
                            </FileDownload>
                        )}
                        {!isLoggedInUserLead && showLoginButton && (
                            <Button
                                isPrimary
                                onClick={(e): void => onLogin?.(e, false)}
                                className={isConfirmationPage ? 'confirmation-button' : ''}
                            >
                                {getPhrase(SitecoreDictionary.BookingSummaryButtonsLoginToDownload)}
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ATOLProtection;
