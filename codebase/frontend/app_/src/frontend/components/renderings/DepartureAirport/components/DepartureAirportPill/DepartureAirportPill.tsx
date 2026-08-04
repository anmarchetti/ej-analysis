import { FC } from 'react';

import Button from 'frontend/components/common/Button';
import Cross from 'frontend/components/icons-new/Cross';

import styles from './DepartureAirportPill.module.scss';

export interface IDepartureAirportPillProps {
    ariaLabel: string;
    dataTid: string;
    name: string;
    onClick: () => void;
}

export const DepartureAirportPill: FC<IDepartureAirportPillProps> = ({ dataTid, name, onClick, ariaLabel }) => (
    <span data-tid={dataTid} className={styles.item}>
        {name}

        <Button
            onClick={onClick}
            isText
            className={styles.button}
            dataTid='remove-airport-button'
            aria-label={ariaLabel}
        >
            <Cross />
        </Button>
    </span>
);

export default DepartureAirportPill;
