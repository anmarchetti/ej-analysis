import * as React from 'react';
import ImageGallery from 'react-image-gallery';
import { action, computed, makeObservable, observable } from 'mobx';
import { inject, observer } from 'mobx-react';

import { TStores } from 'frontend/store/IStores';
import isBackend from 'frontend/utils/isBackend';
import { getTextFromHtml } from 'frontend/utils/string.utils';
import { IHeroBannerItem } from 'models/data/IHeroBannerFields';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { withRerender } from 'frontend/components/hoc';
import { IComponentWithRerenderProps } from 'frontend/components/hoc/withRerender';
import CountdownBanner from 'frontend/components/renderings/CountdownBanner/CountdownBanner';
import HeroBanner from 'frontend/components/renderings/GenericHeroBanner/GenericHeroBanner';

interface IHeroCarouselParams {
    Duration: number;
}

interface IHeroCarouselFields {
    items: IHeroBannerItem[];
}

export interface IHeroCarouselProps
    extends ISitecoreComponent<IHeroCarouselFields, IHeroCarouselParams>,
        IComponentWithRerenderProps {
    isEditMode: boolean;
    isScreenMedium: boolean;
    trackHeroBannerImpression: (uniqueId: string, title: string, subtitle: string, position: number) => void;
    isBannerLower?: boolean;
}

export class HeroCarousel extends React.Component<IHeroCarouselProps> {
    constructor(props: IHeroCarouselProps) {
        super(props);
        makeObservable(this);
    }

    @observable isShowCountdownBanner: boolean = true;
    private ref = React.createRef<any>();

    componentDidMount(): void {
        // Use timeout for correct height calculating
        setTimeout(() => {
            this.resetSlideHeight();
        }, 1000);

        this.trackComponent();
    }

    trackComponent(): void {
        const { fields, rendering, trackHeroBannerImpression } = this.props;

        if (!fields?.items?.length || !this.props.wasRerendered) return;

        fields.items.forEach((item: IHeroBannerItem, key) => {
            const { Title, Subtitle } = item.fields || {};

            trackHeroBannerImpression(
                rendering?.uid,
                getTextFromHtml(Title?.value),
                getTextFromHtml(Subtitle?.value),
                key + 1,
            );
        });
    }

    @action toggleShowCountdownBanner = (state: boolean): void => {
        this.isShowCountdownBanner = state;
    };

    resetSlideHeight(): void {
        if (!this.ref.current?._imageGallerySlideWrapper) {
            return;
        }

        const slides = [...this.ref.current._imageGallerySlideWrapper.getElementsByClassName('hero-banner')];
        const slideHeight =
            !this.props.isScreenMedium && !isBackend() ? Math.max(...slides.map(item => item.offsetHeight)) : null;

        slides.forEach(slide => (slide.style.height = slideHeight ? `${slideHeight}px` : ''));
    }

    componentDidUpdate(prevProps): void {
        if (prevProps.isScreenMedium !== this.props.isScreenMedium) {
            this.resetSlideHeight();
        }
    }

    get speed(): number {
        return this.props.params?.Duration || 2000;
    }

    @computed get itemsToShow(): IHeroBannerItem[] {
        return (this.props.fields?.items || []).filter(item => {
            if (
                'CountdownVariant' in item.fields &&
                !!item?.fields?.HideAfterTimeElapsed?.value &&
                !this.isShowCountdownBanner
            ) {
                return false;
            }

            return true;
        });
    }

    render() {
        const { fields, rendering, isBannerLower = false } = this.props;

        if (!fields?.items?.length) {
            return null;
        }

        return (
            <div className='hero-carousel' id='hero-carousel'>
                <ImageGallery
                    items={this.itemsToShow}
                    showThumbnails={false}
                    renderItem={(item: IHeroBannerItem) => {
                        if ('CountdownVariant' in item.fields) {
                            return (
                                <CountdownBanner
                                    fields={{ ...item.fields }}
                                    params={{}}
                                    rendering={rendering}
                                    toggleShowCountdownBanner={this.toggleShowCountdownBanner}
                                    isLower={isBannerLower}
                                    singleSlide={this.itemsToShow.length === 1}
                                />
                            );
                        }

                        return (
                            <HeroBanner
                                fields={{ ...item.fields }}
                                params={{}}
                                rendering={rendering}
                                isLower={isBannerLower}
                                singleSlide={this.itemsToShow.length === 1}
                            />
                        );
                    }}
                    showFullscreenButton={false}
                    // Turn off autoPlay in Experience Editor, as it causes issues (EJH-15975)
                    autoPlay={!this.props.isEditMode}
                    slideInterval={+this.speed}
                    showBullets={this.itemsToShow.length > 1}
                    showNav={false}
                    ref={this.ref}
                    onSlide={() => this.resetSlideHeight()}
                />
            </div>
        );
    }
}

export default inject((stores: TStores) => ({
    isScreenMedium: stores.appStore.isScreenMedium,
    isEditMode: stores.layoutStore.isEditMode,
    trackHeroBannerImpression: stores.trackingStore.trackHeroBannerImpression,
}))(observer(withRerender(HeroCarousel)));
