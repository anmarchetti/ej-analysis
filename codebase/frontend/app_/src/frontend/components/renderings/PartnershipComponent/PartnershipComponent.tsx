import { FunctionComponent, useCallback, useEffect, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { ScreenBreakpoints } from 'code/screenBreakpoints';
import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { isTradeStore, ITradePortalStores } from 'frontend/store/tradePortal';
import { getLivePriceCriterion } from 'frontend/utils/livePrice.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { formatMoneyWithTouristTax } from 'frontend/utils/touristTax.utils';
import { buildSitecoreLinkFullUrl } from 'frontend/utils/url.utils';
import { ILivePrice, ILivePriceOptionFields } from 'models/data/ILivePrice';
import { MediaSize } from 'models/data/MediaSizeParams';
import { PartnershipComponentThemes } from 'models/enum/PartnershipComponentThemes';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreImage, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import ConditionalWrapper from 'frontend/components/common/ConditionalWrapper/ConditionalWrapper';
import JSSImageNext from 'frontend/components/common/JSSImageNext/JSSImageNext';
import PriceLabel from 'frontend/components/common/PriceLabel/PriceLabel';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import RouterLink from 'frontend/components/common/RouterLink';
import { TouristTaxGenericTooltip } from 'frontend/components/common/TouristTaxGenericTooltip/TouristTaxGenericTooltip';

import LogoImage from './components/LogoImage/LogoImage';

interface IPartnershipComponentParams {
    IsBackgroundImageWide: boolean;
    Theme: PartnershipComponentThemes;
}
interface IPartnershipComponentFields {
    Description: ISitecoreField<string>;
    EnableNumberOfNights: ISitecoreField<boolean>;
    Image: ISitecoreField<ISitecoreImage>;
    IsLogoTransparent: ISitecoreField<boolean>;
    Link: ISitecoreField<ISitecoreLink>;
    Logo: ISitecoreField<ISitecoreImage>;
    Subtitle: ISitecoreField<string>;
    Title: ISitecoreField<string>;
}

export type TPartnershipComponentProps = ISitecoreComponent<
    ILivePriceOptionFields & IPartnershipComponentFields,
    IPartnershipComponentParams
>;

const LIVE_PRICE_TRACKING_TEXT = 'Live Price';

export const PartnershipComponent: FunctionComponent<TPartnershipComponentProps> = ({ fields, params }) => {
    const {
        isEditMode,
        getLivePrice,
        getLivePriceCodesByCriteria,
        isLivePriceEnabled,
        trackEventWithParams,
        sitePath,
        isLoggedIn,
        isLoginPage,
        isBookingsListPage,
        isPriceToggleActive,
        formatMoney,
        isNumberOfNightsLabelsEnabled,
        isTouristTaxEnabled,
    } = useStore((stores: TStores | ITradePortalStores) => ({
        isEditMode: stores.layoutStore.isEditMode,
        getLivePrice: stores.hotelsStore.getLivePrice,
        getLivePriceCodesByCriteria: stores.hotelsStore.getLivePriceCodesByCriteria,
        isLivePriceEnabled: stores.layoutStore.isLivePriceEnabled,
        isNumberOfNightsLabelsEnabled: stores.layoutStore.isNumberOfNightsLabelsEnabled,
        trackEventWithParams: stores.trackingStore.trackEventWithParams,
        sitePath: stores.layoutStore.sitePath,
        isTouristTaxEnabled: stores.layoutStore.isTouristTaxEnabled,
        isLoggedIn: stores.userStore.isLoggedIn,
        isBookingsListPage: stores.layoutStore.isBookingsListPage,
        isLoginPage: isTradeStore(stores) && stores.layoutStore.isLoginPage,
        isPriceToggleActive: !isTradeStore(stores) || !stores.layoutStore.isPricesHidden,
        formatMoney: stores.marketStore.formatMoney,
    }));

    const { Theme, IsBackgroundImageWide } = params;

    const {
        Image,
        EnableNumberOfNights,
        Title,
        Subtitle,
        Description,
        Logo,
        Link,
        LivePriceNamedSearches,
        LinkedDestination,
        IsLogoTransparent,
    } = fields || {};

    const withoutLivePriceTheme = Theme === PartnershipComponentThemes.WithoutLivePrice;
    const isStandardTheme = Theme === PartnershipComponentThemes.Standard;
    const isOrangeCTATheme = Theme === PartnershipComponentThemes.StandardWithOrangeCTA;
    const linkedDestinationName = LinkedDestination?.[0]?.fields?.Name?.value;
    const [livePrice, setLivePrice] = useState<Nullable<ILivePrice>>(null);
    const [styles, setStyles] = useState<TStyles | null>(null);

    const formattedTitle = linkedDestinationName
        ? Tokenizer.replaceTokens(Title?.value, {
              [Tokens.Destination]: linkedDestinationName,
          })
        : Title?.value;

    const { ref, inView } = useInView({
        triggerOnce: true,
    });

    const isMounted = useRef(true);

    useEffect(() => {
        if (isStandardTheme || isOrangeCTATheme) {
            import('./PartnershipComponentV1.module.scss').then(module => {
                if (isMounted.current) setStyles(module.default);
            });
        } else {
            import('./PartnershipComponentV2.module.scss').then(module => {
                if (isMounted.current) setStyles(module.default);
            });
        }

        return () => {
            isMounted.current = false;
        };
    }, [isStandardTheme, isOrangeCTATheme]);

    const trackingInfo = {
        location: Subtitle?.value || '',
        name: formattedTitle || '',
        url: buildSitecoreLinkFullUrl(Link, sitePath),
        country: LinkedDestination?.map(el => el?.fields?.Name?.value).join('|') || '',
        price: `${livePrice?.pricePP || 0}`,
    };

    const trackComponent = useCallback(() => {
        trackEventWithParams(EventTypes.ShowPartnershipComponent, trackingInfo);
    }, []);

    const handleClick = (cta: string): void => {
        if (!withoutLivePriceTheme) {
            trackEventWithParams(EventTypes.PartnershipComponentBtnClick, {
                ...trackingInfo,
                cta,
            });
        }
    };

    const renderPriceWrapper = (priceBlock: React.JSX.Element): React.JSX.Element => (
        <TouristTaxGenericTooltip>
            <div>{priceBlock}</div>
        </TouristTaxGenericTooltip>
    );

    useEffect(() => {
        if (inView) trackComponent();
    }, [inView]);

    useEffect(() => {
        const loadLivePrice = async () => {
            const livePriceCriterion = isLivePriceEnabled
                ? getLivePriceCriterion(LinkedDestination, LivePriceNamedSearches)
                : undefined;

            if (livePriceCriterion) {
                const livePriceCodes = await getLivePriceCodesByCriteria([livePriceCriterion]);
                const prices = await getLivePrice(livePriceCodes);

                if (isMounted.current) {
                    setLivePrice(prices?.[0] || null);
                }
            }
        };

        if (!isEditMode && !withoutLivePriceTheme) {
            loadLivePrice();
        }

        return () => {
            isMounted.current = false;
        };
    }, [
        LinkedDestination,
        LivePriceNamedSearches,
        getLivePrice,
        getLivePriceCodesByCriteria,
        isEditMode,
        isLivePriceEnabled,
        withoutLivePriceTheme,
    ]);

    if (!fields || (!isLoggedIn && isBookingsListPage) || !styles) {
        return null;
    }

    const shouldRenderPrice = isPriceToggleActive && !!livePrice?.pricePP;

    const priceLabel = shouldRenderPrice
        ? formatMoneyWithTouristTax(
              livePrice?.pricePP ?? 0,
              livePrice?.pricePPExcludingTouristTax,
              isTouristTaxEnabled,
              formatMoney,
              {
                  currency: livePrice?.currency,
                  maximumFractionDigits: 0,
              },
          )
        : '';

    return (
        <div className={classNames(isLoginPage && styles.isBackground)} data-tid='partnership'>
            <div
                ref={ref}
                className={classNames('no-print', styles.partnershipComponent)}
                data-tid='partnership-component'
            >
                <div className={styles.info}>
                    {!!Subtitle?.value && (
                        <Text className={styles.subtitle} field={Subtitle} tag='div' data-tid='subtitle' />
                    )}
                    {formattedTitle && (
                        <h2 data-tid='title' className={styles.title}>
                            {formattedTitle}
                        </h2>
                    )}
                    {!!Description?.value && <RichTextWithLinks field={Description} className={styles.description} />}

                    {Link?.value?.href && (
                        <RouterLink
                            link={Link}
                            className={classNames(styles.btn, {
                                'btn--outlined': isStandardTheme,
                                [styles.btnOrangeTheme]: isOrangeCTATheme,
                            })}
                            onClick={(): void => handleClick(Link?.value?.text || '')}
                        >
                            {Link.value.text}
                        </RouterLink>
                    )}
                </div>

                <ConditionalWrapper
                    condition={!!Link?.value?.href}
                    wrapper={(children: JSX.Element) => (
                        <RouterLink
                            link={Link}
                            className={styles.imageWrapper}
                            onClick={() => handleClick(LIVE_PRICE_TRACKING_TEXT)}
                        >
                            {children}
                        </RouterLink>
                    )}
                >
                    <div className={styles.bg}>
                        <JSSImageNext
                            field={Image}
                            fill
                            {...(!IsBackgroundImageWide && {
                                mediaSize: {
                                    desktop: MediaSize.Medium,
                                },
                            })}
                            // image will take 100% of width for small screens and 50% for larger screens
                            sizes={`(max-width: ${ScreenBreakpoints.SM}px) 100vw, 50vw`}
                        />
                    </div>
                </ConditionalWrapper>

                <LogoImage
                    isStandardTheme={isStandardTheme}
                    image={Logo}
                    isBgTransparent={IsLogoTransparent?.value}
                    shouldWrap={isLoginPage}
                />

                {shouldRenderPrice && (
                    <PriceLabel
                        dataTid='item-price'
                        tag='div'
                        className={classNames('promo-slide__item__price responsive', styles.itemPrice)}
                        priceDictionary={SitecoreDictionary.GlobalsPriceLabelsPerPersonFrom}
                        price={<span className='price'>{priceLabel}</span>}
                        numberOfNights={
                            isNumberOfNightsLabelsEnabled && !!EnableNumberOfNights?.value
                                ? livePrice?.searchCriteria?.duration
                                : 0
                        }
                        wrapPrice={renderPriceWrapper}
                        wrapLabelBeforePrice={label => <span className={styles.pricePrefix}>{label}</span>}
                        wrapLabelAfterPrice={label => <span className='price-suffix'>{label}</span>}
                    />
                )}
            </div>
        </div>
    );
};

export default observer(PartnershipComponent);
