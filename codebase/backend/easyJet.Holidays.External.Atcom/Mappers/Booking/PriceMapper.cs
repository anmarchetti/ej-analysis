using easyJet.Holidays.Api.Domain.Data.AmendBooking.Payment;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Services.Authentication.TradeAgent;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Domain.Utils;
using easyJet.Holidays.External.Atcom.Models.Internal;
using Force.DeepCloner;
using Microsoft.Extensions.Options;
using System.Globalization;

namespace easyJet.Holidays.External.Atcom.Mappers.Booking
{
    public class PriceMapper
    {
        public const string DefaultCategoryCode = "Holiday";
        private const string FreeChildPlaceCategoryCode = "Kids";

        public const string AtcomAllowString = "ALOW";

        private readonly AtcomSettings _atcomSettings;
        private readonly ApiSettings _apiSettings;
        private readonly ITradeAgentAuthenticationService _tradeAgentAuthService;

        private List<string> _creditPaymentCodes;
        private List<string> _giftCardPaymentCodes;
        private List<string> _goodwillPaymentCodes;
        private List<string> _promoCreditPaymentCodes;
        private List<string> _oneTimeUseCreditPaymentCodes;

        public PriceMapper(IOptions<AtcomSettings> atcomSettings, IOptions<ApiSettings> apiSettings,
            ITradeAgentAuthenticationService tradeAgentAuthService)
        {
            _tradeAgentAuthService = tradeAgentAuthService;
            _atcomSettings = atcomSettings.Value ?? throw new ArgumentNullException(nameof(atcomSettings));
            _apiSettings = apiSettings.Value ?? throw new ArgumentNullException(nameof(apiSettings));

            PreparePaymentCodes();
        }

        private void PreparePaymentCodes()
        {
            List<string> ExtractAllPaymentCodes(List<PaymentCodesSettings> settings) =>
            settings.Select(x => x.Issued.Code)
                .Concat(settings.Select(x => x.Redeemed.Code))
                .ToList();

            List<PaymentCodesSettings> FilterPaymentSettingWithReasonCodes(List<PaymentCodesSettings> settings, List<string> reasonCodes) =>
                settings.Where(x => reasonCodes.Contains(x.Reason, StringComparer.OrdinalIgnoreCase)).ToList();

            var paymentSettings = _atcomSettings.PaymentCodes.Values.ToList();
            var voucherSettings = _apiSettings.Vouchers;

            // Credit means one of the non-cash payments = one of the codes from our settings
            _creditPaymentCodes = ExtractAllPaymentCodes(paymentSettings);
            // The same for gift cards and promo vouchers
            _giftCardPaymentCodes = ExtractAllPaymentCodes(FilterPaymentSettingWithReasonCodes(paymentSettings, new List<string> { voucherSettings.Types.GiftCard }));
            _goodwillPaymentCodes = ExtractAllPaymentCodes(FilterPaymentSettingWithReasonCodes(paymentSettings, new List<string> { voucherSettings.Types.Goodwill }));
            _promoCreditPaymentCodes = ExtractAllPaymentCodes(FilterPaymentSettingWithReasonCodes(paymentSettings, voucherSettings.PromoVouchers.Types));
            _oneTimeUseCreditPaymentCodes = ExtractAllPaymentCodes(FilterPaymentSettingWithReasonCodes(paymentSettings, new List<string> { voucherSettings.Types.OneTimeUse }));
        }

        public PriceCategory[] MapPriceBreakdown(Bkg_Ent bookingEntity, Dictionary<string, PriceBreakdownCategory> priceCategories)
        {
            var bookingPageCategories = (priceCategories ?? new Dictionary<string, PriceBreakdownCategory>())
                    .Where(c => c.Value.Scope.HasFlag(PriceBreakdownCategoryScope.BookingPage))
                    .ToDictionary(c => c.Key, c => c.Value);

            return MapPriceBreakdownInternal(bookingEntity, bookingPageCategories).Values.ToArray();
        }

