import { cmsUrls } from 'code/endpoints';
import useDataUrl from 'frontend/hooks/useDataUrl';
import { IBoardType } from 'models/data/IHotel';
import ImageWithFilter, { SVGFilterMatrix } from 'frontend/components/common/ImageWithFilter/ImageWithFilter';
import SvgFullBoard from 'frontend/components/icons-new/FullBoard';

interface IRoomTypeProps {
    board: IBoardType;
    isPrintPreview?: boolean;
}

const BoardType = ({ board, isPrintPreview }: IRoomTypeProps) => {
    const imageUrl = cmsUrls.media(board?.iconUrl);
    const printableImageUrl = useDataUrl(imageUrl);

    if (!board) {
        return null;
    }

    return (
        <div className='holiday-summary-item__details' data-tid='board-type'>
            <div className='holiday-summary-item__icon'>
                {board.iconUrl ? (
                    <ImageWithFilter
                        imageSrc={isPrintPreview ? printableImageUrl : imageUrl}
                        filterMatrix={SVGFilterMatrix.Orange}
                        isPrintPreview={isPrintPreview}
                    />
                ) : (
                    <SvgFullBoard />
                )}
            </div>
            <h4 className='holiday-summary-item__subtitle'>{board.title || ''}</h4>
            <div
                className='holiday-summary-item__text'
                dangerouslySetInnerHTML={{
                    __html: board.content,
                }}
            />
        </div>
    );
};

export default BoardType;
