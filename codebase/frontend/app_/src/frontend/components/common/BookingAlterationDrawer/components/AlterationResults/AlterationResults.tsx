import { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import { getImageUrl } from 'frontend/utils/url.utils';
import { IBoardType } from 'models/data/IHotel';
import { IAltBoard, IUnit } from 'models/data/IOffer';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import { IAlterationResults } from 'frontend/components/common/BookingAlterationDrawer/BookingAlterationDrawer';
import JSSImageNext from 'frontend/components/common/JSSImageNext/JSSImageNext';
import SvgCup from 'frontend/components/icons-new/Cup';
import SvgHotelBedFilled from 'frontend/components/icons-new/HotelBedFilled';
import BoardCard from 'frontend/components/renderings/BoardTypes/components/BoardCard/BoardCard';
import RoomCardBase from 'frontend/components/renderings/RoomTypes/components/RoomCardBase/RoomCardBase';

import styles from './AlterationResults.module.scss';

export const OLD_IMAGE_WIDTH = 123;
export const OLD_IMAGE_HEIGHT = 80;

export interface IAlterationResultsProps {
    alterationResult: IAlterationResults;
    fallbackImage: string;
    alterationChangingFromTitle?: ISitecoreField<string>;
}

const AlterationResults: FC<IAlterationResultsProps> = ({
    fallbackImage,
    alterationResult: { items, isBoardAlteration, title, subtitle, text },
    alterationChangingFromTitle,
}) => {
    if (!items?.length) {
        return null;
    }

    return (
        <>
            <div className={styles.alterationDescription}>
                {!!title?.value && (
                    <h3 className={styles.resultTitle} data-tid='alteration-result-title'>
                        {isBoardAlteration ? <SvgCup /> : <SvgHotelBedFilled />}
                        <Text field={title} tag='span' />
                    </h3>
                )}
                <Text
                    field={subtitle}
                    tag='p'
                    className={styles.descriptionText}
                    data-tid='alteration-description-text'
                />
                <Text
                    field={text}
                    tag='h5'
                    className={styles.descriptionTitle}
                    data-tid='alteration-description-title'
                />
            </div>
            {items.map(item => {
                const oldItemImage = item.oldItemImgSrc ?? fallbackImage;

                return (
                    <div
                        data-tid='alteration-result-wrapper'
                        key={`alteration-${
                            item.newItem.roomIdx ?? (item.newItem.item as IUnit | IAltBoard | IBoardType).code
                        }`}
                        className={classNames(styles.alterationResults, {
                            [styles.resultsWithSeparator]: !isBoardAlteration,
                        })}
                    >
                        <div data-tid='alteration-result-element'>
                            {isBoardAlteration ? (
                                <BoardCard
                                    board={item.newItem.item as IAltBoard | IBoardType}
                                    isSpoiler={false}
                                    isSelected
                                    isAlteration
                                />
                            ) : (
                                <RoomCardBase
                                    room={item.newItem.item as IUnit}
                                    roomIdx={item.newItem.roomIdx}
                                    fallbackImg={item.newItem.fallbackImg}
                                    isAlteration
                                />
                            )}
                        </div>
                        <div className={styles.oldItem}>
                            <div
                                className={classNames(styles.oldItemImg, isBoardAlteration && styles.oldItemIcon)}
                                data-tid='alteration-old-item-image'
                            >
                                <JSSImageNext
                                    field={{
                                        value: {
                                            src: `${isBoardAlteration ? getImageUrl(oldItemImage) : oldItemImage}`,
                                        },
                                    }}
                                    className={styles.oldImage}
                                    width={OLD_IMAGE_WIDTH}
                                    height={OLD_IMAGE_HEIGHT}
                                />
                            </div>
                            <div className={styles.oldItemInfo}>
                                <Text
                                    field={alterationChangingFromTitle}
                                    className={styles.oldItemTitle}
                                    data-tid='alteration-old-item-title'
                                />
                                <div className={styles.oldItemName} data-tid='alteration-old-item-name'>
                                    {item.oldItemName}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </>
    );
};

export default AlterationResults;
