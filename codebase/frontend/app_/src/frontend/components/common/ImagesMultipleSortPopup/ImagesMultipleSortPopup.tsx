import React, { Component, ReactNode } from 'react';
import {
    arrayMove,
    SortableContainer,
    SortableElement,
    SortEnd,
    SortEvent,
    SortEventWithTag,
    SortStart,
} from 'react-sortable-hoc';
import classNames from 'classnames';

import { ImageSize } from 'models/enum/ImageSize';
import Button from 'frontend/components/common/Button';
import HotelImage from 'frontend/components/common/HotelImage/HotelImage';
import { ISliderImage } from 'frontend/components/common/OfferCardSlider/OfferCardSlider';
import { Popup } from 'frontend/components/common/Popup';

type TSortEventWithSortableInfo = (SortEvent | SortEventWithTag) & {
    target: {
        sortableInfo: { index: number };
    };
};

const SortableImage = SortableElement<ISortableImageProps>(({ image }) => (
    <div className='img-carousel-thumbnails__image sortable'>
        {/* Use button to select images. Don't use checkbox for it, because doesn't work correctly in EE */}
        <button
            type='button'
            data-item-id={image.id}
            data-item-index={image.index}
            className={classNames('btn select-image-btn', image.selected && 'checked')}
            aria-label='Select image'
        />
        <HotelImage
            className='no-events'
            image={image.image}
            defaultSize={ImageSize.Small}
            key={image.image.id ?? image.index}
        />
    </div>
));

const SortableImages = SortableContainer<ISortableImagesProps>(({ items }) => (
    <div className='img-carousel-thumbnails__images'>
        {items.map((image, index) => (
            <SortableImage key={image.image.id ?? image.image.small} index={index} image={image} />
        ))}
    </div>
));

interface ISortableImageProps {
    image: ISliderImage;
}

interface ISortableImagesProps {
    items: ISliderImage[];
}

interface IImagesMultipleSortPopupProps {
    deleteSitecoreImages: (e: Event, selectedImages: ISliderImage[]) => Promise<boolean>;
    images: ISliderImage[];
    onClose: (images?: ISliderImage[]) => void;
}

interface IImagesMultipleSortPopupState {
    images: ISliderImage[];
    isApplying: boolean;
    isSorting: boolean;
    itemIndexesToDelete: number[];
    sortingItemIndex: Nullable<number>;
}

/** Show sortable images */
export class ImagesMultipleSortPopup extends Component<IImagesMultipleSortPopupProps, IImagesMultipleSortPopupState> {
    state = {
        isApplying: false,
        images: this.props.images.slice(),
        isSorting: false,
        sortingItemIndex: null,
        itemIndexesToDelete: [] as number[],
    };

    private popupRef = React.createRef<HTMLDivElement>();

    componentDidMount(): void {
        this.popupRef.current?.querySelector('.cancel-sort-btn')?.addEventListener('click', this.onClose);
        this.popupRef.current?.querySelector('.apply-sort-btn')?.addEventListener('click', this.onApply);
        this.popupRef.current
            ?.querySelector('.batch-delete-images-btn')
            ?.addEventListener('click', () => this.saveItemsToDelete(this.selectedImages));
        this.popupRef.current
            ?.querySelector('.img-carousel-thumbnails__images')
            ?.addEventListener('click', this.onThumbnailsClickInEditor);
    }

    componentWillUnmount(): void {
        this.popupRef.current?.querySelector('.cancel-sort-btn')?.removeEventListener('click', this.onClose);
        this.popupRef.current?.querySelector('.apply-sort-btn')?.removeEventListener('click', this.onApply);
        this.popupRef.current
            ?.querySelector('.batch-delete-images-btn')
            ?.removeEventListener('click', () => this.saveItemsToDelete(this.selectedImages));
        this.popupRef.current
            ?.querySelector('.img-carousel-thumbnails__images')
            ?.removeEventListener('click', this.onThumbnailsClickInEditor);
    }

    private get selectedImages(): ISliderImage[] {
        return this.state.images.filter(image => image.selected);
    }

    private get selectedImagesIndexes(): number[] {
        return this.state.images.reduce((acc, image) => {
            if (image.selected) {
                acc.push(image.index);
            }

            return acc;
        }, [] as number[]);
    }

