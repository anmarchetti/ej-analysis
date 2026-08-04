import { FC } from 'react';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { Tokenizer } from 'frontend/utils/tokenizer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

interface IFeaturedFacilitiesTitle {
    hotelName: string;
}

const FeaturedFacilitiesTitle: FC<IFeaturedFacilitiesTitle> = ({ hotelName }) => {
    const { getPhrase } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const title = Tokenizer.replaceToken(
        getPhrase(SitecoreDictionary.HotelInfoLabelsFeaturedFacilitiesTitle),
        Tokens.Name,
        hotelName,
    );

    return <h3 className='hotel-facilities__title'>{title}</h3>;
};

export default FeaturedFacilitiesTitle;
