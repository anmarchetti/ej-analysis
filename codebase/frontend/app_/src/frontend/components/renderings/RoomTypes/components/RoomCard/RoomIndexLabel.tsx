import { FunctionComponent } from 'react';
import { observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import { useXSMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { IOfferWithoutAltBoards } from 'models/data/IOffer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SvgHotelBedFilled from 'frontend/components/icons-new/HotelBedFilled';

import styles from './RoomIndexLabel.module.scss';

interface IRoomIndexLabelProps {
    offer: Nullable<IOfferWithoutAltBoards>;
    selectedRoomSectionIndex: number;
}

export const RoomIndexLabel: FunctionComponent<IRoomIndexLabelProps> = ({ offer, selectedRoomSectionIndex }) => {
    const { getPhrase } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const isMobile = useXSMobileViewport();

    if (isMobile && offer) {
        return null;
    }

    return (
        <div className={styles.roomIndexLabel} data-tid='room-card-index'>
            <SvgHotelBedFilled className='d-block' />
            {Tokenizer.replaceToken(
                getPhrase(SitecoreDictionary.RoomTypesLabelsRoom),
                Tokens.Number,
                `${selectedRoomSectionIndex + 1}`,
            )}
        </div>
    );
};

export default observer(RoomIndexLabel);
