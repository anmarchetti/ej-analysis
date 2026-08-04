import { FunctionComponent } from 'react';
import classNames from 'classnames';

import styles from './AirportParkingCardPill.module.scss';

export interface IAirportParkingCardPillProps extends React.HTMLProps<HTMLDivElement> {
    pillType: PillType;
    title: string;
    additionalClass?: string;
    icon?: JSX.Element;
}

export enum PillType {
    FreeCancellation = 'FreeCancellation',
    ParkingType = 'ParkingType',
}

export const AirportParkingCardPill: FunctionComponent<IAirportParkingCardPillProps> = ({
    pillType,
    title,
    icon,
    additionalClass,
    ...props
}) => {
    const classes = classNames(
        styles.container,
        {
            [styles.freeCancellation]: pillType === PillType.FreeCancellation,
        },
        additionalClass,
    );

    return (
        <div className={classes} {...props}>
            {icon}
            <p>{title}</p>
        </div>
    );
};

export default AirportParkingCardPill;
