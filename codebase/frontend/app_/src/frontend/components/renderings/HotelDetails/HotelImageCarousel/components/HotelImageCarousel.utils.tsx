import { CurrencyCode, ICurrencyFormatOptions } from 'code/currency';
import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { getDiscount, getDiscountPerPerson } from 'frontend/utils/discount.utils';
import { containsLuxuryPromoCode } from 'frontend/utils/offer.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { IOffer, IOfferWithoutAltBoards } from 'models/data/IOffer';
import { ISliderImage, ISliderVideo } from 'frontend/components/common/OfferCardSlider/OfferCardSlider';
import { VIDEO_THUMBNAIL_IMAGE } from 'frontend/components/common/VideoThumbnailImage/VideoThumbnailImage';

import { LUX_BLUR_IMG_ID, LUX_MAIN_IMG_ID } from './LuxuryImageCarousel';

const VIDEO_OPTIONS = ['youtube', 'cloudinary'];

const useIsLuxuryStatus = (collection?: string[]): boolean => {
    const { layout } = useStore((stores: TStores) => ({
        layout: stores.layoutStore.layout,
    }));

    const promoCollections =
        collection || layout?.sitecore?.route?.fields?.PromoCollections?.map(({ fields }) => fields?.Key?.value);

    return containsLuxuryPromoCode(promoCollections);
};

export const shouldPreventFullScreenActivation = (target: HTMLImageElement): boolean =>
    !target?.src ||
    target?.getAttribute?.('data-tid')?.includes(VIDEO_THUMBNAIL_IMAGE) ||
    VIDEO_OPTIONS.some(video => target?.src?.includes(video));

export const getDesktopLuxuryProps = ({
    videoId,
    videoPlaceholder,
    images = [],
    cookiesAccepted = false,
    mainSlideRef,
    setAutoPlay,
    onThumbnailClick,
    setIsFullScreenActive,
}: {
    mainSlideRef: React.RefObject<{ slideToIndex: (index: number) => void }>;
    onThumbnailClick: () => void;
    setAutoPlay: (value: boolean) => void;
    setIsFullScreenActive: (value: boolean) => void;
    cookiesAccepted?: boolean;
    images?: { large: string }[];
    videoId?: string;
    videoPlaceholder?: string;
}): { imageSrc: string; onExpand: () => void; onPlayVideo: (() => void) | undefined } => {
    const imageSrc = videoId && videoPlaceholder ? videoPlaceholder : images[0]?.large;

    const isVideoAvailable = cookiesAccepted && !!videoId;

    const onPlayVideo = (): void => {
        mainSlideRef.current?.slideToIndex(0);

        setAutoPlay(true);

        onThumbnailClick();
        setTimeout(() => {
            setIsFullScreenActive(true);
        });
    };

    const onExpand = (): void => {
        mainSlideRef.current?.slideToIndex(0);

        onThumbnailClick();
        setTimeout(() => {
            setIsFullScreenActive(true);
        });
    };

    return {
        imageSrc,
        onPlayVideo: isVideoAvailable ? onPlayVideo : undefined,
        onExpand,
    };
};

export const getCardDescription = ({
    isPromoBannerShown,
    offer,
    currency,
    formatMoney,
    labelBeforePrice,
    labelAfterPrice,
}: {
    currency: CurrencyCode;
    formatMoney: (amount: number, options?: ICurrencyFormatOptions) => string;
    isPromoBannerShown: boolean;
    labelAfterPrice: string;
    labelBeforePrice: string;
    offer?: Nullable<IOfferWithoutAltBoards | IOffer>;
}): string | undefined => {
    if (!isPromoBannerShown) return '';

    let description = offer?.promotion?.cardDescription;

    if (!description) return description;

    if (offer?.promotion?.discountAmountPerBooking || offer?.promotion?.percentageDiscountPerBooking) {
        description = Tokenizer.replaceToken(
            description,
            Tokens.Discount,
            getDiscount(offer?.promotion, currency, formatMoney),
        );
    }

    if (offer?.promotion?.discountAmountPerPerson || offer?.promotion?.discountPercentagePerPerson) {
        description = Tokenizer.replaceToken(
            description,
            Tokens.DiscountPerPerson,
            getDiscountPerPerson(offer.promotion, currency, formatMoney, labelBeforePrice, labelAfterPrice),
        );
    }

    return description;
};

export const changeMainImageSrcInEditMode = (
    isLuxuryDesktopEditMode: boolean,
    mainSlideRef: React.RefObject<{ getCurrentIndex: () => number }>,
    imagesWithVideo: (ISliderImage | ISliderVideo)[],
): void => {
    if (!isLuxuryDesktopEditMode) {
        return;
    }

    const currentIndex = mainSlideRef.current?.getCurrentIndex() ?? 0;
    const currentItem = imagesWithVideo[currentIndex];
    const newImageSrc =
        (currentItem as ISliderImage)?.image?.large ?? (currentItem as ISliderVideo)?.videoPlaceholder ?? '';
    document.getElementById(LUX_MAIN_IMG_ID)?.setAttribute('src', newImageSrc);
    document.getElementById(LUX_BLUR_IMG_ID)?.setAttribute('src', newImageSrc);
};

export const handleThumbnailClickInEditMode = (
    target: HTMLElement,
    mainSlideRef: React.RefObject<{ slideToIndex: (index: number) => void }>,
): void => {
    const index =
        (target.closest('a[role="button"]')?.querySelector('[data-item-index]') as HTMLElement)?.dataset.itemIndex ?? 0;

    mainSlideRef.current?.slideToIndex(+index);
};

export default useIsLuxuryStatus;
