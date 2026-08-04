using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Hotels;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.Transfers;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Interfaces.Hotels;
using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Domain.Utils;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.Api.Domain.Services.Transfers
{
    /// <summary>
    /// Transfers service
    /// </summary>
    public class TransfersService : ITransferService
    {
        private IItemSearchService _itemSearchService;
        private readonly AtcomSettings _atcomSettings;
        private IReferenceDataService _referenceDataService;
        private readonly IReferenceDataProvider _referenceDataProvider;
        private readonly IHotelsService _hotelsService;
        private readonly ITransfersFilterService _transfersFilterService;
        private readonly ILanguageService _languageService;

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="itemSearchService"></param>
        /// <param name="atcomSettings"></param>
        /// <param name="referenceDataService"></param>
        /// <param name="hotelsService"></param>
        public TransfersService(
            IItemSearchService itemSearchService, IOptions<AtcomSettings> atcomSettings,
            IReferenceDataService referenceDataService, IReferenceDataProvider referenceDataProvider,
            ITransfersFilterService transfersFilterService,
            IHotelsService hotelsService,
            ILanguageService languageService)
        {
            _atcomSettings = atcomSettings.Value ?? throw new ArgumentNullException(nameof(atcomSettings));
            _itemSearchService = itemSearchService;
            _referenceDataService = referenceDataService;
            _referenceDataProvider = referenceDataProvider;
            _hotelsService = hotelsService;
            _transfersFilterService = transfersFilterService;
            _languageService = languageService;
        }

        /// <inheritdoc />
        public async Task<IEnumerable<TransferItem>> BuildTransfers(Offer offer, bool silenceTransferError = false)
        {
            var reqTransfers = offer.Transfers;
            if (reqTransfers == null || !reqTransfers.Any())
            {
                return offer.Transfers ?? new List<TransferItem>();
            }

            // Check base properties (which we use later for InforBookingRequest) to decide whether we need to send ItemSearchRequest or we can use data from request
            var hasNotFilledTransfers = reqTransfers.Any(t => string.IsNullOrEmpty(t.Prom)
                || string.IsNullOrEmpty(t.RateRule)
                || string.IsNullOrEmpty(t.TypeCode)
                || string.IsNullOrEmpty(t.SetType)
            );

            if (!hasNotFilledTransfers && !_transfersFilterService.ShouldDisableTransfer(offer))
            {
                return reqTransfers;
            }

            var transferQtyByCode = reqTransfers.GroupBy(x => x.Code).ToDictionary(pair => pair.Key, val => val.First().Quantity);
            var transferCodes = transferQtyByCode.Keys.Select(x => x);

            var foundTransfers = await GetAll(offer);
            var bookingTransfers = foundTransfers.Where(x => transferCodes?.Contains(x.Code) != false);
            foundTransfers = _transfersFilterService.FilterBookingTransfers(foundTransfers, offer, transferCodes);

            if (bookingTransfers.FirstOrDefault()?.Code != foundTransfers.FirstOrDefault()?.Code && !silenceTransferError)
            {
                // Trow Unavailable Transfer error if ther is less then 24h left to departure date.
                throw new ApiException(ApiExceptionCodes.BookingTransfersUnavailalbe);
            }

            return foundTransfers;
        }

        /// <inheritdoc />
        public async Task<IEnumerable<TransferItem>> GetAll(Offer offer, IEnumerable<TransferItem> transferItems = null)
        {
            // Get items from arguments or from DB, then do everything to get non-null value 
            var transfers = (transferItems ?? (await _itemSearchService.GetExtras(offer))?.Transfers?.ToList())?.ToList() ?? new List<TransferItem>();
            TransferItem defaultTransfer = null;

            if (!string.IsNullOrEmpty(offer.DefaultTransferCode))
            {
                // We have 2 default options: shared and private. Need to get rid of one of them based on DefaultTransferCode                
                var transferCode = TransfersServiceUtils.GetTransferCode(offer.DefaultTransferCode);

                // Decide which transfer should be remove
                if (_atcomSettings.Transfers.NoTransferCodesToIgnore.TryGetValue(transferCode, out var transferCodeToIgnore))
                {
                    transfers = transfers.Where(t => TransfersServiceUtils.GetTransferCode(t.Code) != transferCodeToIgnore).ToList();
                }
                defaultTransfer = transfers.FirstOrDefault(x => x.Code == offer.DefaultTransferCode);
            }
            else
            {
                // If transfer doesn't have default code then we should get rid of all "NO_TRANSFER" items 
                transfers = transfers.Where(t => t.Type != TransferItemType.NoTransfer).ToList();
            }

            if (defaultTransfer != null)
            {
                transfers = transfers.Where(x => x.Price >= defaultTransfer.Price).ToList();
            }

            // If there is no "NO_TRANSFER" we should create synthetic one
            if (!transfers.Any(x => x.Type == TransferItemType.NoTransfer))
            {
                // If there is no "NO_TRANSFER" we should create synthetic one
                transfers.Add(TransfersServiceUtils.BuildSyntaticTransfer(
                    _atcomSettings.Transfers.Types.SyntheticNoTransfer,
                    _atcomSettings.Transfers.Types.DefaultNoTransferCode));
            }

            // Disable transfers if neccessary
            transfers = _transfersFilterService.FilterBookingTransfers(transfers, offer, null).ToList();

            SetQuantityAndPrice(offer, transfers);

            // Name, IconUrl, Content
            await EnrichCmsData(offer, transfers);

            return transfers;
        }

        /// <inheritdoc />
        public async Task<IEnumerable<TransferItem>> GetAll(Offer offer, string hotelPromoCodeType)
        {
            var transfers = (await _itemSearchService.GetExtras(offer))?.Transfers ?? Enumerable.Empty<TransferItem>();

            var defaultTransferTypeForHotel =
                _atcomSettings
                    .Transfers
                    .DefaultTransferHotels
                    .FirstOrDefault(dict => dict.Value.Any(x => x.Contains(hotelPromoCodeType)))
                    .Key;

            var defaultTransferCode = string.Empty;

            if (Enum.TryParse(defaultTransferTypeForHotel, out TransferItemType transferItemType))
            {
                defaultTransferCode = transferItemType switch
                {
                    TransferItemType.Private => GetDefaultTransferCode(transfers, _atcomSettings.Transfers.Types.Private),
                    TransferItemType.Shared => GetDefaultTransferCode(transfers, _atcomSettings.Transfers.Types.Shared) ?? GetDefaultTransferCode(transfers, _atcomSettings.Transfers.Types.Private),
                    _ => string.Empty
                };
            }

            offer.DefaultTransferCode = defaultTransferCode;

            transfers = await GetAll(offer, transfers);

            return transfers;
        }

        /// <inheritdoc />
        public async Task<string> GetContent(string transferCode, DateTimeOffset depDate, string airportCode, string accomCode)
        {
            var transfers = new List<TransferItem> { new TransferItem {
                Code = transferCode
            } };

            var hotelTransfers = await GetAllHotelTransfers(accomCode);

            var resultContent = string.Empty;
            await TransfersServiceUtils.ProcessCmsContent(transfers, depDate, airportCode, hotelTransfers, _referenceDataService, (t, found, content) =>
            {
                resultContent = content;
            });

            return resultContent;
        }

        /// <inheritdoc />
        public Task<TransferInfo> GetTransferInfoByProductId(string productId, string languageCode)
        {
            return _referenceDataProvider.GetTransferInfoByProductId(productId, languageCode);
        }

        /// <inheritdoc />
        public async Task EnrichWithTransferInfo(IList<TransferItem> transfers, string languageCode)
        {
            var tasks = transfers.Select(async item =>
            {
                if (item.ProductId != null && item.Type != TransferItemType.NoTransfer)
                {
                    TransferInfo transferInfo = await GetTransferInfoByProductId(item.ProductId, languageCode);
                    item.TransferInfo = transferInfo;
                }

            }).ToArray();

            await Task.WhenAll(tasks);
        }

        /// <inheritdoc />
        public async Task EnrichTransferWithCmsInfo(IList<Offer> offers)
        {
            ArgumentNullException.ThrowIfNull(offers);

            var accomIds = offers.Select(offer => offer.Accom.Code).ToArray();
            var hotelTransferData = (await _hotelsService.GetHotelTransfers(accomIds)).SelectMany(x => x).ToList();
            foreach (var offer in offers)
            {
                await TransfersServiceUtils.EnrichCmsData(offer.Transfers, offer.Transport, hotelTransferData, _referenceDataService);
            }
        }

        /// <inheritdoc />
        public async Task EnrichTransferWithCmsInfo(string accomCode, Transport transport, IList<TransferItem> transfers)
        {
            var languageCode = _languageService.GetCurrentLanguage();
            var hotelTransfers = await GetAllHotelTransfers(accomCode);

            await TransfersServiceUtils.EnrichCmsData(transfers, transport, hotelTransfers, _referenceDataService);

            await EnrichWithTransferInfo(transfers, languageCode);
        }

        /// <summary>
        /// Enrich transfer items with content from CMS
        /// </summary>
        /// <param name="offer">Offer item</param>
        /// <param name="transfers">Transfers</param>
        private async Task EnrichCmsData(Offer offer, List<TransferItem> transfers)
        {
            await EnrichTransferWithCmsInfo(offer.Accom.Code, offer.Transport, transfers);
        }

        /// <summary>
        /// Enrich transfer items with content from CMS
        /// </summary>
        /// <param name="accomCode">Accommodation code</param>
        private async Task<IEnumerable<HotelTransfer>> GetAllHotelTransfers(string accomCode)
        {
            var hotelTransfers = await _hotelsService.GetHotelTransfers(new[] { accomCode });
            return hotelTransfers?.SelectMany(x => x);
        }

        /// <summary>
        /// Calculate how many items we need and total price based on transfer types
        /// </summary>
        /// <param name="offer"></param>
        /// <param name="transfers"></param>
        private void SetQuantityAndPrice(Offer offer, List<TransferItem> transfers)
        {
            transfers.ForEach(t =>
            {
                // calculate price/qnt based on quantity and pricing type: per item/per person
                if (t.Method == ItemMethod.PI)
                {
                    var totalPaxs = offer.Accom.Unit.Sum(u => u.Occupation.Adults + u.Occupation.Children + u.Occupation.Infants);
                    var itemsCount = (int)Math.Ceiling((double)totalPaxs / t.MaxPax);
                    t.Quantity = itemsCount;
                    t.Price = t.Price * itemsCount;
                    t.Currency = offer.Currency;
                }
                else
                {
                    var totalPaxs = offer.Accom.Unit.Sum(u => u.Occupation.Adults + u.Occupation.Children);
                    t.Quantity = totalPaxs;
                    t.Price = t.Price * totalPaxs;
                    t.Currency = offer.Currency;
                }
            });
        }

        /// <summary>
        /// Get code for default transfer.
        /// </summary>
        /// <param name="transfers">All booking transfers.</param>
        /// <param name="transferTypes">Transfer codes for specific transfer type.</param>
        /// <returns>Default transfer code.(e.g. XXXX999999XX)</returns>
        private string GetDefaultTransferCode(IEnumerable<TransferItem> transfers, List<string> transferTypes)
        {
            var defaulTransferCode = transfers
                .FirstOrDefault(x =>
                    transferTypes.Contains(TransfersServiceUtils.GetTransferCode(x.Code)))
                ?.Code;

            return defaulTransferCode;
        }

        /// <inheritdoc />
        public Task<List<Data.Hotels.HotelTransfer>> GetAllTransfers(string languageCode)
        {
            return _referenceDataProvider.GetAllTransfers(languageCode);
        }
    }
}
