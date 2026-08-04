import { FC, useEffect, useRef, useState } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { TrailingZeroDisplay } from 'code/currency';
import settings from 'code/settings';
import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { getRouteByDirection } from 'frontend/utils/airports.utils';
import { getBgImage } from 'frontend/utils/image.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { ExportFileTypes } from 'models/enum/ExportFileTypes';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import Checkbox from 'frontend/components/common/Checkbox';
import JSSImage from 'frontend/components/common/JSSImage';
import LuxuryWrapper from 'frontend/components/common/LuxuryWrapper/LuxuryWrapper';
import PriceLabel from 'frontend/components/common/PriceLabel/PriceLabel';
import SvgCopy from 'frontend/components/icons-new/Copy';
import SvgDownloadApp from 'frontend/components/icons-new/DownloadApp';
import { getTouristTaxLabelForPoster } from 'frontend/components/renderings/HotelPoster/HotelPoster.utils';
import { DownloadableImage } from 'frontend/components/renderings/SocialMediaContent/components/DownloadableImage/DownloadableImage';
import { useNightsPriceLabel } from 'frontend/components/renderings/SocialMediaContent/hooks/useNightsPriceLabel';
import { useRenderedImage } from 'frontend/components/renderings/SocialMediaContent/hooks/useRenderedImage';
import { useTextareaHeight } from 'frontend/components/renderings/SocialMediaContent/hooks/useTextareaHeight';
import { ISocialMediaContentProps } from 'frontend/components/renderings/SocialMediaContent/interfaces';
import styles from 'frontend/components/renderings/SocialMediaContent/PosterLayout.module.scss';
import { getSocialText } from 'frontend/components/renderings/SocialMediaContent/utils/rendering.utils';

export const SOURCE_ELEMENT_ID = 'srcPoster';
const MAX_SELECTION_RANGE = 99999;

