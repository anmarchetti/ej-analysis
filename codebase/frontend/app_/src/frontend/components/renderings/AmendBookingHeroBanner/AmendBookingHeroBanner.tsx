import * as React from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { getAmendmentRoundedPrice } from 'frontend/utils/amendBooking.utils';
import { getSitecoreImageBackgroundStyles } from 'frontend/utils/getImage';
import { IBreadcrumb } from 'models/data/IBreadcrumb';
import { MediaSize } from 'models/data/MediaSizeParams';
import { AmendScenarios } from 'models/enum/amend/AmendScenarios';
import AmendBookingHeroBannerVariants from 'models/enum/AmendBookingHeroBannerVariants';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SitePath from 'models/enum/SitePath';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import DestinationBreadcrumbs from 'frontend/components/renderings/DestinationBreadcrumbs';

interface IUpgradePriceInfo {
    label: string;
    price: string;
}

interface IAmendBookingHeroBannerParameters {
    Variant: AmendBookingHeroBannerVariants;
}

interface IAmendBookingHeroBannerFields {
    Image: ISitecoreField<ISitecoreImage>;
    Name: ISitecoreField<string>;
    PageDescription: ISitecoreField<string>;
    Subtitle: ISitecoreField<string>;
}

interface IAmendBookingHeroBannerProps
    extends ISitecoreComponent<IAmendBookingHeroBannerFields, IAmendBookingHeroBannerParameters> {
    isEditMode: boolean;
}

const AmendBookingHeroBanner = (props: IAmendBookingHeroBannerProps) => {
    const {
        currentPath,
        getBreadcrumb,
        getPhrase,
        isAmendTransfersPage,
        transferStoreUpgradePrice,
        datesStoreUpgradePrice,
        isFromBooking,
        isScreenLessMedium,
        isAmendPriceEnabledOnChangeTransferPage,
        currency,
        formatMoney,
        amendTransfersScenario,
        amendFlightsScenario,
    } = useStore((stores: IHolidaysStores) => ({
        currentPath: stores.layoutStore.currentPath,
        getBreadcrumb: stores.layoutStore.getBreadcrumb,
        getPhrase: stores.layoutStore.getPhrase,
        transferStoreUpgradePrice: stores.amendTransfersStore.upgradePrice,
        isFromBooking: stores.amendTransfersStore.isFromBooking,
        datesStoreUpgradePrice: stores.amendDatesStore.transfer.upgradePrice,
        isScreenLessMedium: stores.appStore.isScreenLessMedium,
        isAmendTransfersPage: stores.layoutStore.isAmendTransfersPage,
        isAmendPriceEnabledOnChangeTransferPage: stores.amendTransfersStore.isAmendPriceEnabledOnChangeTransferPage,
        currency: stores.amendTransfersStore.currency,
        formatMoney: stores.marketStore.formatMoney,
        amendTransfersScenario: stores.amendTransfersStore.scenario,
        amendFlightsScenario: stores.amendFlightsStore.scenario,
    }));

    if (!props.fields) {
        return null;
    }

    const { Variant } = props.params || {};
    const { Name, Image, Subtitle, PageDescription } = props.fields;

    const upgradePrice = isFromBooking ? transferStoreUpgradePrice : datesStoreUpgradePrice;
    const isTranslucentStripe = Variant === AmendBookingHeroBannerVariants.TranslucentWhiteStripe;
    const currentPageBreadcrumb = currentPath !== SitePath.ViewBooking ? getBreadcrumb(currentPath as SitePath) : null;
    const breadcrumbs: IBreadcrumb[] = currentPageBreadcrumb
        ? [getBreadcrumb(SitePath.ViewBooking), currentPageBreadcrumb]
        : [];

    const renderImage = () => (
        <div
            className='amend-hero-banner__image'
            style={getSitecoreImageBackgroundStyles(
                Image,
                isScreenLessMedium ? MediaSize.Medium : MediaSize.Large,
                isScreenLessMedium,
                props.isEditMode,
            )}
        />
    );

    const renderTextBlock = (field: ISitecoreField<string>, style: string) =>
        !!field?.value && <Text className={`amend-hero-banner__${style}`} field={field} tag='div' />;

    const getUpgradePriceInfo = (): Nullable<IUpgradePriceInfo> => {
        if (isAmendTransfersPage && isAmendPriceEnabledOnChangeTransferPage && upgradePrice > 0) {
            return {
                price: formatMoney(getAmendmentRoundedPrice(upgradePrice), { currency, maximumFractionDigits: 0 }),
                label: getPhrase(SitecoreDictionary.AmendTransferLabelsUpgradeTransfer),
            };
        }

        return null;
    };

    // Should not show the breadcrumbs if either amend transfers or amend flights scenario is from change date
    const isFromChangeDates = [amendTransfersScenario, amendFlightsScenario].includes(AmendScenarios.FromChangeDate);
    const shouldShowBreadcrumbs = !isFromChangeDates && !!breadcrumbs.length;

    const upgradePriceInfo = getUpgradePriceInfo();

    return (
        <div
            className={classNames(
                'amend-hero-banner',
                isTranslucentStripe ? 'amend-hero-banner--translucent-stripe' : 'amend-hero-banner--gradient-overlay',
            )}
        >
            <div className='amend-hero-banner__content-wrapper'>
                {renderImage()}
                <div className='amend-hero-banner__inner wrapper-container wrapper-container--px'>
                    {shouldShowBreadcrumbs && (
                        <div className='amend-hero-banner__placeholder-top'>
                            <DestinationBreadcrumbs isOpaqueStyle breadcrumbs={breadcrumbs} hideHomeBreadcrumb />
                        </div>
                    )}

                    <div
                        className={classNames({
                            ['amend-hero-banner__text']: true,
                        })}
                        aria-label={Name?.value}
                        data-tid='change-flights-text'
                    >
                        {renderTextBlock(Subtitle, 'subtitle')}
                        {!!Name?.value && <Text className='amend-hero-banner__title' field={Name} tag='h1' />}
                        {!!PageDescription && (
                            <RichTextWithLinks
                                className='amend-hero-banner__description'
                                field={PageDescription}
                                tag='div'
                            />
                        )}
                    </div>
                </div>
                {upgradePriceInfo && (
                    <div
                        className='amend-hero-banner__inner amend-hero-banner__price  wrapper-container--px'
                        data-tid='upgrade-price-banner'
                    >
                        <div className='amend-hero-banner__price-block'>
                            <p>{upgradePriceInfo.label}</p>
                            <span>{upgradePriceInfo.price}</span>
                        </div>
                    </div>
                )}
                {!isTranslucentStripe && <div className={classNames('amend-hero-banner--triangle', 'triangle-end')} />}
            </div>
        </div>
    );
};

export default AmendBookingHeroBanner;
