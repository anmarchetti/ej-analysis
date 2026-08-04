import * as React from 'react';
import { inject } from 'mobx-react';

import { MarketStore } from 'frontend/store/base';
import { TStores } from 'frontend/store/IStores';
import { distanceInfo, distanceTextFromSitecore } from 'frontend/utils/getHotelLocation';
import { isDefined } from 'frontend/utils/object.utils';
import { IBoardType, IClosestFacility, IRoomType, ITheme, IThemeType } from 'models/data/IHotel';
import { IComponentWithDictionary } from 'models/sitecore/generic/IComponentWithDictionary';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import HolidayTheme from 'frontend/components/common/HolidayTheme';
import SVGHotelBedFilled from 'frontend/components/icons-new/HotelBedFilled';
import SVGLocationPinFilled from 'frontend/components/icons-new/LocationPinFilled';
import BoardTypeIcon from 'frontend/components/renderings/BoardTypes/components/BoardTypeIcon/BoardTypeIcon';

export interface IOfferKeySellingPointsProps extends IComponentWithDictionary {
    boardTypes: Nullable<IBoardType>;
    closestFacility: Nullable<IClosestFacility>;
    getFormattedNumber: MarketStore['getFormattedNumber'];
    layout: any;
    roomTypes: Nullable<IRoomType>;
    foodAndAccommodationOnly?: boolean;
    handleCalloutHoverState?: (isHovered: boolean) => void;
    holidayTheme?: Nullable<ITheme>;
    holidayType?: Nullable<IThemeType>;
    isParentOffer?: boolean;
    isRecommendedOffer?: boolean;
}

export class OfferKeySellingPoints extends React.Component<IOfferKeySellingPointsProps> {
    private get distanceText(): string {
        const { closestFacility, getPhrase, layout, holidayTheme, getFormattedNumber } = this.props;
        const distanceTextFromSiteCore = distanceTextFromSitecore(closestFacility, getPhrase, holidayTheme);

        return distanceInfo(
            closestFacility,
            distanceTextFromSiteCore,
            layout.sitecore.context.pageEditing,
            getFormattedNumber,
        );
    }

    get isShowHolidayType() {
        return !this.props.isRecommendedOffer && !!this.props.holidayType?.name;
    }

    get isShowClosestFacility() {
        return (
            !this.props.isRecommendedOffer &&
            !!(
                !this.props.foodAndAccommodationOnly &&
                isDefined(this.props.closestFacility?.distance) &&
                this.distanceText
            )
        );
    }

    get isShowRoomTypes() {
        if (this.props.isParentOffer && (this.isShowHolidayType || this.isShowClosestFacility)) {
            return false;
        }

        return !!(this.props.roomTypes?.title || this.props.roomTypes?.name);
    }

    get isShowBoardTypes() {
        if (this.props.isParentOffer && this.isShowHolidayType && this.isShowClosestFacility) {
            return false;
        }

        return !!(this.props.boardTypes?.title || this.props.boardTypes?.name);
    }

    render() {
        const { boardTypes, roomTypes, holidayType, holidayTheme } = this.props;
        const distanceText = this.distanceText;

        const getSafeText = (val: string | ISitecoreField<string> | undefined | null) => {
            if (!val) return null;

            return typeof val === 'object' ? val.value : val;
        };

        const roomText = getSafeText(roomTypes?.title) || getSafeText(roomTypes?.name);
        const boardText = getSafeText(boardTypes?.title) || getSafeText(boardTypes?.name);

        return (
            <div className='hotel-card-options'>
                <ul className='list list--icon'>
                    {this.isShowHolidayType && (
                        <HolidayTheme
                            holidayType={holidayType!}
                            holidayTheme={holidayTheme}
                            withIcon
                            handleCalloutHoverState={this.props.handleCalloutHoverState}
                        />
                    )}

                    {this.isShowClosestFacility && (
                        <li className='list-item--icon' data-tid='distance'>
                            <SVGLocationPinFilled />
                            <span>{distanceText}</span>
                        </li>
                    )}

                    {this.isShowRoomTypes && (
                        <li className='list-item--icon' data-tid='room-type'>
                            <SVGHotelBedFilled />
                            <span>{roomText}</span>
                        </li>
                    )}

                    {this.isShowBoardTypes && (
                        <li className='list-item--icon' data-tid='board-type'>
                            <BoardTypeIcon iconUrl={boardTypes?.iconUrl} />
                            <span>{boardText}</span>
                        </li>
                    )}
                </ul>
            </div>
        );
    }
}

export default inject((stores: TStores) => ({
    getPhrase: stores.layoutStore.getPhrase,
    layout: stores.layoutStore.layout,
    getFormattedNumber: stores.marketStore.getFormattedNumber,
}))(OfferKeySellingPoints);
