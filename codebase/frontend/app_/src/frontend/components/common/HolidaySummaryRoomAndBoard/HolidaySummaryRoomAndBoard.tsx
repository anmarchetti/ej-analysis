import { Fragment, FunctionComponent } from 'react';
import classNames from 'classnames';
import sanitize from 'sanitize-html';

import { cmsUrls } from 'code/endpoints';
import useStore from 'frontend/hooks/useStore';
import { getDatesAndStayDuration, getRoomsMeta } from 'frontend/utils/HolidaySummaryRoom.utils';
import { IBookingAccom } from 'models/data/IBookingInfo';
import { IRoom } from 'models/data/IHotel';
import { IUnit } from 'models/data/IOffer';
import ImageWithFilter, { SVGFilterMatrix } from 'frontend/components/common/ImageWithFilter/ImageWithFilter';
import SvgCalendar from 'frontend/components/icons-new/Calendar';
import SVGHotelBedFilled from 'frontend/components/icons-new/HotelBedFilled';

import styles from './HolidaySummaryRoomAndBoard.module.scss';

export interface IHolidaySummaryRoomAndBoardProps {
    accom: IBookingAccom;
    hotel: {
        name: string;
        resort: {
            name: string;
            region: string;
        };
    };
    units: (IUnit | IRoom)[];
    children?: React.ReactNode;
    dataTid?: string;
    showStayDuration?: boolean;
}

const HolidaySummaryRoomAndBoard: FunctionComponent<IHolidaySummaryRoomAndBoardProps> = ({
    units,
    hotel,
    dataTid,
    children,
    accom,
    showStayDuration,
}) => {
    const { getPhrase } = useStore(store => ({
        getPhrase: store.layoutStore.getPhrase,
    }));

    const roomsMeta = getRoomsMeta(units as IUnit[], getPhrase);
    const stayDuration = getDatesAndStayDuration(accom.startDate, accom.endDate, getPhrase);

    return (
        <div className={styles.container}>
            <div className={styles.block} data-tid={dataTid}>
                <SVGHotelBedFilled className={styles.icon} data-tid={`${dataTid}-room-icon`} />
                <div className={styles.content}>
                    <div className={styles.title} data-tid={`${dataTid}-room-title`}>
                        {hotel.name}
                    </div>
                    <div data-tid={`${dataTid}-room-location`}>{`${hotel.resort.name}, ${hotel.resort.region}`}</div>
                    <div>
                        {roomsMeta.map(({ rooms, board }, unitIdx) => (
                            <Fragment key={`holiday-summary-unit-${unitIdx}-${board.code}`}>
                                {rooms.map(({ title, roomNumber, forPeople, room }, roomIdx) => (
                                    <div
                                        key={`holiday-summary-unit-${unitIdx}-${room.code}-${roomIdx}`}
                                        data-tid={`${dataTid}-room-info`}
                                    >{`${roomNumber}: ${title} ${forPeople}`}</div>
                                ))}
                            </Fragment>
                        ))}
                    </div>
                </div>
            </div>
            <div className={styles.contentBlock} data-tid={dataTid}>
                <div
                    className={classNames(styles.block, { [styles.blockWithChild]: !!children })}
                    data-tid={`${dataTid}-board-block`}
                >
                    {children}
                    {roomsMeta.map(({ board }) => (
                        <div
                            className={styles.block}
                            key={`holiday-summary-board-${board.name}`}
                            data-tid={`${dataTid}-board-info`}
                        >
                            <ImageWithFilter
                                imageSrc={cmsUrls.media(board.iconUrl as string)}
                                filterMatrix={SVGFilterMatrix.Grayscale}
                                className={styles.icon}
                                dataTid={`${dataTid}-board-icon`}
                            />
                            <div className={styles.content}>
                                <div data-tid={`${dataTid}-board-title`} className={styles.title}>
                                    {board.title}
                                </div>

                                <div
                                    data-tid={`${dataTid}-board-description`}
                                    className='holiday-summary-item__text'
                                    dangerouslySetInnerHTML={{ __html: sanitize(board.description) }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
                {showStayDuration && stayDuration && (
                    <div className={styles.block} data-tid={`${dataTid}-duration-info`}>
                        <SvgCalendar className={styles.icon} data-tid={`${dataTid}-duration-icon`} />
                        <div className={styles.content} data-tid={`${dataTid}-duration-text`}>
                            {stayDuration}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HolidaySummaryRoomAndBoard;
