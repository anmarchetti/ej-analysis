import React from 'react';
import { ResponsiveType } from 'react-multi-carousel';
import classNames from 'classnames';
import { inject } from 'mobx-react';

import { TStores } from 'frontend/store/IStores';
import { CAROUSEL_DESKTOP_MAX_BREAKPOINT } from 'frontend/utils/getSlidersToShow';
import { IFeaturedFacility } from 'models/data/IFeaturedFacility';
import { IOfferWithoutAltBoards } from 'models/data/IOffer';
import { PromoBlocksMaxItems } from 'models/enum/PromoBlocksThemes';
import CarouselWrapper from 'frontend/components/common/CarouselWrapper/CarouselWrapper';
import SliderButtonsGroup from 'frontend/components/common/SliderButtonsGroup';

import FeaturedFacilitiesItem from './FeaturedFacilitiesItem';
import FeaturedFacilitiesTitle from './FeaturedFacilitiesTitle';

interface IFeaturedFacilitiesBookingProps {
    featuredFacilities: Nullable<IFeaturedFacility[]>;
    isScreenExtraSmall: boolean;
    loadFeaturedFacilities: () => void;
    selectedOffer: Nullable<IOfferWithoutAltBoards>;
}

class FeaturedFacilitiesBooking extends React.Component<IFeaturedFacilitiesBookingProps> {
    Carousel;

    /** Get items that have at least one filled field */
    get items() {
        return (this.props.featuredFacilities || []).filter(f => f.description || f.title || f.image);
    }

    private maxItem = (responsive: ResponsiveType, max: number): number =>
        this.props.isScreenExtraSmall ? responsive.mobile.items : max;

    containerClass(max: number) {
        return classNames('promo-blocks-slider', this.items.length > max ? 'show' : 'mobile-show');
    }

    blockConfig = () => {
        const responsive: ResponsiveType = {
            desktop: { breakpoint: { max: CAROUSEL_DESKTOP_MAX_BREAKPOINT, min: 1024 }, items: 3 },
            tablet: { breakpoint: { max: 1024, min: 768 }, items: 2 },
            mobile: { breakpoint: { max: 768, min: 0 }, items: 1 },
        };

        return {
            responsive: responsive,
            itemClass: 'promo-block-card title-under-image-block',
            maxItems: this.maxItem(responsive, PromoBlocksMaxItems.TitleUnderImage),
            containerClass: this.containerClass(PromoBlocksMaxItems.TitleUnderImage),
        };
    };

    private renderCarousel = (blocksConfig: any, items: any[], itemClassName: string) => (
        <div className={blocksConfig.containerClass} key={blocksConfig.containerClass}>
            <CarouselWrapper
                responsive={blocksConfig.responsive}
                infinite={items.length > 1}
                showDots={items.length > 1}
                containerClass='carousel-container'
                customButtonGroup={<SliderButtonsGroup />}
                arrows={false}
            >
                {items.map((item: any, i) => (
                    <div className='slide-wrapper' key={i}>
                        <FeaturedFacilitiesItem key={i + i} item={item} itemClass={itemClassName} id={i} />
                    </div>
                ))}
            </CarouselWrapper>
        </div>
    );

    componentDidMount() {
        this.props.loadFeaturedFacilities();
    }

    render() {
        if (!this.items.length) {
            return null;
        }

        const blocksConfig = this.blockConfig();
        const itemClassName = classNames(blocksConfig.itemClass, 'promo-block--featured-facilities');

        if (blocksConfig) {
            return (
                <>
                    <FeaturedFacilitiesTitle hotelName={this.props.selectedOffer?.hotel?.name || ''} />
                    {this.renderCarousel(blocksConfig, this.items, itemClassName)}
                    <div
                        className={classNames(
                            'promo-blocks big-blocks-container',
                            // For future refactoring: use shouldHidePromoBlock here from PromoBlocks.utils.ts
                            this.items.length > blocksConfig.maxItems ? 'hide' : 'hide-down-md',
                        )}
                        key='promo-blocks'
                        data-tid='promo-blocks-facilities'
                    >
                        {this.items.map((item, i) => (
                            <FeaturedFacilitiesItem key={i} item={item} itemClass={itemClassName} id={i} />
                        ))}
                    </div>
                </>
            );
        }

        return null;
    }
}

export default inject((stores: TStores) => ({
    loadFeaturedFacilities: stores.bookingStore.loadFeaturedFacilities,
    featuredFacilities: stores.bookingStore.featuredFacilities,
    selectedOffer: stores.bookingStore.selectedOffer,
    isScreenExtraSmall: stores.appStore.isScreenExtraSmall,
}))(FeaturedFacilitiesBooking);
