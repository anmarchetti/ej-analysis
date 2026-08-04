import * as React from 'react';
import { inject, observer } from 'mobx-react';

import settings from 'code/settings';
import { Tokens } from 'code/tokens';
import { MarketStore } from 'frontend/store/base';
import { TStores } from 'frontend/store/IStores';
import isBackend from 'frontend/utils/isBackend';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { IRoomFacility } from 'models/data/IHotel';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { IComponentWithDictionary } from 'models/sitecore/generic/IComponentWithDictionary';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import { Tooltip, TooltipContent, TooltipTrigger } from 'frontend/components/common/Tooltip';
import SvgTick from 'frontend/components/icons-new/Tick';
import styles from 'frontend/components/renderings/RoomTypes/components/Room.module.scss';

export interface IRoomFacilityItemProps extends IComponentWithDictionary {
    getFormattedNumber: MarketStore['getFormattedNumber'];
    roomFacility: IRoomFacility;
    id?: string;
    isEditMode?: boolean;
    onDeleteItem?: (id: string) => void;
    tooltipClass?: string;
}

const MIN_TOOLTIP_WIDTH = 115;

export class RoomFacilityItem extends React.Component<IRoomFacilityItemProps> {
    private viewRef = React.createRef<HTMLDivElement>();

    componentDidMount(): void {
        if (this.props.isEditMode && this.viewRef?.current && !isBackend()) {
            this.viewRef.current.querySelector('.delete-room-facility-btn')?.addEventListener('click', this.deleteItem);
        }
    }

    componentWillUnmount(): void {
        if (this.props.isEditMode && this.viewRef?.current) {
            this.viewRef.current
                .querySelector('.delete-room-facility-btn')
                ?.removeEventListener('click', this.deleteItem);
        }
    }

    deleteItem = (e: Event): void => {
        e.preventDefault();
        const shouldDelete = confirm('Are you sure you want to delete this facility?');

        if (!shouldDelete) {
            return;
        }

        const target = e.target as HTMLElement;
        const itemId = target.dataset.itemId;

        if (!itemId) {
            return;
        }

        this.props.onDeleteItem?.(itemId);
    };

    render() {
        const { getPhrase, getFormattedNumber, roomFacility, isEditMode, id, tooltipClass } = this.props;

        const roomSize =
            roomFacility.code === settings.AlternativeRooms.RoomSizeFacilityCode
                ? Tokenizer.replaceToken(
                      getPhrase(SitecoreDictionary.RoomTypesLabelsRoomSizeFacility),
                      Tokens.Number,
                      getFormattedNumber(roomFacility.number),
                  )
                : roomFacility.name;

        return (
            <div className={styles.facilityContainer}>
                <div className={styles.facility} ref={this.viewRef} data-tid='facility-item'>
                    <SvgTick />
                    {roomSize}
                    {roomFacility.disclaimerMessage && (
                        <Tooltip>
                            <TooltipTrigger className={styles.tooltipTrigger} />
                            <TooltipContent className={tooltipClass}>
                                <RichTextWithLinks tag='div' field={{ value: roomFacility.disclaimerMessage }} />
                            </TooltipContent>
                        </Tooltip>
                    )}
                    {isEditMode && id && (
                        <div>
                            <a href='#' className='delete-room-facility-btn' data-item-id={id}>
                                Remove
                            </a>
                        </div>
                    )}
                </div>
            </div>
        );
    }
}

export default inject((stores: TStores) => ({
    getPhrase: stores.layoutStore.getPhrase,
    getFormattedNumber: stores.marketStore.getFormattedNumber,
}))(observer(class WrappedRoomFacilityItem extends RoomFacilityItem {}));
