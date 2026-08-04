import { FC } from 'react';

import { Tokens } from 'code/tokens';
import { isPricePPShown } from 'frontend/utils/offer.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { IBoardType } from 'models/data/IHotel';
import { IAltBoard, IOfferWithoutAltBoards } from 'models/data/IOffer';
import styles from 'frontend/components/renderings/AlternativeBoardsPopup/AlternativeBoardsPopup.module.scss';
import AltBoardItem from 'frontend/components/renderings/AlternativeBoardsPopup/components/AltBoardItem/AltBoardItem';

export interface IAltBoardsSectionProps {
    confirmedBoard: IBoardType;
    items: (IAltBoard | IBoardType)[];
    label: string;
    selectedOffer: Nullable<IOfferWithoutAltBoards>;
    isSelectedSection?: boolean;
    onSelect?: (board: IBoardType) => void;
}

const AltBoardsSection: FC<IAltBoardsSectionProps> = ({
    confirmedBoard,
    selectedOffer,
    items,
    label,
    isSelectedSection,
    onSelect,
}) => {
    if (!items.length) {
        return null;
    }

    return (
        <>
            <h3
                className={styles.optionsTitle}
                data-tid={isSelectedSection ? 'alt-boards-section-title' : 'alt-boards-selected-section-title'}
            >
                {Tokenizer.replaceToken(label, Tokens.Number, items.length.toString())}
            </h3>
            {items.map(board => (
                <AltBoardItem
                    key={board.code}
                    board={board}
                    isPricePPShown={isPricePPShown(selectedOffer)}
                    isSelected={board.code === confirmedBoard.code}
                    selectedBoardPricePP={confirmedBoard.pricePP ?? 0}
                    currency={selectedOffer?.currency?.code}
                    onSelect={(): void => onSelect?.(board)}
                />
            ))}
        </>
    );
};

export default AltBoardsSection;
