import { FC } from 'react';
import { observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { Tokenizer } from 'frontend/utils/tokenizer';
import ErrorMessage from 'frontend/components/common/ErrorMessage';
import IconInfoCircle from 'frontend/components/icons/InfoCircle';
import { IHotelPosterProps } from 'frontend/components/renderings/HotelPoster/HotelPoster';

import HotelDetailsLayout from './HotelDetailsLayout';

export const HotelPosterContent: FC<IHotelPosterProps> = ({
    fields,
    posterId,
    hasEjLogo,
    hasUMLogo,
    logoImage,
    UMLogoImage,
    posterFields,
}) => {
    const { totalPricePPWithTouristTax } = useStore(stores => ({
        totalPricePPWithTouristTax: stores.bookingStore.totalPricePPWithTouristTax,
    }));

    if (!fields) {
        return null;
    }

    const { RoundUpTitle, RoundUpDescription } = fields;
    const wholePartPP = Math.floor(totalPricePPWithTouristTax);
    const isRoundErrorMessageShown = totalPricePPWithTouristTax !== wholePartPP && RoundUpTitle && RoundUpDescription;

    return (
        <>
            {isRoundErrorMessageShown && (
                <ErrorMessage
                    message={<b>{RoundUpTitle.value}</b>}
                    description={Tokenizer.replaceToken(
                        RoundUpDescription.value,
                        Tokens.Price,
                        totalPricePPWithTouristTax.toString(),
                    )}
                    icon={<IconInfoCircle />}
                    IsNotification
                    IsDesc
                />
            )}
            <HotelDetailsLayout
                fields={fields}
                wholePartPP={wholePartPP}
                posterId={posterId}
                hasUMLogo={hasUMLogo}
                hasEjLogo={hasEjLogo}
                logoImage={logoImage}
                UMLogoImage={UMLogoImage}
                posterFields={posterFields}
            />
        </>
    );
};

export default observer(HotelPosterContent);
