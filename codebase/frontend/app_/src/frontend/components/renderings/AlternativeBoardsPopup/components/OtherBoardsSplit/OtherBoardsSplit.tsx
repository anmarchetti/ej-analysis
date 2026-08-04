import { checkRoomsOnFreeForKids, getNewOfferUnitsByBoard } from 'frontend/utils/offer.utils';
import { IBoardType } from 'models/data/IHotel';
import { IAltBoard, IOfferWithoutAltBoards, IUnit } from 'models/data/IOffer';
import styles from 'frontend/components/renderings/AlternativeBoardsPopup/AlternativeBoardsPopup.module.scss';
import AltBoardsSection from 'frontend/components/renderings/AlternativeBoardsPopup/components/AltBoardsSection/AltBoardsSection';

export interface IOtherBoardsSplitProps {
    altBoards: IAltBoard[];
    altRooms: IUnit[][];
    confirmedBoard: IBoardType;
    onSelect: (board: IBoardType) => void;
    selectedOffer: Nullable<IOfferWithoutAltBoards>;
    withFreeChildLabel: string;
    withoutFreeChildLabel: string;
}

function OtherBoardsSplit({
    selectedOffer,
    altBoards,
    altRooms,
    confirmedBoard,
    withFreeChildLabel,
    withoutFreeChildLabel,
    onSelect,
}: IOtherBoardsSplitProps) {
    if (!selectedOffer) {
        return null;
    }

    const altBoardsWithFreeChild: IAltBoard[] = [];
    const altBoardsWithoutFreeChild: IAltBoard[] = [];

    altBoards.forEach(board => {
        if (checkRoomsOnFreeForKids(getNewOfferUnitsByBoard(selectedOffer.accom.unit, board, altRooms[0]))) {
            altBoardsWithFreeChild.push(board);

            return;
        }

        altBoardsWithoutFreeChild.push(board);
    });

    return (
        <div className={styles.options} data-tid='additional-board-items-block-split'>
            <AltBoardsSection
                items={altBoardsWithFreeChild}
                label={withFreeChildLabel}
                confirmedBoard={confirmedBoard}
                selectedOffer={selectedOffer}
                onSelect={onSelect}
            />
            <AltBoardsSection
                items={altBoardsWithoutFreeChild}
                label={withoutFreeChildLabel}
                confirmedBoard={confirmedBoard}
                selectedOffer={selectedOffer}
                onSelect={onSelect}
            />
        </div>
    );
}

export default OtherBoardsSplit;