        public PriceCategory[] MapTradeAgentPriceBreakdown(Bkg_Ent bookingEntity, Dictionary<string, PriceBreakdownCategory> priceCategories)
        {
            if (!_tradeAgentAuthService.IsLoggedInAsTradeAgent())
            {
                return null;
            }

            var tradeAgentInfoCategories = (priceCategories ?? new Dictionary<string, PriceBreakdownCategory>())
                .Where(c => c.Value.Scope.HasFlag(PriceBreakdownCategoryScope.TradeAgentInfo))
                .ToDictionary(c => c.Key, c => c.Value);

            var result = MapPriceBreakdownInternal(bookingEntity, tradeAgentInfoCategories);

            // Remove empty default category for trade agents
            if (result.TryGetValue(DefaultCategoryCode, out var value))
            {
                if (value.Amount == 0)
                {
                    result.Remove(DefaultCategoryCode);
                }
            }

            return result.Values.ToArray();
        }

        public PriceCategory[] MapExtraPriceBreakdown(
            PriceCategory[] priceBreakdown,
            ExtraPriceBreakdownSettings extraPriceBreakdownSettings,
            LuggageSettings luggageSettings,
            List<SeatMap> seatSelection,
            ExtraLuggageInfo extraLuggage,
            IList<PersonWithDetails> guests)
        {
            if (extraPriceBreakdownSettings == null || luggageSettings == null)
            {
                return null;
            }

            if (priceBreakdown.IsNullOrEmpty())
            {
                return priceBreakdown;
            }

            var seatsPrice = SeatsUtils.GetSeatsPrice(seatSelection);
            var luggagePrice = LuggageUtils.GetLuggagePrice(extraLuggage);

            var result = priceBreakdown.DeepClone().ToList();
            var defaultCategory = result.FirstOrDefault(cat => cat.Code == DefaultCategoryCode);

            bool includeLateCheckout = extraPriceBreakdownSettings.LateCheckoutPriceEnabled &&
                                       !string.IsNullOrEmpty(extraPriceBreakdownSettings.LateCheckoutCode) &&
                                       result.Any(item => item.Code == extraPriceBreakdownSettings.LateCheckoutCode);
            var lateCheckout = result.FirstOrDefault(item => item.Code == extraPriceBreakdownSettings.LateCheckoutCode);

            bool includeAirportParking = extraPriceBreakdownSettings.AirportParkingPriceEnabled &&
                                       !string.IsNullOrEmpty(extraPriceBreakdownSettings.AirportParkingPriceCode) &&
                                       result.Any(item => item.Code == extraPriceBreakdownSettings.AirportParkingPriceCode);
            var airportParking = result.FirstOrDefault(item => item.Code == extraPriceBreakdownSettings.AirportParkingPriceCode);


            var extras = new PriceCategory
            {
                Code = extraPriceBreakdownSettings.ExtrasCode,
                Name = extraPriceBreakdownSettings.ExtrasText,
                Quantity = 1,
                Subcategories = new List<PriceCategory>()
            };

            // Late checkout
            if (includeLateCheckout)
            {
                extras.Subcategories.Add(lateCheckout);
                result.Remove(lateCheckout);
            }

            // Seats
            if (extraPriceBreakdownSettings.SeatsPriceEnabled && seatsPrice != 0)
            {
                var seats = new PriceCategory
                {
                    Code = extraPriceBreakdownSettings.SeatsPriceCode,
                    Name = extraPriceBreakdownSettings.SeatsPriceText,
                    Amount = seatsPrice,
                    Quantity = 1
                };
                extras.Subcategories.Add(seats);
                if (defaultCategory != null) defaultCategory.Amount -= seatsPrice;
            }

            var lcbPrice = LuggageUtils.GetLuggagePrice(
                new ExtraLuggageInfo { Items = extraLuggage?.Items?.Where(item => item.ItemCode == luggageSettings.LargeCabinBagCode).ToList() });

            // LCB
            if (extraPriceBreakdownSettings.LargeCabinBagsPriceEnabled && lcbPrice != 0)
            {
                var lcb = new PriceCategory
                {
                    Code = extraPriceBreakdownSettings.LargeCabinBagsPriceCode,
                    Name = extraPriceBreakdownSettings.LargeCabinBagsPriceText,
                    Amount = lcbPrice,
                    Quantity = 1
                };
                extras.Subcategories.Add(lcb);
                if (defaultCategory != null) defaultCategory.Amount -= lcbPrice;
            }

            // Hold luggage + sport
            if (extraPriceBreakdownSettings.HoldLuggagePriceEnabled && luggagePrice - lcbPrice != 0)
            {
                var holdLuggagePrice = luggagePrice - lcbPrice;
                var holdLuggage = new PriceCategory
                {
                    Code = extraPriceBreakdownSettings.HoldLuggagePriceCode,
                    Name = extraPriceBreakdownSettings.HoldLuggagePriceText,
                    Amount = holdLuggagePrice,
                    Quantity = 1
                };
                extras.Subcategories.Add(holdLuggage);
                if (defaultCategory != null) defaultCategory.Amount -= holdLuggagePrice;
            }

            // Airport Parking
            if (includeAirportParking)
            {
                extras.Subcategories.Add(airportParking);
                result.Remove(airportParking);
            }

            if (!extras.Subcategories.Any())
            {
                return null;
            }

            extras.Amount = extras.Subcategories.Sum(c => c.Amount);
            result.Add(extras);
            return result.ToArray();
        }