    private onThumbnailsClickInEditor = async (e: Event) => {
        const target = e.target as HTMLElement;

        if (!target?.className) {
            return;
        }

        // Select images for updating: reordering or deleting
        if (
            target.className.includes('img-carousel-thumbnails__image') ||
            target.className.includes('select-image-btn')
        ) {
            if (!target.dataset.itemIndex || !target.dataset.itemId) {
                return;
            }

            const itemId = target.dataset.itemId;

            const newImages = this.state.images.map(image => {
                if (image.id === itemId) {
                    return { ...image, selected: !image.selected };
                }

                return image;
            });

            this.setState({ images: newImages });
        }
    };

    saveItemsToDelete = (items: ISliderImage[]): void => {
        this.setState(({ itemIndexesToDelete }) => ({
            itemIndexesToDelete: [...itemIndexesToDelete, ...items.map(item => item.index)],
            images: this.state.images.reduce((acc, image) => {
                if (items.findIndex(item => item.index === image.index) === -1) {
                    acc.push(image);
                }

                return acc;
            }, [] as ISliderImage[]),
        }));
    };

    onClose = (): void => {
        this.props.onClose();
    };

    onApply = async (e: Event): Promise<void> => {
        const { itemIndexesToDelete } = this.state;
        const shouldDeleteImages = !!itemIndexesToDelete.length;

        this.setState({ isApplying: true });

        if (shouldDeleteImages) {
            const imagesDeleted = await this.props.deleteSitecoreImages(
                e,
                this.props.images.filter(image => itemIndexesToDelete.includes(image.index)),
            );
            this.props.onClose(imagesDeleted ? this.state.images : undefined);
        } else {
            this.props.onClose(this.state.images);
        }
    };

    handleSortEnd = ({ oldIndex, newIndex }: SortEnd): void => {
        const selectedItemIds = this.selectedImages.map(image => image.id).filter(im => !!im) as string[];
        let newItems;

        if (selectedItemIds.length) {
            const selectedItems = selectedItemIds.map(id => ({
                ...this.state.images.find(el => el.image.id === id),
                selected: false,
            }));
            const items = this.state.images.filter(value => !selectedItemIds.includes(value.image.id || ''));

            newItems = [...items.slice(0, newIndex), ...selectedItems, ...items.slice(newIndex, items.length)];
        } else {
            newItems = arrayMove(this.state.images, oldIndex, newIndex);
        }

        this.setState({
            images: newItems,
            isSorting: false,
            sortingItemIndex: null,
        });
    };

    handleUpdateBeforeSortStart = ({ index }: SortStart): Promise<void> =>
        new Promise<void>(resolve =>
            this.setState(
                ({ images }) => ({
                    sortingItemIndex: images[index].index,
                    isSorting: true,
                }),
                resolve,
            ),
        );

    filterItems = (image: ISliderImage): boolean => {
        const { sortingItemIndex, isSorting } = this.state;

        // Do not hide the ghost of the element currently being sorted
        if (sortingItemIndex === image.index) {
            return true;
        }

        // Hide the other items that are selected
        if (isSorting && this.selectedImagesIndexes.includes(image.index)) {
            return false;
        }

        // Do not hide any other items
        return true;
    };

    private footerContent = () => (
        <>
            <div className='img-carousel-batch-manage'>
                <button className='btn batch-delete-images-btn'>Delete images</button>
                <span className='batch-selected-images'>Selected images: {this.selectedImages.length}</span>
            </div>
            <Button className='cancel-sort-btn' onClick={() => {}}>
                Cancel
            </Button>
            <Button className='apply-sort-btn' isLoading={this.state.isApplying} onClick={() => {}}>
                Apply changes
            </Button>
        </>
    );

    handleShouldCancelStart = (event: TSortEventWithSortableInfo): boolean => {
        const index = event.target.sortableInfo.index;
        const item = this.state.images[index];

        // Cancel start if there are no selected items
        if (!this.selectedImages.length) {
            return false;
        }

        // Cancel start if user try to move not selected item
        return !this.selectedImagesIndexes.includes(item.index);
    };

    render(): ReactNode {
        return (
            <Popup
                containerClass='sort-images-popup'
                title='Sort images by dragging'
                footerContent={this.footerContent()}
                popupRef={this.popupRef}
            >
                <SortableImages
                    items={this.state.images.filter(this.filterItems)}
                    axis='xy'
                    onSortEnd={this.handleSortEnd}
                    shouldCancelStart={this.handleShouldCancelStart}
                    updateBeforeSortStart={this.handleUpdateBeforeSortStart}
                />
            </Popup>
        );
    }
}

export default ImagesMultipleSortPopup;
