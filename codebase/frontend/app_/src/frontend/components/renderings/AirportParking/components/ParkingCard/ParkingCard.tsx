import { FunctionComponent } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import { TrailingZeroDisplay } from 'code/currency';
import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { getCustomisableTitleClassName } from 'frontend/utils/componentStylesCustomisation.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { IAirportParking } from 'models/data/externalExtras/IAirportParking';
import {
    TitleFontSizeMobileAndDesktop,
    TitleFontStyle,
    TitleWeight,
} from 'models/enum/CustomisableComponentsParameters';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import {
    AirportParkingCardPill,
    PillType,
} from 'frontend/components/common/Pills/AirportParkingCardPill/AirportParkingCardPill';
import SvgParkingCardTypeMeetAndGreat from 'frontend/components/icons-new/ParkingCardTypeMeetAndGreet';
import SvgParkingCardTypeParkAndRide from 'frontend/components/icons-new/ParkingCardTypeParkAndRide';
import SvgParkingCardTypeParkAndStroll from 'frontend/components/icons-new/ParkingCardTypeParkAndStroll';
import { useAirportParkingLocalStore } from 'frontend/components/renderings/AirportParking/stores/airportParkingLocalStore';

import styles from './ParkingCard.module.scss';

export interface IParkingCardProps {
    ParkingCardTransfersText: ISitecoreField<string>;
    ParkingListMoreInfoButtonText: ISitecoreField<string>;
    airportParking: IAirportParking;
}

const params = {
    TitleFontSize: TitleFontSizeMobileAndDesktop.Mobile18Desktop24,
    TitleWeight: TitleWeight.Weight400,
    TitleFontStyle: TitleFontStyle.RoundedDemi,
};

export const ParkingCard: FunctionComponent<IParkingCardProps> = ({
    airportParking,
    ParkingCardTransfersText,
    ParkingListMoreInfoButtonText,
}) => {
    const { tracking } = useAirportParkingLocalStore();

    const {
        getPhrase,
        formatMoney,
        isAirportParkingFreeCancellationPillEnabled,
        currency,
        validateParking,
        toggleIsParkingDetailsPopupOpened,
        setSelectedAirportParkingDetails,
        isParkingDetailsViewPageEnabled,
    } = useStore((stores: IHolidaysStores) => ({
        isAirportParkingFreeCancellationPillEnabled: stores.layoutStore.isAirportParkingFreeCancellationPillEnabled,
        getPhrase: stores.layoutStore.getPhrase,
        currency: stores.marketStore.currency,
        formatMoney: stores.marketStore.formatMoney,
        validateParking: stores.airportParkingStore.validateParking,
        toggleIsParkingDetailsPopupOpened: stores.airportParkingStore.toggleIsParkingDetailsPopupOpened,
        setSelectedAirportParkingDetails: stores.airportParkingStore.setSelectedAirportParkingDetails,
        isParkingDetailsViewPageEnabled: stores.layoutStore.isParkingDetailsViewPageEnabled,
    }));

    const {
        brandImage,
        title,
        description,
        transferTip,
        isMeetAndGreet,
        isParkAndRide,
        isParkAndStroll,
        bookingDetails: { totalPrice },
    } = airportParking;

    const formattedPrice = formatMoney(totalPrice, {
        trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
        currency,
    });

    const onSuccessAction = async (): Promise<void> => {
        await tracking.trackExtrasPageLoadAfterSelectingParking();
        tracking.trackAirportParkingUpdatedInExtrasPage();
    };

    const handleParkingDetails = async (): Promise<void> => {
        setSelectedAirportParkingDetails(airportParking);
        toggleIsParkingDetailsPopupOpened();
    };

    const handleSelectParking = async (): Promise<void> => {
        tracking.trackBookParkingCtaClick(airportParking);
        await validateParking(airportParking, onSuccessAction);
    };

    const freeCancellationTitle = getPhrase(SitecoreDictionary.GlobalsLabelsFreeCancellation);
    interface ITypeMapping {
        svg: JSX.Element;
        tid: string;
        title: string;
    }
    const typeMapping: Record<string, ITypeMapping> = {
        meetAndGreet: {
            title: getPhrase(SitecoreDictionary.GlobalsLabelsMeetAndGreet),
            svg: <SvgParkingCardTypeMeetAndGreat />,
            tid: 'meet-and-greet-pill',
        },
        parkAndRide: {
            title: getPhrase(SitecoreDictionary.GlobalsLabelsParkAndRide),
            svg: <SvgParkingCardTypeParkAndRide />,
            tid: 'park-and-ride-pill',
        },
        parkAndStroll: {
            title: getPhrase(SitecoreDictionary.GlobalsLabelsParkAndStroll),
            svg: <SvgParkingCardTypeParkAndStroll />,
            tid: 'park-and-stroll-pill',
        },
    };

    const renderParkingPills = (): JSX.Element | null => {
        let typeKey: string | null = null;

        if (isMeetAndGreet) {
            typeKey = 'meetAndGreet';
        } else if (isParkAndRide) {
            typeKey = 'parkAndRide';
        } else if (isParkAndStroll) {
            typeKey = 'parkAndStroll';
        }

        if (!typeKey) return null;

        const { title, svg, tid } = typeMapping[typeKey];

        return (
            <AirportParkingCardPill
                icon={svg}
                pillType={PillType.ParkingType}
                additionalClass={styles.grayBackground}
                title={title}
                data-tid={tid}
            />
        );
    };

    return (
        <div data-tid='parking-card' className={styles.container}>
            {/* Change style: backgroundImage to next js Image component when img.youtube.com will be added to whitelistening */}
            {brandImage ? (
                <div
                    className={styles.image}
                    style={{ backgroundImage: `url('${brandImage}')` }}
                    data-tid='image-box'
                />
            ) : (
                <div className={styles.noImageBox} data-tid='no-image-box' />
            )}
            <div className={styles.content}>
                <div>
                    <h3 data-tid='parking-card-title' className={getCustomisableTitleClassName(styles.title, params)}>
                        {title}
                    </h3>
                    <div className={styles.pillContainer}>
                        {isAirportParkingFreeCancellationPillEnabled && (
                            <AirportParkingCardPill
                                title={freeCancellationTitle}
                                pillType={PillType.FreeCancellation}
                                additionalClass={styles.greenBackground}
                                data-tid='free-cancellation-pill'
                            />
                        )}
                        {renderParkingPills()}
                    </div>
                </div>
                <div>
                    <div className={styles.text}>
                        <span>{description}</span>
                        <p>
                            {!isMeetAndGreet && (
                                <Text
                                    field={ParkingCardTransfersText}
                                    tag='span'
                                    className={styles.transferTip}
                                    data-tid='transfers-text'
                                />
                            )}{' '}
                            {transferTip}
                        </p>
                    </div>
                    <div>
                        {isParkingDetailsViewPageEnabled && (
                            <Button
                                className={`${styles.button} ${styles.moreInfoButton}`}
                                onClick={handleParkingDetails}
                                isOutlined={true}
                                data-tid='parking-card-more-info-btn'
                                aria-label={ParkingListMoreInfoButtonText.value}
                            >
                                <Text field={ParkingListMoreInfoButtonText} />
                            </Button>
                        )}
                        <Button
                            className={styles.button}
                            onClick={handleSelectParking}
                            data-tid='parking-card-book-now-btn'
                        >
                            {Tokenizer.replaceToken(
                                getPhrase(SitecoreDictionary.GlobalsButtonsBookFor),
                                Tokens.Price,
                                formattedPrice,
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ParkingCard;
