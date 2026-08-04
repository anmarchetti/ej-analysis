import * as React from 'react';
import { action, makeObservable, observable } from 'mobx';
import { inject, observer } from 'mobx-react';

import { TStores } from 'frontend/store/IStores';
import { getSmallImage, withValue } from 'frontend/utils/expEditor.utils';
import isBackend from 'frontend/utils/isBackend';
import { removeFirstAndLastChar } from 'frontend/utils/string.utils';
import { IImage } from 'models/data/IHotel';
import { IUnit } from 'models/data/IOffer';
import { IOriginalRoom } from 'models/data/IOriginalRoom';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreCompositeField } from 'models/sitecore/generic/ISitecoreField';
import { IRoomItem } from 'models/sitecore/IRoomItem';
import Button from 'frontend/components/common/Button';

import RoomTypesWrapper from './components/RoomTypesWrapper/RoomTypesWrapper';

interface IRoomsFolder {
    roomsFolder: string;
    roomsFolderName: string;
}
interface IRoomTypesBrowseFields {
    id?: string;
    items?: ISitecoreCompositeField<IRoomItem>[];
    roomsFolders?: IRoomsFolder[];
}

interface IRoomTypesBrowseProps extends ISitecoreComponent<IRoomTypesBrowseFields> {
    addFacility: (facilitiesFolderId: string | null, callback?, parentId?: string) => Promise<string | null>;
    addImage: (parentId: string | null, callback?, roomItemId?: string) => void;
    addItem: (parentId: string | null, callback?: (itemId: string | null) => void) => Promise<string | null>;
    deleteItem: (itemId: string) => Promise<any>;
    getImageByItemId: (itemId: string) => Promise<IImage | null>;
    getItemById: (itemId: string) => Promise<any>;
    isEditMode: boolean;
    layoutId: string;
    setItemDisplayName: (itemId: string, name: string) => void;
    sortFacilities: (itemsIds: string[]) => Promise<void>;
    sortImages: (itemsIds: string[]) => Promise<void>;
    updateItem: (itemId: string, callback: (itemId: string | null) => void) => Promise<any>;
}

export class RoomTypesBrowse extends React.Component<IRoomTypesBrowseProps> {
    constructor(props: IRoomTypesBrowseProps) {
        super(props);
        makeObservable(this);
    }

    @observable items: ISitecoreCompositeField<IRoomItem>[] = [];

    state = {
        addingItem: false, // used for button style
        parentItemId: undefined,
        currentFolderName: undefined,
        roomsFolderOptions: [],
    };

    private viewRef = React.createRef<HTMLDivElement>();

    componentDidMount() {
        if (isBackend()) {
            return;
        }

        if (this.props.fields?.items?.length) {
            this.setItems(this.props.fields.items);
        }

        if (this.props.isEditMode) {
            const currentFolderName = this.props.fields?.roomsFolders?.find(
                x => x.roomsFolder === this.props.rendering?.fields?.roomsFolderId,
            )?.roomsFolderName;
            this.setState({
                parentItemId: this.props.rendering?.fields?.roomsFolderId,
                roomsFolderOptions: this.props.fields?.roomsFolders?.map(x => ({
                    value: x.roomsFolder,
                    label: x.roomsFolderName,
                })),
                currentFolderName,
            });
            // we use addEventListener here, because React events don't work in Experience Editor
            this.viewRef.current?.querySelector('.add-room-btn')?.addEventListener('click', this.onAddItem);
            this.viewRef.current
                ?.querySelector('.select-rooms-folder')
                ?.addEventListener('change', this.onChangeRoomsFolder);
        }
    }

    componentWillUnmount() {
        if (!isBackend() && this.props.isEditMode) {
            this.viewRef.current?.querySelector('.add-room-btn')?.removeEventListener('click', this.onAddItem);
            this.viewRef.current
                ?.querySelector('.select-rooms-folder')
                ?.removeEventListener('change', this.onChangeRoomsFolder);
        }
    }

    @action private setItems(items: ISitecoreCompositeField<IRoomItem>[]) {
        this.items = items;
    }

