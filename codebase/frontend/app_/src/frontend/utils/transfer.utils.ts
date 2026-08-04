import { ILivePrice } from 'models/data/ILivePrice';
import { IOffer } from 'models/data/IOffer';
import { ITransfer } from 'models/data/ITransfer';
import { TransferType } from 'models/enum/transfer/TransferType';

export const isTransferHidden = (transfers: Nullable<ITransfer[]>): boolean | undefined =>
    transfers?.some(x => x?.isHidden);

export const getNoTransfer = (alternativeTransfers: ITransfer[]): ITransfer | undefined =>
    alternativeTransfers.find(el => el.type === TransferType.NoTransfer);

export const getTransferFromLivePriceAndOffer = (livePrice: Nullable<ILivePrice>, offer: IOffer): Nullable<ITransfer> =>
    livePrice?.transfers?.[0] ?? offer.transfers?.[0] ?? null;
