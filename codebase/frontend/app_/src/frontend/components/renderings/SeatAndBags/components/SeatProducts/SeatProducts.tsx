import { groupArrayByKey } from 'frontend/utils/array.utils';
import { withValue } from 'frontend/utils/expEditor.utils';
import { ISeatProduct } from 'models/data/ISeatMapStore';
import SeatBag from 'frontend/components/renderings/SeatAndBags/components/SeatBag';

import styles from './SeatProducts.module.scss';

interface ISeatProductsProps {
    products: Nullable<ISeatProduct[]>;
}

const SeatProducts = ({ products }: ISeatProductsProps) => {
    if (!products?.length) {
        return null;
    }

    const productsGroupsById = Object.values(groupArrayByKey(products, 'id'));

    return (
        <div className={styles.seatProducts}>
            {productsGroupsById.map(groups => {
                const group = groups[0];

                return (
                    <SeatBag
                        key={group.id}
                        count={groups.length}
                        icon={withValue({ src: group.icon || '' })}
                        text={group.name}
                    />
                );
            })}
        </div>
    );
};

export default SeatProducts;