    private getItemFields = async data => {
        // get nested RoomType data
        const roomTypeIds = data.RoomType?.split('|').map(removeFirstAndLastChar);
        let roomTypes: any[] = [];

        if (roomTypeIds?.length) {
            const requests = roomTypeIds?.length && roomTypeIds.map((id: string) => this.props.getItemById(id));
            roomTypes = await Promise.all(requests);
        }

        const [icon, image] = [data.Icon, data.Image].map(field => getSmallImage(field, data.ItemID));

        return {
            Code: withValue(data.Code),
            Content: withValue(data.Content),
            Description: withValue(data.Description),
            Icon: withValue({ src: icon || '' }),
            Image: withValue({ src: image || '' }),
            Name: withValue(data.Name),
            RoomType: roomTypes.map((item: any, index: number) => {
                const roomTypeId = roomTypeIds[index];
                const [roomIcon, roomImage] = [item?.Icon, item?.Image].map(field =>
                    getSmallImage(field, removeFirstAndLastChar(roomTypeId)),
                );

                return {
                    id: roomTypeId,
                    fields: {
                        Code: withValue(item.Code),
                        Content: withValue(item.Content),
                        Description: withValue(item.Description),
                        Icon: withValue({ src: roomIcon || '' }),
                        Image: withValue({ src: roomImage || '' }),
                        Name: withValue(item.Name),
                        TypeDescriptionContent: withValue(item.TypeDescriptionContent),
                    },
                };
            }),
        };
    };

    private getDefaultRoomFields = (item: ISitecoreCompositeField<IRoomItem>) => ({
        itemId: item?.id,
        code: item?.fields?.Code?.value,
        boardType: {
            code: item?.fields?.Code?.value,
            title: item?.fields?.Name?.value,
            content: item?.fields?.Content?.value,
            description: item?.fields?.Description?.value,
            iconUrl: item?.fields?.Icon?.value.src,
            roomAlterations: { [item?.fields?.Code?.value]: null },
        },
        board: '',
        occupation: {
            adults: 0,
            children: 0,
            infants: 0,
            paxIds: [],
            childAges: [],
        },
        isExt: false,
        price: 0,
        pricePP: 0,
    });

    private filterByRoomsFolder = (x: ISitecoreCompositeField<IRoomItem>) =>
        x['roomsFolder'] === this.state.parentItemId;

    private get alternativeRooms(): IUnit[][] {
        const roomItems = this.props.isEditMode ? this.items.filter(this.filterByRoomsFolder) : this.items;

        return [
            roomItems.map(item => ({
                ...this.getDefaultRoomFields(item),
                roomType: this.getRoomType(item),
            })) || [],
        ];
    }

    private get originalRooms(): IOriginalRoom[] {
        const roomItems = this.props.isEditMode ? this.items.filter(this.filterByRoomsFolder) : this.items;

        return (
            roomItems.map(
                (room, index): IOriginalRoom => ({
                    index,
                    room: this.getUnitFromItem(room),
                    alternativeRooms: [this.getUnitFromItem(room.fields)],
                    allRoomsCodes: this.items.map(item => this.getUnitFromItem(item)?.code),
                }),
            ) || []
        );
    }

    private getRoomType = item => {
        // Editable fields for EE
        const images = item?.roomImages?.roomImagesContent?.map(image =>
            image?.fields?.Image
                ? {
                      id: image?.id,
                      small: image?.fields?.Image?.value?.src,
                      medium: image?.fields?.Image?.value?.src,
                      large: image?.fields?.Image?.value?.src,
                  }
                : {
                      id: image?.id,
                      small: image?.fields?.Small?.value,
                      medium: image?.fields?.Medium?.value,
                      large: image?.fields?.Large?.value,
                  },
        );

        const facilities = item?.roomFacilities?.roomFacilitiesContent?.map(facility => ({
            id: facility?.id,
            name: facility?.name,
            code: facility?.fields?.FacilityType?.[0]?.fields?.Code?.value,
        }));

        return {
            code:
                !!item?.fields?.RoomType &&
                item.fields.RoomType?.length > 0 &&
                item.fields.RoomType[0]?.fields?.Code?.value,
            title: {
                ...item?.fields?.Name,
                value:
                    !!item?.fields?.RoomType &&
                    item.fields.RoomType?.length > 0 &&
                    item.fields.RoomType[0]?.fields?.Name?.value,
            },
            content:
                !!item?.fields?.RoomType &&
                item.fields.RoomType?.length > 0 &&
                item.fields.RoomType[0]?.fields?.Content?.value,
            description:
                !!item?.fields?.RoomType &&
                item.fields.RoomType?.length > 0 &&
                item.fields.RoomType[0]?.fields?.Description?.value,
            iconUrl:
                !!item?.fields?.RoomType &&
                item.fields.RoomType?.length > 0 &&
                item.fields.RoomType[0]?.fields?.Icon?.value.src,
            images,
            roomImagesFolderId: item?.roomImages?.roomImagesFolderId,
            roomFacilityFolderId: item?.roomFacilities?.roomFacilitiesFolderId,
            facilities,
            stays: [],
        };
    };

