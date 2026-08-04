import Button from 'frontend/components/common/Button';

export interface IHotelImageCarouselEditModeProps {
    amount: number;
    isLoading: boolean;
    withoutSelection?: boolean;
}

export const HotelImageCarouselEditMode: React.FC<IHotelImageCarouselEditModeProps> = ({
    isLoading,
    withoutSelection,
    amount,
}) => (
    <div className='img-carousel-manage'>
        <Button className='add-image-btn' isLoading={isLoading} dataTid='add-image'>
            Add image
        </Button>
        {withoutSelection ? (
            <button className='btn sort-images-btn' data-tid='curate-images'>
                Curate images
            </button>
        ) : (
            <>
                <button className='btn sort-images-btn'>Sort images</button>
                <div className='img-carousel-batch-manage'>
                    <span className='batch-selected-images'>Selected images: :{amount}</span>
                    <button className='btn batch-delete-images-btn' data-tid='batch-delete'>
                        Delete images
                    </button>
                </div>
            </>
        )}
    </div>
);

export default HotelImageCarouselEditMode;
