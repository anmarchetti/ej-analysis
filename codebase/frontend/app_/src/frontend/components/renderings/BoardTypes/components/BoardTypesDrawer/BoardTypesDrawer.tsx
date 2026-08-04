import React from 'react';
import { Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';
import { Text } from '@sitecore-jss/sitecore-jss-react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { IOfferWithoutAltBoards, TAllBoards } from 'models/data/IOffer';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import Button from 'frontend/components/common/Button';
import Drawer from 'frontend/components/common/Drawer';
import { IBoardTypesFields } from 'frontend/components/renderings/BoardTypes/BoardTypes';
import BoardSection from 'frontend/components/renderings/BoardTypes/components/BoardSection/BoardSection';

import styles from './BoardTypesDrawer.module.scss';

export interface IBoardTypesDrawerProps {
    allBoardTypes: TAllBoards;
    closePopup: () => void;
    isOpen: boolean;
    offer: Nullable<IOfferWithoutAltBoards>;
    countryCode?: string;
    fallbackImage?: string;
    fields?: IBoardTypesFields;
    freeChildPlaceTooltip?: string;
    isPostBooking?: boolean;
    onDeleteBoard?: (id: string) => void;
    onUpdateBoard?: (id: string) => void;
    rendering?: ISitecoreComponent['rendering'];
    selectedBoardTypeCode?: string;
}

const BoardTypesDrawer = (props: IBoardTypesDrawerProps) => {
    const {
        isOpen,
        offer,
        allBoardTypes,
        fallbackImage,
        selectedBoardTypeCode,
        fields,
        closePopup,
        onUpdateBoard,
        onDeleteBoard,
        isPostBooking,
        freeChildPlaceTooltip,
        countryCode,
        rendering,
    } = props;

    if (!fields) {
        return null;
    }

    const {
        DrawerTitle,
        DrawerDescription,
        DrawerCancel,
        AlterationSubtitle,
        AlterationRoomResultTitle,
        AlterationResultSubtitle,
        AlterationRoomResultTextSingular,
        AlterationRoomResultTextPlural,
        AlterationExtendedInfoTitle,
        AlterationExtendedInfoText,
        AlterationChangingFromTitle,
        AlterationInfoTitle,
        AlterationInfoText,
        FreeChildPlaceInfoTitle,
        FreeChildPlaceInfoText,
    } = fields;

    return (
        <Drawer
            open={isOpen}
            className={classNames('drawer--animation-bottom', styles.container)}
            dataTid='drawer-board-select'
        >
            <div className={styles.body}>
                {!!DrawerTitle && <Text field={DrawerTitle} tag='h2' className={styles.title} />}
                {!!DrawerDescription && (
                    <Text
                        data-tid='board-types-drawer-description'
                        tag='div'
                        field={DrawerDescription}
                        className={styles.description}
                    />
                )}

                <Placeholder name={PlaceholderNames.ChangeFeeInfo} rendering={rendering} />

                <BoardSection
                    offer={offer}
                    allBoardTypes={allBoardTypes}
                    selectedBoardTypeCode={selectedBoardTypeCode}
                    alterationSubtitle={AlterationSubtitle}
                    alterationResTitle={AlterationRoomResultTitle}
                    alterationResSubtitle={AlterationResultSubtitle}
                    alterationResTextSingular={AlterationRoomResultTextSingular}
                    alterationResTextPlural={AlterationRoomResultTextPlural}
                    alterationExtendedInfoTitle={AlterationExtendedInfoTitle}
                    alterationExtendedInfoText={AlterationExtendedInfoText}
                    alterationInfoTitle={AlterationInfoTitle}
                    alterationInfoText={AlterationInfoText}
                    alterationChangingFromTitle={AlterationChangingFromTitle}
                    fallbackImage={fallbackImage}
                    freeChildPlaceInfoTitle={FreeChildPlaceInfoTitle}
                    freeChildPlaceInfoText={FreeChildPlaceInfoText}
                    onUpdateBoard={onUpdateBoard}
                    onDeleteBoard={onDeleteBoard}
                    onSelectBoard={closePopup}
                    drawerMode
                    isPostBooking={isPostBooking}
                    freeChildPlaceTooltip={freeChildPlaceTooltip}
                    countryCode={countryCode}
                />
            </div>
            {!!DrawerCancel?.value && (
                <div className='col-12 drawer__actions'>
                    <Button className={styles.cancelBtn} isText isFullWidth dataTid='cancel-btn' onClick={closePopup}>
                        {DrawerCancel.value}
                    </Button>
                </div>
            )}
        </Drawer>
    );
};

export default observer(BoardTypesDrawer);
