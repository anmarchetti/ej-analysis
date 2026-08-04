import { IFeesProduct } from 'models/data/tracking/IProduct';
import { EventTypes } from 'models/enum/tracking/EventTypes';

export const mockFeesTrackingProduct: IFeesProduct = {
    category: 'Fee category',
    dimension108: EventTypes.Purchase,
    id: 'Fee product ID',
    name: 'Fee product Name',
    price: 25,
    quantity: 2,
};
