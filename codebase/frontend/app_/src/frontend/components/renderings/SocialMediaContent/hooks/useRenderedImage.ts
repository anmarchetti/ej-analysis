import { useState } from 'react';

import { SOURCE_ELEMENT_ID } from 'frontend/components/renderings/SocialMediaContent/components/PosterLayout/PosterLayout';
import { getImageDataUri } from 'frontend/components/renderings/SocialMediaContent/utils/rendering.utils';

enum ImageLabelsState {
    Clean,
    WithEjLogo,
    WithUMLogo,
    WithPrice,
    WithEjLogoAndPrice,
    WithUMLogoAndPrice,
}

type TImageState = {
    hasEjLogo: boolean;
    hasPriceLabel: boolean;
    hasUMLogo: boolean;
};

/**
 * Render new image if it has never been rendered
 */
export const useRenderedImage = (
    hasEjLogo: boolean,
    hasUMLogo: boolean,
    hasPriceLabel: boolean,
): [Nullable<string>, (props: TImageState) => Promise<void>] => {
    const [flagsState, setFlagsState] = useState({ hasEjLogo, hasUMLogo, hasPriceLabel });
    const [prevSrc, setPrevSrc] = useState(null);
    const [srcSet, setSrcSet] = useState({
        [ImageLabelsState.Clean]: null,
        [ImageLabelsState.WithEjLogo]: null,
        [ImageLabelsState.WithUMLogo]: null,
        [ImageLabelsState.WithPrice]: null,
        [ImageLabelsState.WithEjLogoAndPrice]: null,
        [ImageLabelsState.WithUMLogoAndPrice]: null,
    });

    const renderImage = async (state: TImageState) => {
        setPrevSrc(srcSet[getCurrentState(flagsState)]);
        setFlagsState(state);

        if (srcSet[getCurrentState(state)]) {
            return;
        }

        const src = await getImageDataUri(SOURCE_ELEMENT_ID);

        setSrcSet(srcSet => ({ ...srcSet, [getCurrentState(state)]: src }));
    };

    return [srcSet[getCurrentState(flagsState)] || prevSrc, renderImage];
};

const getCurrentState = ({ hasEjLogo, hasUMLogo, hasPriceLabel }: TImageState) =>
    getImageStateByFlags(hasEjLogo, hasUMLogo, hasPriceLabel);

const getImageStateByFlags = (hasEjLogo: boolean, hasUMLogo: boolean, hasPriceLabel: boolean): ImageLabelsState => {
    if (hasEjLogo && hasPriceLabel) {
        return ImageLabelsState.WithEjLogoAndPrice;
    }

    if (hasUMLogo && hasPriceLabel) {
        return ImageLabelsState.WithUMLogoAndPrice;
    }

    if (hasEjLogo) {
        return ImageLabelsState.WithEjLogo;
    }

    if (hasUMLogo) {
        return ImageLabelsState.WithUMLogo;
    }

    if (hasPriceLabel) {
        return ImageLabelsState.WithPrice;
    }

    return ImageLabelsState.Clean;
};
