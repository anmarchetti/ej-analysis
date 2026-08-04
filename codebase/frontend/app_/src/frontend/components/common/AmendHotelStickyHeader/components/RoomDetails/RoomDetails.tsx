import { FunctionComponent } from 'react';

import { IRoomType } from 'models/data/IHotel';
import SVGHotelBedFilled from 'frontend/components/icons-new/HotelBedFilled';

interface IRoomDetailsProps {
    roomType: IRoomType;
    className?: string;
    dataTid?: string;
}

const RoomDetails: FunctionComponent<IRoomDetailsProps> = ({ className, dataTid = 'room-details', roomType }) => {
    const titleText = typeof roomType.title === 'object' ? roomType.title?.value : roomType.title;

    return (
        <div className={className} data-tid={dataTid}>
            <SVGHotelBedFilled data-tid={`${dataTid}-icon`} />
            <span data-tid={`${dataTid}-title`}>{titleText}</span>
        </div>
    );
};

export default RoomDetails;