export const PosterLayout: FC<ISocialMediaContentProps> = ({
    fields,
    posterFields,
    posterId,
    hasEjLogo,
    hasUMLogo,
    posterName,
    logoImage,
    UMLogoImage,
    downloadPoster,
    toggleEjLogo,
    toggleUMLogo,
}) => {
    const {
        basePath,
        currency,
        hotel,
        offer,
        isLuxuryPackage,
        totalPricePPWithTouristTax,
        isTouristTaxEnabled,
        formatMoney,
        getPhrase,
        getFormattedNumber,
    } = useStore(stores => ({
        basePath: stores.layoutStore.basePath,
        currency: stores.amendPaymentStore.currency,
        hotel: stores.bookingStore.hotel,
        offer: stores.bookingStore.selectedOffer,
        isLuxuryPackage: stores.bookingStore.isLuxuryPackage,
        isTouristTaxEnabled: stores.layoutStore.isTouristTaxEnabled,
        totalPricePPWithTouristTax: stores.bookingStore.totalPricePPWithTouristTax,
        formatMoney: stores.marketStore.formatMoney,
        getPhrase: stores.layoutStore.getPhrase,
        getFormattedNumber: stores.marketStore.getFormattedNumber,
    }));
    const [hasPriceLabel, setPriceLabel] = useState(false);
    const [visibleImageSrc, toggleImageRender] = useRenderedImage(false, false, false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [totalNights, priceLabel] = useNightsPriceLabel(offer);
    const touristTaxLabel = getTouristTaxLabelForPoster(isTouristTaxEnabled, getPhrase, offer?.touristTaxPP);

    useEffect(() => {
        toggleImageRender({ hasEjLogo, hasUMLogo, hasPriceLabel });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasEjLogo, hasUMLogo, hasPriceLabel]);

    const outboundDepName = offer && getRouteByDirection(offer.transport.routes).outbound?.depName;
    const airportLabel =
        outboundDepName && Tokenizer.replaceToken(fields?.AirportLabel?.value, Tokens.Airport, outboundDepName);
    const socialContentText =
        hotel &&
        getSocialText(hotel, `${totalNights} ${priceLabel} ${touristTaxLabel}`, offer, {
            airportLabel,
            depositLabel: fields?.DepositLabel?.value,
            fastTrackSecurityLabel: posterFields?.FastTrackSecurityLabel?.value,
            getPhrase,
            getFormattedNumber,
        });

    useTextareaHeight(textareaRef.current, socialContentText);

    if (!posterFields || !hotel?.name || !fields) {
        return null;
    }

    const { location, name, images } = hotel;
    const { DownloadLabel, LogoCheckboxLabel, ShowAgentLogoCheckboxLabel } = posterFields;
    const {
        CopyLabel,
        DownloadDesc,
        LeftSectionDesc,
        LeftSectionTitle,
        PriceCheckboxLabel,
        RightSectionTitle,
        RightSectionDesc,
    } = fields;
    const backgroundImage = getBgImage(images, basePath, false);
    const isLuxuryWrapper = isLuxuryPackage && hasEjLogo;

    const copyToClipboard = (): void => {
        const textareaEl = textareaRef.current;

        if (!textareaEl) {
            return;
        }

        textareaEl.select();
        textareaEl.setSelectionRange(0, MAX_SELECTION_RANGE); // For mobile devices

        navigator.clipboard.writeText(textareaEl.value);
    };

    return (
        <div className={styles.wrapper} data-tid='social-media-poster'>
            <div className={styles.section}>
                {!!LeftSectionTitle && (
                    <Text
                        field={LeftSectionTitle}
                        tag={'h3'}
                        data-tid='left-section-title'
                        className={styles.sectionTitle}
                    />
                )}
                {!!LeftSectionDesc && (
                    <Text
                        field={LeftSectionDesc}
                        tag={'h4'}
                        data-tid='left-section-desc'
                        className={styles.sectionDesc}
                    />
                )}
                <div className={styles.posterWrapper}>
                    <LuxuryWrapper
                        label={getPhrase(SitecoreDictionary.GlobalsLabelsLuxuryCollection)}
                        renderChildrenOnly={!isLuxuryWrapper}
                        wrapperClassName={classNames(styles.poster, styles.priority)}
                        bannerClassName={classNames(styles.luxuryBanner, styles.priority)}
                        id={posterId}
                    >
                        <div className={styles.background} id={SOURCE_ELEMENT_ID} style={{ backgroundImage }}>
                            {!!location.name && (
                                <span
                                    className={classNames(styles.location, { [styles.luxury]: isLuxuryWrapper })}
                                    data-tid='location-name'
                                >
                                    {location.name}
                                </span>
                            )}
                            {!!name && (
                                <span className={styles.hotel} data-tid='hotel-name'>
                                    {name}
                                </span>
                            )}
                            {!!logoImage?.value && (
                                <JSSImage
                                    className={classNames(styles.logo, !hasEjLogo && 'd-none')}
                                    field={logoImage}
                                    data-tid='easyjet-logo'
                                />
                            )}
                            {!!UMLogoImage && (
                                <img
                                    className={classNames(styles.UMlogo, !hasUMLogo && 'd-none')}
                                    src={UMLogoImage}
                                    data-tid='um-logo'
                                    alt='um-logo'
                                />
                            )}
                            {!!offer && hasPriceLabel && (
                                <PriceLabel
                                    tag='div'
                                    className='promo-slide__item__price'
                                    priceDictionary={SitecoreDictionary.GlobalsPriceLabelsPerPersonFrom}
                                    price={
                                        <span className='price'>
                                            {formatMoney(totalPricePPWithTouristTax, {
                                                currency,
                                                trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
                                            })}
                                        </span>
                                    }
                                    wrapLabelBeforePrice={label => (
                                        <span className='price-prefix'>
                                            {totalNights} {label}
                                        </span>
                                    )}
                                    wrapLabelAfterPrice={label => <span className='price-suffix'>{label}</span>}
                                    wrapPrice={block => <div>{block}</div>}
                                    dataTid='price-label'
                                />
                            )}
                        </div>
                        <DownloadableImage
                            src={visibleImageSrc}
                            name={posterName}
                            size={settings.TradePortal.ExportImageSizePx}
                        />
                    </LuxuryWrapper>
                </div>
                <div className={styles.checkboxes}>
                    {!!LogoCheckboxLabel?.value && (
                        <Checkbox
                            disabled={hasUMLogo}
                            checked={hasEjLogo}
                            onChange={toggleEjLogo}
                            dataTid='hide-ej-logo-checkbox'
                            tick
                            medium
                        >
                            {LogoCheckboxLabel.value}
                        </Checkbox>
                    )}
                    {!!ShowAgentLogoCheckboxLabel?.value && !!UMLogoImage && (
                        <Checkbox
                            disabled={hasEjLogo}
                            checked={hasUMLogo}
                            onChange={toggleUMLogo}
                            dataTid='hide-um-logo-checkbox'
                            tick
                            medium
                        >
                            {ShowAgentLogoCheckboxLabel.value}
                        </Checkbox>
                    )}
                    {!!PriceCheckboxLabel?.value && (
                        <Checkbox
                            checked={hasPriceLabel}
                            onChange={(): void => setPriceLabel(!hasPriceLabel)}
                            dataTid='hide-price-checkbox'
                            tick
                            medium
                        >
                            {PriceCheckboxLabel.value}
                        </Checkbox>
                    )}
                </div>
                {!!posterName && !!DownloadLabel?.value && (
                    <Button
                        isMedium
                        onClick={(): Promise<void> => downloadPoster(posterName, ExportFileTypes.PNG)}
                        className={styles.actionBtn}
                        dataTid='download-poster'
                    >
                        <span className='btn__icon'>
                            <SvgDownloadApp />
                        </span>
                        <Text field={DownloadLabel} tag={'span'} />
                    </Button>
                )}
                {!!DownloadDesc && <Text field={DownloadDesc} tag={'span'} className={styles.actionBtnDesc} />}
            </div>
            <div className={styles.section}>
                {!!RightSectionTitle && (
                    <Text
                        field={RightSectionTitle}
                        tag={'h3'}
                        className={styles.sectionTitle}
                        data-tid='right-section-title'
                    />
                )}
                {!!RightSectionDesc && (
                    <Text
                        field={RightSectionDesc}
                        tag={'h4'}
                        className={styles.sectionDesc}
                        data-tid='right-section-desc'
                    />
                )}
                <textarea readOnly className={styles.textarea} ref={textareaRef} data-tid='social-content-text'>
                    {socialContentText}
                </textarea>
                {!!CopyLabel?.value && (
                    <Button isMedium dataTid='clipboard-copy' onClick={copyToClipboard}>
                        <span className='btn__icon'>
                            <SvgCopy />
                        </span>
                        {!!CopyLabel && <Text field={CopyLabel} tag={'span'} />}
                    </Button>
                )}
            </div>
        </div>
    );
};

export default observer(PosterLayout);
