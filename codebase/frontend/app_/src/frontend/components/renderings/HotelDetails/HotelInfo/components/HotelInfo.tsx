import { Component } from 'react';
import { Placeholder, Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { action, computed, makeObservable, observable } from 'mobx';
import { inject, observer } from 'mobx-react';

import { TStores } from 'frontend/store/IStores';
import { IFacilityGroup } from 'models/data/IHotel';
import { IOfferWithoutAltBoards } from 'models/data/IOffer';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { IComponentWithDictionary } from 'models/sitecore/generic/IComponentWithDictionary';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import ReadMoreButton from 'frontend/components/common/ReadMoreButton';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import HolidayTypeBanner from 'frontend/components/renderings/HotelDetails/components/HolidayTypeBanner';
import Facilities from 'frontend/components/renderings/HotelDetails/HotelFacilities/components/Facilities';
import FeaturedFacilitiesBooking from 'frontend/components/renderings/HotelDetails/HotelFacilities/components/FeaturedFacilities/FeaturedFacilitiesBooking';

import HotelInfoShimmer from './HotelInfoShimmer';

const MAX_DESCRIPTION_LENGTH = 3;

export interface IHotelInfoProps extends IComponentWithDictionary {
    anchor: string;
    isExtrasPage: boolean;
    isHotelDetailsBrowsePage: boolean;
    isLoading: boolean;
    isLoadingOffer: boolean;
    isShowEcoFacilityPlaceholder: boolean;
    offer: Nullable<IOfferWithoutAltBoards>;
    rendering?: any;
}

export class HotelInfo extends Component<IHotelInfoProps> {
    constructor(props: IHotelInfoProps) {
        super(props);
        makeObservable(this);
    }

    @observable isReadLess: boolean = !!this.props.isExtrasPage;
    @observable descriptionText: string = '';
    @observable moreDescriptionText: string = '';

    componentWillUnmount(): void {
        this.isReadLess = !!this.props.isExtrasPage;
        this.descriptionText = '';
        this.moreDescriptionText = '';
    }

    @computed get facilityGroups(): IFacilityGroup[] {
        return this.props.offer?.hotel?.facilities || [];
    }

    @action buttonClick = (): void => {
        this.isReadLess = !this.isReadLess;
    };

    @action getParseDescription = (description: string): void => {
        const fullDescriptionArray = description ? description.split(/<\s*p[^>]*>/) : [];

        if (fullDescriptionArray.length > MAX_DESCRIPTION_LENGTH) {
            const moreDescriptionArray = fullDescriptionArray.splice(MAX_DESCRIPTION_LENGTH);
            this.descriptionText = '<p>' + fullDescriptionArray[1] + '<p>' + fullDescriptionArray[2];
            this.moreDescriptionText = '<p>' + moreDescriptionArray.join('<p>');
        } else {
            this.descriptionText = description;
            this.moreDescriptionText = ''; // Reset when description is short (no "read more" needed)
        }
    };

    render(): JSX.Element | null {
        const { offer, isLoading, isLoadingOffer } = this.props;

        if (!offer?.hotel) {
            return isLoading || isLoadingOffer ? <HotelInfoShimmer isExtrasPage={this.props.isExtrasPage} /> : null;
        }

        this.getParseDescription(
            typeof offer.hotel.description === 'string'
                ? offer.hotel.description
                : (offer.hotel.description as ISitecoreField<string>)?.value || '',
        );

        return (
            <div id={this.props.anchor}>
                <section className='hotel-description mb-4'>
                    {!!offer.hotel.strapline && (
                        <h2 className='mb-2 page-title page-title--thin' data-tid='hotel-strapline'>
                            {typeof offer.hotel.strapline === 'string' ? (
                                offer.hotel.strapline
                            ) : (
                                <Text field={offer.hotel.strapline} />
                            )}
                        </h2>
                    )}

                    {typeof offer.hotel.description === 'string' ? (
                        //applicable for HotelDetailsBookingPage (description comes from BE response)
                        <div dangerouslySetInnerHTML={{ __html: this.descriptionText }} />
                    ) : (
                        //applicable for HotelDetailsBrowsePage (description comes from Sitecore directly)
                        <RichTextWithLinks field={{ value: this.descriptionText }} />
                    )}

                    {!!this.moreDescriptionText && (
                        <div className='read-more-box' data-tid='read-more-box'>
                            <div
                                hidden={!this.isReadLess}
                                className='read-more-box__text my-3'
                                data-tid='more-description-text'
                                dangerouslySetInnerHTML={{ __html: this.moreDescriptionText }}
                            />

                            <ReadMoreButton
                                onClick={this.buttonClick}
                                isReadLess={this.isReadLess}
                                readLessText={this.props.getPhrase(SitecoreDictionary.GlobalsButtonsReadLess)}
                                readMoreText={this.props.getPhrase(SitecoreDictionary.GlobalsButtonsReadMore)}
                                dataTid='read-more-button'
                            />
                        </div>
                    )}
                </section>

                <Placeholder name={PlaceholderNames.TilesCarousel} rendering={this.props.rendering} />

                {!this.props.isExtrasPage && offer.hotel.hotelType && (
                    // Default types don't have code
                    <HolidayTypeBanner type={offer.hotel.hotelType} />
                )}
                {!this.props.isExtrasPage && ( // hide facilities in PDF export preview on Extras
                    <section className='hotel-facilities'>
                        {this.props.isHotelDetailsBrowsePage ? (
                            <Placeholder
                                name={PlaceholderNames.Main}
                                rendering={this.props.rendering}
                                isShowEcoFacilityPlaceholder={
                                    !!(
                                        this.props.rendering.fields?.EcoFacility?.Name &&
                                        this.props.rendering.fields?.EcoFacility?.Tooltip
                                    )
                                }
                            />
                        ) : (
                            <>
                                <FeaturedFacilitiesBooking />
                                <Facilities
                                    facilityGroups={this.facilityGroups}
                                    rendering={this.props.rendering}
                                    isShowEcoFacilityPlaceholder={
                                        !!(offer.hotel.ecoFacility?.name && offer.hotel.ecoFacility?.tooltip)
                                    }
                                />
                            </>
                        )}
                    </section>
                )}
            </div>
        );
    }
}

export default inject((stores: TStores) => ({
    getPhrase: stores.layoutStore.getPhrase,
    isExtrasPage: stores.layoutStore.isExtrasPage,
    isHotelDetailsBrowsePage: stores.layoutStore.isHotelDetailsBrowsePage,
    isLoading: stores.appStore.isLoading,
    isLoadingOffer: stores.bookingStore.isLoadingOffer,
}))(observer(class WrappedHotelInfo extends HotelInfo {}));
