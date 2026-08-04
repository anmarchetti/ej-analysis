import React, { Component } from 'react';
import { arrayMove, SortableContainer, SortableElement } from 'react-sortable-hoc';

import { ImageSize } from 'models/enum/ImageSize';
import Button from 'frontend/components/common/Button';
import HotelImage from 'frontend/components/common/HotelImage/HotelImage';
import { ISliderImage } from 'frontend/components/common/OfferCardSlider/OfferCardSlider';
import { Popup } from 'frontend/components/common/Popup';

interface ISortableImageProps {
    image: ISliderImage;
}

interface ISortableImagesProps {
    items: ISliderImage[];
}

const SortableImage = SortableElement<ISortableImageProps>(({ image }) => (
    <HotelImage
        className='img-carousel-thumbnails__image sortable'
        image={image.image}
        defaultSize={ImageSize.Small}
        key={image.image.id ?? image.index}
    />
));

const SortableImages = SortableContainer<ISortableImagesProps>(({ items }) => (
    <div>
        {items.map((image, index) => (
            <SortableImage key={image.image.id ?? image.image.small} index={index} image={image} />
        ))}
    </div>
));

interface IImagesSortPopupProps {
    images: ISliderImage[];
    onClose: (images?: ISliderImage[]) => void;
}

interface IImagesSortPopupState {
    images: ISliderImage[];
    isApplying: boolean;
}

/** Show sortable images */
export class ImagesSortPopup extends Component<IImagesSortPopupProps, IImagesSortPopupState> {
    state = {
        isApplying: false,
        images: this.props.images.slice(),
    };

    private popupRef = React.createRef<HTMLDivElement>();

    componentDidMount() {
        this.popupRef.current?.querySelector('.cancel-sort-btn')?.addEventListener('click', this.onClose);
        this.popupRef.current?.querySelector('.apply-sort-btn')?.addEventListener('click', this.onApply);
    }

    componentWillUnmount() {
        this.popupRef.current?.querySelector('.cancel-sort-btn')?.removeEventListener('click', this.onClose);
        this.popupRef.current?.querySelector('.apply-sort-btn')?.removeEventListener('click', this.onApply);
    }

    onClose = () => {
        this.props.onClose();
    };

    onApply = () => {
        this.setState({ isApplying: true });
        this.props.onClose(this.state.images);
    };

    onSortEnd = ({ oldIndex, newIndex }) => {
        this.setState(({ images }) => ({
            images: arrayMove(images, oldIndex, newIndex),
        }));
    };

    private footerContent = () => (
        <>
            <Button className='cancel-sort-btn' onClick={() => {}}>
                Cancel
            </Button>
            <Button className='apply-sort-btn' isLoading={this.state.isApplying} onClick={() => {}}>
                Apply sorting
            </Button>
        </>
    );

    render() {
        return (
            <Popup
                containerClass='sort-images-popup'
                title='Sort images by dragging'
                footerContent={this.footerContent()}
                popupRef={this.popupRef}
            >
                <SortableImages items={this.state.images} axis='xy' onSortEnd={this.onSortEnd} />
            </Popup>
        );
    }
}

export default ImagesSortPopup;