        private Dictionary<string, PriceCategory> MapPriceBreakdownInternal(Bkg_Ent bookingEntity, Dictionary<string, PriceBreakdownCategory> priceCategories)
        {
            Summary_Price[] summaryPrices = bookingEntity?.Summary_Prices;

            if (summaryPrices == null)
            {
                return new Dictionary<string, PriceCategory>();
            }

            var lowerCaseCategories = new Dictionary<string, PriceBreakdownCategory>(priceCategories.Count);

            foreach (var priceCategory in priceCategories)
            {
                var categoryKey = priceCategory.Key.ToLowerInvariant();
                if (!lowerCaseCategories.ContainsKey(categoryKey))
                {
                    lowerCaseCategories.Add(categoryKey, priceCategory.Value);
                }
            }

            var result = new Dictionary<string, PriceCategory>();

            var holidayCmsSetting = lowerCaseCategories.FirstOrDefault(x => x.Value.Code == DefaultCategoryCode);

            var defaultPriceCategory = new PriceCategory
            {
                Amount = 0,
                Code = DefaultCategoryCode,
                Name = holidayCmsSetting.Key != null ? (holidayCmsSetting.Value.Text ?? DefaultCategoryCode) : DefaultCategoryCode,
                Quantity = 1
            };

            result.Add(DefaultCategoryCode, defaultPriceCategory);

            foreach (var price in summaryPrices)
            {
                // identify Atcom price items by Code. could be changed to Prc_Tp_Name if required
                //var key = price.Prc_Tp_Cd;
                var key = price.Prc_Tp_Name.ToLowerInvariant();

                if (!int.TryParse(price.Qty, out int quantity))
                {
                    quantity = 1;
                }

                decimal.TryParse(price.Prc.Value, CultureInfo.InvariantCulture, out decimal amount);

                decimal totalAmount = amount * quantity;

                // if this category is defined in Cms - map to it, otherwise map everything into default 'holidays'
                if (lowerCaseCategories.ContainsKey(key))
                {
                    var cmsCategory = lowerCaseCategories[key];

                    if (result.ContainsKey(cmsCategory.Code))
                    {
                        result[cmsCategory.Code].Amount += totalAmount;
                    }
                    else
                    {
                        result.Add(cmsCategory.Code, new PriceCategory
                        {
                            Code = cmsCategory.Code,
                            Name = cmsCategory.Text,
                            Amount = totalAmount,
                            Quantity = quantity,
                        });
                    }
                }
                else
                {
                    result[DefaultCategoryCode].Amount += totalAmount;
                }
            }

            if (bookingEntity.Package?.Any(p => ((Accom)p.Items?.FirstOrDefault(i => i is Accom))?.Child_Price_Reduction?.Cd == AtcomAllowString) == true && !result.ContainsKey(FreeChildPlaceCategoryCode))
            {
                var kidsCmsSettings = lowerCaseCategories.FirstOrDefault(x => x.Value.Code == FreeChildPlaceCategoryCode).Value;

                if (kidsCmsSettings != null)
                {
                    result.Add(FreeChildPlaceCategoryCode, new PriceCategory
                    {
                        Code = kidsCmsSettings.Code,
                        Name = kidsCmsSettings.Text
                    });
                }
            }

            return result;
        }

