import { Tokens } from 'code/tokens';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { AmendmentType } from 'models/data/IBookingInfo';
import AmendHotelPopupContent from 'frontend/components/renderings/SuccessfulAmendmentPopup/components/AmendHotelPopupContent/AmendHotelPopupContent';
import DatesPopupContent from 'frontend/components/renderings/SuccessfulAmendmentPopup/components/DatesPopupContent/DatesPopupContent';
import FlightPopupContent from 'frontend/components/renderings/SuccessfulAmendmentPopup/components/FlightPopupContent/FlightPopupContent';
import RoomAndBoardPopupContent from 'frontend/components/renderings/SuccessfulAmendmentPopup/components/RoomAndBoardPopupContent/RoomAndBoardPopupContent';
import SeatsPopupContent from 'frontend/components/renderings/SuccessfulAmendmentPopup/components/SeatsPopupContent/SeatsPopupContent';
import { ISuccessfulAmendmentPopupFields } from 'frontend/components/renderings/SuccessfulAmendmentPopup/SuccessfulAmendmentPopup';

export const getPopupSubtitle = (
    fields: ISuccessfulAmendmentPopupFields,
    transferName: string,
    amendmentStatus: AmendmentType,
) => {
    const subtitle = fields[amendmentStatus + 'Subtitle'];

    if (!subtitle?.value) {
        return null;
    }

    if (amendmentStatus === AmendmentType.Transfer) {
        subtitle.value = Tokenizer.replaceToken(
            subtitle.value,
            Tokens.Name,
            `<strong>'${transferName || ''}'</strong>`,
        );
    }

    return subtitle;
};

const PopupContent = {
    [AmendmentType.Flight]: <FlightPopupContent />,
    [AmendmentType.Dates]: <DatesPopupContent />,
    [AmendmentType.Seats]: <SeatsPopupContent />,
    [AmendmentType.RoomAndBoard]: <RoomAndBoardPopupContent />,
    [AmendmentType.Hotel]: <AmendHotelPopupContent />,
};

export const getPopupContent = (amendmentType: AmendmentType) => PopupContent[amendmentType] || null;
