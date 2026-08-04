import * as React from 'react';
import { action, computed, makeObservable, observable } from 'mobx';
import { inject, observer } from 'mobx-react';

import settings from 'code/settings';
import { TStores } from 'frontend/store/IStores';
import { getSmallImage, withValue } from 'frontend/utils/expEditor.utils';
import isBackend from 'frontend/utils/isBackend';
import { removeFirstAndLastChar } from 'frontend/utils/string.utils';
import { IAltBoard } from 'models/data/IOffer';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreCompositeField } from 'models/sitecore/generic/ISitecoreField';
import { IBoardItem } from 'models/sitecore/IBoardItem';
import Button from 'frontend/components/common/Button';

import { boardTypesFields } from './components/__mocks__/boardTypesFields';
import BoardTypesWrapper from './components/BoardTypesWrapper/BoardTypesWrapper';

interface IBoardTypesBrowseFields {
    id?: string;
    items?: ISitecoreCompositeField<IBoardItem>[];
}

export interface IBoardTypesBrowseProps extends ISitecoreComponent<IBoardTypesBrowseFields> {
    addItem: (parentId: string | null, callback?: (itemId: string | null) => void) => Promise<string | null>;
    deleteItem: (itemId: string) => Promise<any>;
    getItemById: (itemId: string) => Promise<any>;
    isEditMode: boolean;
    layoutId: string;
    setItemDisplayName: (itemId: string, name: string) => void;
    updateItem: (itemId: string, callback: (itemId: string | null) => void) => Promise<any>;
}

export class BoardTypesBrowse extends React.Component<IBoardTypesBrowseProps> {
    constructor(props: IBoardTypesBrowseProps) {
        super(props);
        makeObservable(this);
    }

    @observable items: ISitecoreCompositeField<IBoardItem>[] = [];

    state = {
        addingItem: false, // used for button style
        parentItemId: undefined,
    };

    private viewRef = React.createRef<HTMLDivElement>();

    componentDidMount() {
        if (isBackend()) {
            return;
        }

        if (this.props.fields?.items?.length) {
            this.setItems(this.props.fields.items);
        }

        if (this.props.rendering?.fields?.id) {
            this.setState({ parentItemId: this.props.rendering?.fields?.id });
        }

        if (this.props.isEditMode) {
            // we use addEventListener here, because React events don't work in Experience Editor
            this.viewRef.current?.querySelector('.add-board-btn')?.addEventListener('click', this.onAddItem);
        }
    }

    componentWillUnmount() {
        if (this.props.isEditMode) {
            this.viewRef.current?.querySelector('.add-board-btn')?.removeEventListener('click', this.onAddItem);
        }
    }

    @action private setItems(items: ISitecoreCompositeField<IBoardItem>[]) {
        this.items = items;
    }

    private getItemFields = async data => {
        // get nested BoardType data
        const boardTypeId = data?.BoardType && removeFirstAndLastChar(data.BoardType);

        if (!boardTypeId) {
            return;
        }

        const boardType = await this.props.getItemById(boardTypeId);
        const boardTypeIcon = getSmallImage(boardType.Icon, removeFirstAndLastChar(boardTypeId));
        const icon = getSmallImage(data?.Icon, data?.ItemID);

        return {
            Content: withValue(data.Content),
            Description: withValue(data.Description),
            Icon: withValue({ src: icon || '' }),
            BoardType: {
                id: boardTypeId,
                fields: {
                    Code: withValue(boardType?.Code),
                    Content: withValue(boardType?.Content),
                    Description: withValue(boardType?.Description),
                    Icon: withValue({ src: boardTypeIcon || '' }),
                    Name: withValue(boardType?.Name),
                },
            },
        };
    };

    @computed get boardTypes(): IAltBoard[] {
        return this.items.map(item => {
            const icon =
                item?.fields?.Icon?.value?.class !== settings.Default.scImageClass && item?.fields?.Icon?.value?.src;

            return {
                itemId: item?.id,
                code: item?.fields?.BoardType?.fields?.Code?.value || '',
                title: item?.fields?.BoardType?.fields?.Name?.value || '',
                name: item?.fields?.BoardType?.fields?.Name?.value || '',
                content: item?.fields?.Content?.value || '',
                description: item?.fields?.Description?.value || '',
                iconUrl: icon || '',
                price: 0,
                pricePP: 0,
                priceExcludingTouristTax: 0,
                pricePPExcludingTouristTax: 0,
                unitCodes: {},
                roomAlterations: {},
                isExt: false,
            };
        });
    }

    private onAddItem = async () => {
        this.setState({ addingItem: true });
        const parentId = await this.props.addItem(this.state.parentItemId || null, this.onCloseCallback());
        this.setState({ addingItem: false, parentItemId: parentId });
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

    @action private onUpdateItem = (itemId: string) => {
        const item = this.items.find(item => item.id === itemId);
        this.props.updateItem(itemId, this.onCloseCallback(item));
    };

    @action private updateItem = (item: ISitecoreCompositeField<IBoardItem>, fields) => {
        item.fields = fields;
        this.setItems(this.items);
    };

    /**
     * Closure function to use as a callback for closing popup after Add / Edit action
     * @param item
     */
    private onCloseCallback = (item?: ISitecoreCompositeField<IBoardItem>) => async (itemId: string | null) => {
        if (!itemId) {
            return;
        }

        const data = await this.props.getItemById(itemId);
        const fields = await this.getItemFields(data);

        const itemName = fields?.BoardType?.fields?.Name?.value || '';
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
                    {!!this.boardTypes.length && (
                        <BoardTypesWrapper
                            anchor=''
                            allBoardTypes={this.boardTypes}
                            selectedBoardType={null}
                            offer={null}
                            onUpdateBoard={this.onUpdateItem}
                            onDeleteBoard={this.onDeleteItem}
                            fields={boardTypesFields()}
                        />
                    )}
                    {this.props.isEditMode && (
                        <div className='board-manage'>
                            <Button className='add-board-btn mb-3' isLoading={this.state.addingItem}>
                                Add board
                            </Button>
                        </div>
                    )}
                </div>
            </section>
        );
    }
}

const ConnectedBoardTypesBrowse = inject((stores: TStores) => ({
    isEditMode: stores.layoutStore.isEditMode,
    layoutId: stores.layoutStore.layoutId,
    addItem: stores.editorStore.addBoard,
    getItemById: stores.editorStore.getItemById,
    deleteItem: stores.editorStore.deleteItem,
    updateItem: stores.editorStore.updateItem,
    setItemDisplayName: stores.editorStore.setItemDisplayName,
}))(observer(class WrappedBoardTypesBrowse extends BoardTypesBrowse {}));

export default ConnectedBoardTypesBrowse;