        public Currency MapCurrency(Bkg_Ent bkgEnt)
        {
            var curISO = bkgEnt?.CurISO;
            return string.IsNullOrEmpty(curISO) ? null : new Currency { Code = curISO };
        }

        public PriceInfo MapPaymentInfo(PayData[] payData, int paxCount, Currency currency, Price[] prices)
        {
            var sourceData = payData?.FirstOrDefault();
            if (sourceData == null)
            {
                return new PriceInfo
                {
                    PaymentHistory = Array.Empty<PaymentHistoryItem>()
                };
            }

            var dpt = sourceData.Dpt?.FirstOrDefault(x => x != null && x.TypeSpecified && x.Type == DptType.LOW);

            decimal.TryParse(dpt?.Amt, CultureInfo.InvariantCulture, out decimal depositAmount);
            decimal.TryParse(sourceData.Tot_Amt, CultureInfo.InvariantCulture, out decimal totalAmount);
            decimal.TryParse(sourceData.Avg_Amt, CultureInfo.InvariantCulture, out decimal perPersonAmount);
            decimal.TryParse(sourceData.Bkg_Prc_Inc?.FirstOrDefault()?.Bal_Due_Amt, CultureInfo.InvariantCulture, out decimal balanceDueAmount);
            decimal.TryParse(sourceData.Comm_Inc_VAT, CultureInfo.InvariantCulture, out decimal commissionIncludingVat);
            decimal.TryParse(sourceData.Agt_Com, CultureInfo.InvariantCulture, out decimal agentComission);
            decimal.TryParse(sourceData.Bkg_Prc_Inc?.FirstOrDefault()?.Amt, CultureInfo.InvariantCulture, out decimal bookingPriceInc);
            decimal.TryParse(sourceData.Bkg_Prc_Ex?.FirstOrDefault()?.Amt, CultureInfo.InvariantCulture, out decimal bookingPriceEx);
            decimal.TryParse(sourceData.Payment_Received?.FirstOrDefault(), CultureInfo.InvariantCulture, out decimal paymentReceived);

            static int PaxCount(int i)
            {
                return i != 0 ? i : 1;
            }

            return new PriceInfo()

            {
                DepositPrice = depositAmount,
                TotalPrice = totalAmount,
                PricePP = perPersonAmount != decimal.Zero ?
                    // use Atcom perPerson calculations
                    perPersonAmount :
                    // fallback to ours if no value in Atcom
                    totalAmount / PaxCount(paxCount),
                AmendmentFeesItems = MapAmendmentFeeInfoItems(prices),
                BookingPriceInc = bookingPriceInc,
                BookingPriceEx = bookingPriceEx,

                BalanceDueAmount = balanceDueAmount,
                BalanceDueDate = DateFormatUtils.Parse(sourceData.Bkg_Prc_Inc?.FirstOrDefault()?.Bal_Due_Dt),
                DepositDueDate = DateFormatUtils.Parse(dpt?.Dep_Dt),

                CommissionIncludingVAT = commissionIncludingVat,
                AgentComission = agentComission,
                Currency = currency?.Code,
                PaymentReceived = paymentReceived,
                PaymentHistory = sourceData.Pay?.Where(x => x is not null).Select(pay =>
                {
                    decimal.TryParse(pay.Amt, CultureInfo.InvariantCulture, out decimal paymentAmount);

                    PaymentCard paymentCard = null;
                    var ccPay = pay.Item as CCPay;
                    if (ccPay != null)
                    {
                        paymentCard = new PaymentCard
                        {
                            Type = ccPay.CCType,
                            Code = ccPay.Card_Cd,
                            Number = ccPay.CNum,
                            ExpDate = ccPay.ExpDate,
                            IsLoyaltyCard = ccPay.Is_Loyalty_Card
                        };
                    }

                    decimal? refundableAmount = null;
                    if (decimal.TryParse(pay.Bal_Refund_Amt, CultureInfo.InvariantCulture, out var parsedAmount))
                        refundableAmount = parsedAmount;

                    return new PaymentHistoryItem
                    {
                        Amount = paymentAmount,
                        IsCredit = _creditPaymentCodes.Contains(pay.Pay_Method?.Code),
                        IsGiftCardCredit = _giftCardPaymentCodes.Contains(pay.Pay_Method?.Code),
                        IsGoodWill = _goodwillPaymentCodes.Contains(pay.Pay_Method?.Code),
                        IsPromoCredit = _promoCreditPaymentCodes.Contains(pay.Pay_Method?.Code),
                        IsOneTimeUseCredit = _oneTimeUseCreditPaymentCodes.Contains(pay.Pay_Method?.Code),
                        PayMethodCode = pay.Pay_Method?.Code,
                        PaymentDate = pay.PayDtTm,
                        Card = paymentCard,
                        AuthCode = pay?.AuthCode,
                        CurIso = currency?.Code,
                        TransNo = pay?.TransNo,
                        PayDetails = pay?.PayDetails,
                        AuthSys = pay?.AuthSys,
                        PayDtTm = pay?.PayDtTm,
                        PayId = pay?.Pay_Id,
                        RefundAgainstId = pay?.Refund_Against_Id,
                        RefundableAmount = refundableAmount
                    };
                }).ToArray() ?? Array.Empty<PaymentHistoryItem>()
            };
        }