    private getUnitFromItem = (item): IUnit => ({
        ...this.getDefaultRoomFields(item),
        roomType: this.getRoomType(item),
    });

    private onAddImage = async (roomImagesFolderItemId: string | null, callback?, roomItemId?: string) => {
        const parentId = await this.props.addImage(roomImagesFolderItemId, callback, roomItemId);
        this.setState({ roomsItemId: parentId });
    };

    private onAddItem = async () => {
        this.setState({ addingItem: true });
        const parentId = await this.props.addItem(this.state.parentItemId || null, this.onCloseCallback());
        this.setState({ addingItem: false, parentItemId: parentId });
    };

    private onChangeRoomsFolder = async (e: any) => {
        const folderId = e.target.value;
        const folderName = this.props.fields?.roomsFolders?.find(x => x.roomsFolder === folderId)?.roomsFolderName;
        this.setState({ parentItemId: folderId, currentFolderName: folderName });
    };

    private addItem = (itemId: string, fields) => {
        this.setItems([
            ...this.items,
            {
                id: itemId,
                fields,
            },
        ]);
    };

    @action private onUpdateItem = async (itemId: string) => {
        const item = this.items.find(item => item.id === itemId);
        this.props.updateItem(itemId, this.onCloseCallback(item));
    };

    @action private updateItem = (item: ISitecoreCompositeField<IRoomItem>, fields) => {
        item.fields = { ...fields, Name: { ...item.fields?.Name, value: fields?.Name?.value } };
        this.setItems(this.items);
    };

    /**
     * Closure function to use as a callback for closing popup after Add / Edit action
     * @param item
     */
    private onCloseCallback = (item?: ISitecoreCompositeField<IRoomItem>) => async (itemId: string | null) => {
        if (!itemId) {
            return;
        }

        const data = await this.props.getItemById(itemId);
        const fields = await this.getItemFields(data);

        const itemName = fields.RoomType?.[0]?.fields?.Name?.value || '';
        this.props.setItemDisplayName(itemId, itemName);

        if (item) {
            this.updateItem(item, fields);
        } else {
            this.addItem(itemId, fields);
        }
    };

    @action private onDeleteItem = (id: string) => {
        this.props.deleteItem(id);
        this.items = this.items.filter(item => item.id !== id);
    };

    render() {
        if (!this.props.fields || isBackend()) {
            return null;
        }

        return (
            <section className='wrapper-component-container wrapper-component-container--grey'>
                <div className='wrapper-component-container__inner' ref={this.viewRef}>
                    {this.props.isEditMode && (
                        <div className='room-manage'>
                            <h2>Change rooms folder</h2>
                            <select className={'select-rooms-folder'}>
                                {this.state.roomsFolderOptions?.map((x, i) => (
                                    <option key={i} value={x['value']}>
                                        {x['label']}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    <RoomTypesWrapper
                        originalRooms={this.originalRooms}
                        units={!!this.items.length ? [this.getUnitFromItem(this.items[0])] : []}
                        alternativeRooms={this.alternativeRooms}
                        fallbackImage={''}
                        onChangeRoom={() => Promise.resolve()}
                        offer={null}
                        isLoadingOffer={false}
                        parentItemId={this.props.rendering?.fields?.id}
                        onAddImage={this.onAddImage}
                        onUpdateRoom={this.onUpdateItem}
                        onDeleteItem={this.onDeleteItem}
                        fields={{
                            Title: {
                                value: this.props.isEditMode
                                    ? `Manage Rooms - ${this.state.currentFolderName}`
                                    : 'Manage Rooms',
                            },
                        }}
                    />
                    {this.props.isEditMode && (
                        <div className='room-manage'>
                            <Button className='add-room-btn mb-3' isLoading={this.state.addingItem}>
                                {`Add room to '${this.state.currentFolderName}' folder`}
                            </Button>
                        </div>
                    )}
                </div>
            </section>
        );
    }
}

export default inject((stores: TStores) => ({
    isEditMode: stores.layoutStore.isEditMode,
    layoutId: stores.layoutStore.layoutId,
    getItemById: stores.editorStore.getItemById,
    addItem: stores.editorStore.addRoom,
    updateItem: stores.editorStore.updateItem,
    deleteItem: stores.editorStore.deleteItem,
    setItemDisplayName: stores.editorStore.setItemDisplayName,
    addImage: stores.editorStore.addImage,
    getImageByItemId: stores.editorStore.getImageByItemId,
    sortImages: stores.editorStore.sortItems,
    sortFacilities: stores.editorStore.sortItems,
    addFacility: stores.editorStore.addRoomFacility,
}))(observer(class WrappedRoomTypesBrowse extends RoomTypesBrowse {}));
