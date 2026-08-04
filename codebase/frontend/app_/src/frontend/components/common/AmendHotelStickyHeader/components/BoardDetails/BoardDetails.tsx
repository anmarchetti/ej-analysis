import { FunctionComponent } from 'react';

import { IBoardType } from 'models/data/IHotel';
import BoardTypeIcon from 'frontend/components/renderings/BoardTypes/components/BoardTypeIcon/BoardTypeIcon';

interface IBoardDetailsProps {
    boardType: IBoardType;
    className?: string;
    dataTid?: string;
}

const BoardDetails: FunctionComponent<IBoardDetailsProps> = ({ className, dataTid = 'board-details', boardType }) => (
    <div className={className} data-tid={dataTid}>
        <BoardTypeIcon iconUrl={boardType.iconUrl} data-tid={`${dataTid}-icon`} />
        <span data-tid={`${dataTid}-title`}>{boardType.title}</span>
    </div>
);

export default BoardDetails;
