import { FC } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { getBgImage } from 'frontend/utils/image.utils';
import { getRoomName } from 'frontend/utils/offer.utils';
import { PackageIconTypes } from 'models/enum/PackageIconTypes';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import HolidayPackageIcons from 'frontend/components/common/HolidayPackageIcons';
import JSSImage from 'frontend/components/common/JSSImage';
import LuxuryWrapper from 'frontend/components/common/LuxuryWrapper/LuxuryWrapper';
import PriceLabel from 'frontend/components/common/PriceLabel/PriceLabel';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import { IExportButtonsFields } from 'frontend/components/renderings/ExportButtons/ExportButtons';
import { IHotelPosterFields } from 'frontend/components/renderings/HotelPoster/HotelPoster';
import {
    getPosterMeta,
    getTouristTaxLabelForPoster,
} from 'frontend/components/renderings/HotelPoster/HotelPoster.utils';

import styles from './HotelDetailsLayout.module.scss';

export interface IHotelDetailsLayoutProps {
    hasEjLogo: boolean;
    hasUMLogo: boolean;
    posterFields: IExportButtonsFields;
    posterId: string;
    wholePartPP: number;
    UMLogoImage?: string;
    fields?: IHotelPosterFields;
    logoImage?: ISitecoreField<ISitecoreImage>;
}

export const HotelDetailsLayout: FC<IHotelDetailsLayoutProps> = ({
    fields,
    wholePartPP,
    posterFields,
    posterId,
    hasEjLogo,
    hasUMLogo,
    logoImage,
    UMLogoImage,
}) => {
    const { getPhrase, formatMoney, currency, isLuxuryPackage, hotelInfo, offer, basePath, isTouristTaxEnabled } =
        useStore(stores => ({
            getPhrase: stores.layoutStore.getPhrase,
            formatMoney: stores.marketStore.formatMoney,
            currency: stores.bookingStore.currency,
            isLuxuryPackage: stores.bookingStore.isLuxuryPackage,
            hotelInfo: stores.bookingStore.hotel,
            offer: stores.bookingStore.selectedOffer,
            basePath: stores.layoutStore.basePath,
            isTouristTaxEnabled: stores.layoutStore.isTouristTaxEnabled,
        }));

    if (!fields || !hotelInfo || !offer) {
        return null;
    }

    const { transfers, hotel } = offer;
    const { location, name, images } = hotelInfo;
    const { RoomLabel, BoardLabel, AirportLabel, DepositLabel, ConclusionLabel } = fields;
    const posterMeta = getPosterMeta({
        hotelInfo,
        offer,
        getPhrase,
    });

    if (!posterMeta) {
        return null;
    }

    const { hotelLocation, departureDate, holidayDuration, roomType, boardType, theme, outbound } = posterMeta;
    const { FastTrackSecurityIcon, FastTrackSecurityLabel } = posterFields;
    const backgroundImage = getBgImage(images, basePath);
    const touristTaxLabel = getTouristTaxLabelForPoster(isTouristTaxEnabled, getPhrase, offer?.touristTaxPP);
    const roomTitle = !!roomType && getRoomName(roomType);
    const showLuxuryWrapper = isLuxuryPackage && hasEjLogo;
    const extraIcon =
        isLuxuryPackage && FastTrackSecurityIcon?.value.src
            ? {
                  iconUrl: FastTrackSecurityIcon.value.src,
                  key: PackageIconTypes.FastTrack,
                  name: FastTrackSecurityLabel?.value ?? '',
              }
            : undefined;

    return (
        <LuxuryWrapper
            label={getPhrase(SitecoreDictionary.GlobalsLabelsLuxuryCollection)}
            renderChildrenOnly={!showLuxuryWrapper}
            wrapperClassName={classNames(styles.poster, styles.priority)}
            bannerClassName={styles.luxuryBanner}
            id={posterId}
        >
            {hasEjLogo && logoImage && (
                <JSSImage
                    className={classNames(styles.logo, { [styles.luxury]: showLuxuryWrapper })}
                    field={logoImage}
                    data-tid='easyjet-logo'
                />
            )}
            {hasUMLogo && UMLogoImage && (
                <img className={styles.logo} src={UMLogoImage} data-tid='um-logo' alt='um-logo' />
            )}
            <div className={styles.header}>
                <div className={styles.background} style={{ backgroundImage }}>
                    <div className={styles.location}>{location.name}</div>
                </div>
            </div>
            <div className={styles.body}>
                <div className={styles.hotelLocation}>{hotelLocation}</div>
                <div className={styles.hotelName}>{name}</div>
                <div className={styles.date}>
                    <span className={styles.departureDate}>{departureDate}</span>
                    &nbsp;-&nbsp;
                    <span>{holidayDuration}</span>
                </div>
                <div className={styles.roomAndBoard}>
                    {RoomLabel && roomType && (
                        <div>
                            {RoomLabel.value}
                            &nbsp;
                            {roomTitle}
                        </div>
                    )}
                    {BoardLabel && boardType && (
                        <div>
                            {BoardLabel.value}
                            &nbsp;
                            {boardType.title || boardType.name}
                        </div>
                    )}
                </div>
                {AirportLabel && outbound && (
                    <div>
                        {AirportLabel.value}
                        &nbsp;
                        {outbound.depName}
                    </div>
                )}
                <PriceLabel
                    tag='div'
                    className={styles.price}
                    price={formatMoney(wholePartPP, { currency, maximumFractionDigits: 0 })}
                    priceDictionary={SitecoreDictionary.GlobalsPriceLabelsPerPerson}
                />
                {touristTaxLabel && (
                    <RichTextWithLinks
                        field={{ value: touristTaxLabel }}
                        tag='div'
                        dataId='tourist-tax-label'
                        className={styles.touristTax}
                    />
                )}
                {DepositLabel && <div>{DepositLabel.value}</div>}
                <div className={classNames(styles.facilities, { [styles.luxury]: showLuxuryWrapper })}>
                    <HolidayPackageIcons
                        packageIcons={theme?.packageIcons || hotel?.theme?.packageIcons || []}
                        transfer={transfers?.length ? offer.transfers[0] : null}
                        extraLuggage={offer?.extraLuggageInfo}
                        className='hotel-poster'
                        iconClassName={styles.iconWrapper}
                        extraIcon={extraIcon}
                        isLuxuryPackage={isLuxuryPackage}
                    />
                </div>
                {ConclusionLabel && <div>{ConclusionLabel.value}</div>}
            </div>
        </LuxuryWrapper>
    );
};

export default observer(HotelDetailsLayout);
