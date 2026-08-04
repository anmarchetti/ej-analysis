import { FC } from 'react';

import styles from './CustomerCard.module.scss';

export interface ICustomerCardFields {
    customerName: string;
    description: string;
}
const CustomerCard: FC<ICustomerCardFields> = ({ customerName, description }) => (
    <div className={styles.customerCard} data-tid='customer-card'>
        <div className={styles.customerName}>{customerName}</div>
        <div className={styles.description}>{description}</div>
    </div>
);

export default CustomerCard;
