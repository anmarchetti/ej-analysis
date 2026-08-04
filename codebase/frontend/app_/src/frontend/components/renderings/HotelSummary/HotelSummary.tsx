import { FC, useContext, useState } from 'react';
import { observer } from 'mobx-react';

import { BookingContext } from 'frontend/context/BookingContext';
import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { containsLuxuryPromoCode } from 'frontend/utils/offer.utils';
import { isSitecoreCheckboxSelected } from 'frontend/utils/sitecore.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import { TSitecoreCheckboxValue } from 'models/sitecore/generic/SitecoreCheckboxValue';
import { ICabinBagsInfoFields } from 'frontend/components/common/Booking/CabinBagsInfo/CabinBagsInfo';
import { IFastTrackInfoFields } from 'frontend/components/common/Booking/FastTrackInfo/FastTrackInfo';
import { ILuggageInfoFields } from 'frontend/components/common/Booking/LuggageInfo/LuggageInfo';
import Button from 'frontend/components/common/Button';
import Drawer from 'frontend/components/common/Drawer';
import { IAirportParkingInfoFields } from 'frontend/components/common/HolidaySummaryAirportParking/HolidaySummaryAirportParking';
import LuxuryWrapper from 'frontend/components/common/LuxuryWrapper/LuxuryWrapper';
import { Popup } from 'frontend/components/common/Popup';

import HotelSummaryDetails from './components/HotelSummaryDetails/HotelSummaryDetails';
import HotelSummaryPreview from './components/HotelSummaryPreview/HotelSummaryPreview';

import styles from './HotelSummary.module.scss';

interface IHotelSummaryParameters {
    IsOpeningPopupLinkVisible: TSitecoreCheckboxValue;
    ShowButtonOnly: TSitecoreCheckboxValue;
}

type THotelSummaryFields = {
    AltTitle: ISitecoreField<string>;
    ButtonCloseLabel: ISitecoreField<string>;
    ButtonRebookLabel: ISitecoreField<string>;
    PriceTitle: ISitecoreField<string>;
    Title: ISitecoreField<string>;
    ViewSummaryLabel: ISitecoreField<string>;
} & ILuggageInfoFields &
    ICabinBagsInfoFields &
    IFastTrackInfoFields &
    IAirportParkingInfoFields;

export type THotelSummaryProps = ISitecoreComponent<THotelSummaryFields, IHotelSummaryParameters>;

const HotelSummary: FC<THotelSummaryProps> = ({ fields, params }) => {
    const { getPhrase } = useStore((stores: IHolidaysStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const [isDetailsShown, toggleShowDetails] = useState(false);
    const { booking } = useContext(BookingContext);

    const isMobile = useMobileViewport();

    if (!booking || !fields) {
        return null;
    }

    const { IsOpeningPopupLinkVisible } = params;
    const {
        Title,
        ViewSummaryLabel,
        PriceTitle,
        ButtonCloseLabel,
        IncludedBagsLabel,
        IncludedIcon,
        IncludedWithInfantLabel,
        OverheadAddedIcon,
        OverheadBagAddedLabel,
        LuggageInfoTitle,
        PramName,
        SportEquipmentsLabel,
        AltTitle,
        FastTrackLabel,
        FastTrackLogo,
        AirportParkingTitle,
        AirportParkingInstructions,
        SpeedyBoardingTooltip,
    } = fields;

    const cabinBagsInfoFields = {
        IncludedBagsLabel,
        IncludedIcon,
        IncludedWithInfantLabel,
        OverheadAddedIcon,
        OverheadBagAddedLabel,
        SpeedyBoardingTooltip,
    };

    const luggageInfoFields = {
        LuggageInfoTitle,
        PramName,
        SportEquipmentsLabel,
    };

    const fastTrackInfoFields = {
        FastTrackLabel,
        FastTrackLogo,
    };

    const airportParkingInfoFields = {
        AirportParkingTitle,
        AirportParkingInstructions,
    };

    const { seatSelection = [] } = booking;

    const isLuxuryPackage = containsLuxuryPromoCode(booking?.promoCollections);

    const luxWrapper = isLuxuryPackage
        ? (content: React.ReactNode): JSX.Element => (
              <LuxuryWrapper label={getPhrase(SitecoreDictionary.GlobalsLabelsLuxuryCollection)}>
                  {content}
              </LuxuryWrapper>
          )
        : (content: React.ReactNode): JSX.Element => <>{content}</>;

    const summaryDetailsTitle = isLuxuryPackage ? AltTitle?.value : Title?.value;

    const renderHolidayDetails = (isTitleIconShown?: boolean): JSX.Element => (
        <HotelSummaryDetails
            title={summaryDetailsTitle}
            priceTitle={PriceTitle.value}
            booking={booking}
            luggageInfoFields={luggageInfoFields}
            cabinBagsInfoFields={cabinBagsInfoFields}
            fastTrackInfoFields={fastTrackInfoFields}
            airportParkingInfoFields={airportParkingInfoFields}
            isTitleIconShown={isTitleIconShown}
            selectedSeats={seatSelection}
            isLuxuryPackage={isLuxuryPackage}
        />
    );

    return (
        <>
            {isSitecoreCheckboxSelected(params.ShowButtonOnly) ? (
                <Button isPrimary onClick={(): void => toggleShowDetails(true)} data-tid='view-summary-btn'>
                    {ViewSummaryLabel?.value}
                </Button>
            ) : (
                <HotelSummaryPreview
                    title={Title}
                    viewSummaryLabel={ViewSummaryLabel.value}
                    toggleShowDetails={toggleShowDetails}
                    shouldShowBtn={isSitecoreCheckboxSelected(IsOpeningPopupLinkVisible)}
                />
            )}
            {isMobile && (
                <Drawer open={isDetailsShown} className='drawer--animation-bottom' dataTid='hotel-summary-drawer'>
                    {luxWrapper(<div className='drawer__content'>{renderHolidayDetails()}</div>)}
                    <div className='drawer__actions'>
                        <Button
                            isTransparent
                            isFullWidth
                            onClick={(): void => toggleShowDetails(false)}
                            dataTid='hotel-summary-drawer-close-btn'
                        >
                            {ButtonCloseLabel.value}
                        </Button>
                    </div>
                </Drawer>
            )}
            {!isMobile && isDetailsShown && (
                <Popup
                    id='hotel-summary-popup'
                    containerClass={styles.popup}
                    showCloseButton
                    onClose={(): void => toggleShowDetails(false)}
                    wrapper={luxWrapper}
                    contentClass={styles.popupContentWithScroll}
                >
                    <div className={styles.popupContent}>{renderHolidayDetails(true)}</div>
                </Popup>
            )}
        </>
    );
};

export default observer(HotelSummary);