        /// <summary>
        /// Map the amendment fee info items.
        /// </summary>
        /// <param name="prices"></param>
        /// <returns></returns>
        public virtual FeeItem[] MapAmendmentFeeInfoItems(Price[] prices)
        {
            var result = prices?.Where(price=> string.Equals(price.Prc_Cd_Tp, _atcomSettings.PricesTypeCode.Fees, StringComparison.Ordinal)).Select(price => new FeeItem
            {
                Amount = Convert.ToDecimal(price.Prc.Value, CultureInfo.InvariantCulture),
                Code = price.Prc_Cd,
                Name = price.Prc_Cd_Name,
                Type = price.Prc_Cd_Tp,
                PaxId = int.Parse(price.PricePaxs[0], CultureInfo.InvariantCulture),
                Date = price.Prc_Dt,
                Count = Convert.ToInt32(price.Qty, CultureInfo.InvariantCulture),
                Currency = price.Prc.CurISO
            }).ToArray() ?? Array.Empty<FeeItem>();

            return result;
        }

        /// <summary>
        /// Map the taxes and fees from the Rm_Cd array.
        /// </summary>
        /// <param name="rmCds"></param>
        /// <returns></returns>
        public virtual TaxesAndFees[] MapTaxesAndFees(Rm_Cd[] rmCds)
        {
            if (rmCds.IsNullOrEmpty())
            {
                return [];
            }

            static decimal ParseDecimal(string value) =>
                decimal.TryParse(value, NumberStyles.Any, CultureInfo.InvariantCulture, out var parsed) ? parsed : decimal.Zero;

            var taxes = rmCds
                .Select(rm => rm?.Info_Prices?.Info_Price)
                .Where(infoPrice => infoPrice != null)
                .Select(infoPrice => new TaxesAndFees
                {
                    ExchangeRate = ParseDecimal(infoPrice!.Exch_Rate),
                    PaylocalAmount = ParseDecimal(infoPrice.Prc?.AmountOrValue),
                    PaylocalAmountCurrency = infoPrice.Prc?.CurrencyOrDefault,
                    PaylocalAmountConverted = ParseDecimal(infoPrice.Est_Prc?.Value),
                    PaylocalAmountConvertedCurrency = infoPrice.Est_Prc?.CurISO,
                    Quantity = ParseDecimal(infoPrice.Qty)
                });

            return [.. taxes
                .GroupBy(tax => tax.PaylocalAmountCurrency)
                .Select(group => new TaxesAndFees
                {
                    ExchangeRate = group.First().ExchangeRate,
                    PaylocalAmount = group.Sum(tax => tax.PaylocalAmount * tax.Quantity),
                    PaylocalAmountCurrency = group.Key,
                    PaylocalAmountPPConverted = group.First().PaylocalAmountConverted,
                    PaylocalAmountConverted = group.Sum(tax => tax.PaylocalAmountConverted * tax.Quantity),
                    PaylocalAmountConvertedCurrency = group.First().PaylocalAmountConvertedCurrency,
                })];
        }
    }
}
