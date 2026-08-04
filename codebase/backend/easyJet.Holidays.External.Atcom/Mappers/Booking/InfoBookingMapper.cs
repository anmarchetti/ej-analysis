using easyJet.Holidays.Api.Domain.Data.AirportParking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Utils;
using easyJet.Holidays.External.Atcom.Mappers.Guests;
using easyJet.Holidays.External.Atcom.Mappers.Utils;
using easyJet.Holidays.External.Atcom.Models.Internal;
using easyJet.Holidays.External.Domain.Utils;
using System.Globalization;
using KeyValuePair = easyJet.Holidays.External.Atcom.Models.Internal.KeyValuePair;
using Type = easyJet.Holidays.External.Atcom.Models.Internal.Type;

namespace easyJet.Holidays.External.Atcom.Mappers.Booking;

public class InfoBookingMapper
{
    private readonly PriceMapper _priceMapper;
    private readonly RequestBookingMapper _requestBookingMapper;
    private readonly ExtraLuggageMapper _extraLuggageMapper;

    /// <summary>
    /// extra items need to reference accommodation section as parent
    /// </summary>
    public const string AccommodationSectionId = "1";

    public InfoBookingMapper(PriceMapper priceMapper, RequestBookingMapper requestBookingMapper, ExtraLuggageMapper extraLuggageMapper)
    {
        _priceMapper = priceMapper;
        _requestBookingMapper = requestBookingMapper;
        _extraLuggageMapper = extraLuggageMapper;
    }

    /// <summary>
    /// Set sector ID for a route from seat selection data
    /// </summary>
    /// <param name="route"></param>
    /// <param name="seatSelection"></param>
    private static void SetRouteSectorFromSeatSelection(Route route, List<SeatMap> seatSelection)
    {
        if (route == null || seatSelection == null || !string.IsNullOrWhiteSpace(route.SectorId))
        {
            return;
        }

        var correspondingSeatMap = seatSelection.FirstOrDefault(seatMap => seatMap.FlightNumber == route.FlightNumberWithoutCar);

        if (correspondingSeatMap != null)
        {
            route.SectorId = correspondingSeatMap.SectorId;
        }
    }

    /// <summary>
    /// Map search request to Atcom request
    /// </summary>
    /// <param name="request"></param>
    /// <returns></returns>
    public static InfoBookingRequest BuildInfoBookingRequest(ValidateBookingRequest request, CltInfo cltInfo, string internalFlightPromotionCode, string atcomLang)
    {
        var offer = request.Offer;
        var guests = request.Guests;

        var accom = offer.Accom;
        var accomUnit = accom.Unit;
        var outFlight = offer.Transport.Routes[0];
        var inFlight = offer.Transport.Routes[1];

        // Set sector ids for flights from seat selection data if it contains them
        SetRouteSectorFromSeatSelection(outFlight, request.SeatSelection);
        SetRouteSectorFromSeatSelection(inFlight, request.SeatSelection);

        // Pax ids order should be : adults, children, infants
        var orderedGuests = GuestUtils.SortGuests(guests, x => x.Type);

        // Prepare request parts
        var allPaxs = orderedGuests.Select((x, idx) => new SubServPax
        {
            Pax_Id = (idx + 1).ToString()
        }).ToArray();

        var pax = orderedGuests.Select((x, idx) => new Pax
        {
            Index = (idx + 1).ToString(),
            Lead_Pax = idx == 0,
            Lead_PaxSpecified = idx == 0,
            Age = x.Age.ToString(),
            Pax_Tp = GuestsMapper.MapType(x.Type),
            Pax_TpSpecified = true,
            Person = new Models.Internal.Person
            {
                Sex = GuestsMapper.MapSex(x.Sex),
                SexSpecified = true,
            }
        }).ToArray();

        var withExternalFlights = outFlight.IsExternal; // Validate if at least one flight is external (all flights should be the same)

        // Extra items
        var items = new List<Item>(BuildExtrasItems(offer?.Transfers, orderedGuests));

        if (offer.LateRoomCheckout != null)
        {
            items.AddRange(BuildExtrasItems(new List<LateRoomCheckoutItem> { offer?.LateRoomCheckout }, orderedGuests));
        }

        if(request.AirportParking != null)
            items.Add(BuildAirportParkingItem(request.AirportParking));

        var infoBookingRequest = new InfoBookingRequest()
        {
            Adm = VrpRequestUtils.BuildAdm(),
            CltInfo = cltInfo,
            Inc_AutoSelectedItems = withExternalFlights, // "true" if there are ext flights

            BkgSts = BkgSts.BOOKING,
            BkgStsSpecified = true,
            Bkg_Ent = new Bkg_Ent
            {
                Package = new[] {
                    new Package
                    {
                        Items = new object[] {
                            new Models.Internal.Accom {
                                Id = AccommodationSectionId,
                                St_Dt =  DateFormatUtils.DateOnly(accom.Date),
                                End_Dt = DateFormatUtils.DateOnly(accom.Date.AddDays(accom.Stay)),
                                HtlPrd = new HtlPrd {
                                    Prom = new Prom {
                                        Code = accom.Prom
                                    },
                                    Acc_Cd = accom.Code,
                                    Acc_InvStateSpecified = true,
                                    Acc_InvState = accom.IsExternal ? Acc_InvState.EXTERNAL : Acc_InvState.INTERNAL
                                },
                                Child_Price_Reduction = accomUnit.Any(u => u.FreeForKids) ? new Child_Price_Reduction
                                {
                                    Cd = PriceMapper.AtcomAllowString
                                } : null,
                                Rm_Cd = accomUnit.Select((unit, idx) => new Rm_Cd
                                {
                                    Rm_No = (idx + 1).ToString(),
                                    Code = unit.Code,
                                    BB_Cd = unit.Board,
                                    Ext_Rm_Cd = unit.ExternalRoomCode,
                                    Ext_BB_Cd = unit.ExternalBoardCode,
                                    Ser_Sts = new[] { Ser_Sts.FIX},
                                    SubServPaxs = unit?.Occupation?.PaxIds?.Select(paxId => new SubServPax {
                                        Pax_Id = paxId.ToString(),
                                    })?.ToArray()
                                }).ToArray()
                            }
                        },
                        Route_List = new[] {
                            new Routing{
                                Routing_Id = "1",
                                ItemsElementName = new[] { ItemsChoiceType.Route, ItemsChoiceType.Route},
                                Items = new object[] {
                                    // Flight Promotion for the internal flights should be from settings
                                    RouteMapper.BuildRoute(outFlight,  outFlight.IsExternal ? accom.Prom : internalFlightPromotionCode, allPaxs, true),
                                    RouteMapper.BuildRoute(inFlight, inFlight.IsExternal ? accom.Prom : internalFlightPromotionCode, allPaxs, false),
                                }
                            }
                        }
                    }
                },
                Item = items.ToArray(),
                Seat_Map = SeatsMapper.GetAtcomSeatMap(request.SeatSelection, request.Guests),
                Flt_Extra_Cat_List = ExtraLuggageMapper.MapToAtcomModel(request.ExtraLuggageInfo, offer.Transport.Routes)
            },
            Pax = pax,
            Disc_Code = request.DiscountCode?.ToUpperInvariant(),
            TrvDox = new TrvDox { DoxLang = atcomLang }
        };

        return infoBookingRequest;
    }

    public async Task<ValidateBookingResponse> Map(Models.InfoBooking.InfoBookingResponse bookingInfoResponse, PriceBreakdownResponse priceBreakdownResponse)
    {
        var body = bookingInfoResponse.Payload.Body;

        // here potentially we will include more info into validate-package response if required
        // We pass null as benefits data because InfoBookingResponse doesn't have any benefits, we pull them from B2B later
        var package = await _requestBookingMapper.MapResponse(body, priceBreakdownResponse, null);

        var firstOutboundFlightId = package.Package?.Transport?.Routes?.FirstOrDefault(r => r.Direction == Direction.Outbound)?.Id;
        var currency = _priceMapper.MapCurrency(body.Bkg_Ent);

        return new ValidateBookingResponse
        {
            SessionId = body.Adm.SessId,
            RequestId = body.Adm.ReqId,
            ResultStatus = body.ResSts.ToString(),
            DiscountCode = body.Prom?.Code,
            Currency = package.Currency,
            MarketCode = package.MarketCode,
            Accom = package.Package?.Accom,
            Guests = package.Guests,

            BookingReference = body.BkgNum?.BkgId,
            Memos = package.Package?.Accom?.Memos,

            PriceBreakdown = _priceMapper.MapPriceBreakdown(body.Bkg_Ent, priceBreakdownResponse?.PriceCategories),
            TaxesAndFees =
            [
                .. _priceMapper.MapTaxesAndFees(
                    body.Bkg_Ent?.Package?
                        .SelectMany(p => p.Items?.OfType<Models.Internal.Accom>() ?? [])
                        .SelectMany(a => a.Rm_Cd ?? [])
                        .ToArray()
                    ?? [])
            ],
            TradeAgentPriceBreakdown = _priceMapper.MapTradeAgentPriceBreakdown(body.Bkg_Ent, priceBreakdownResponse?.PriceCategories),
            PaymentInfo = _priceMapper.MapPaymentInfo(body.PayData, body.Pax?.Where(p => p.Pax_Tp == Pax_Tp.ADULT || p.Pax_Tp == Pax_Tp.CHILD).Count() ?? 0, currency, body.Bkg_Ent?.Prices),
            ExtraLuggageInfo = await _extraLuggageMapper.MapLuggageInfo(body.Bkg_Ent.Flt_Extra_Cat_List, package.Package?.Transport?.Routes, package?.Package),
            Transfers = package.Transfers,
            LateRoomCheckout = package.LateRoomCheckout,
            ErrataInfo = package.Package?.Accom?.Memos?.Where(x => x.Code == "ERR")?.Select(x => HtmlUtils.RemoveStylesAndScripts(x.Text)).ToList(),
            SeatSelection = package.SeatSelection,
            AirportParking = MapAirportParkingResponse(body)
        };
    }

    private static AirportParkingItem MapAirportParkingResponse(InfoBookingResponse infoBookingResponse)
    {
        Item airportParkingItem = infoBookingResponse.Bkg_Ent.Item?.FirstOrDefault(x => x.Set_Type == Set_Type.AIRPORT_PARKING);

        if (airportParkingItem == null)
            return null;

        CarPark carPark = airportParkingItem.Items.OfType<CarPark>().FirstOrDefault();
        SrcData srcData = airportParkingItem.Items.OfType<SrcData>().FirstOrDefault();

        string priceAsString = srcData?.KeyValuePair.FirstOrDefault(x => x.Key == nameof(AirportParkingItem.BookingDetails.TotalPrice))?.Value;
        string keyData = srcData?.KeyValuePair.FirstOrDefault(x => string.Equals(x.Key, "KeyData", StringComparison.OrdinalIgnoreCase))?.Value;
        decimal price = Convert.ToDecimal(priceAsString, CultureInfo.InvariantCulture);

        return new AirportParkingItem
        {
            BookingDetails =  new AirportParkingBookingDetails
            {
                ProductCode = airportParkingItem.Code,
                StartDate = DateTime.Parse(airportParkingItem.St_Dt, CultureInfo.InvariantCulture),
                EndDate = DateTime.Parse(airportParkingItem.End_Dt, CultureInfo.InvariantCulture),
                StartTime = carPark?.Start_TimeStr,
                EndTime = carPark?.End_TimeStr,
                Type = (ParkingType)Enum.Parse(typeof(ParkingType), carPark?.Type.ToString() ?? string.Empty),
                TotalPrice = price,
                KeyData = keyData,
                PromotionCode = (airportParkingItem.Item1 as Prom)?.Code
            }
        };

    }

    /// <summary>
    /// Build extras items
    /// </summary>
    /// <typeparam name="T"></typeparam>
    /// <param name="items"></param>
    /// <param name="guests"></param>
    /// <param name="accomId">Link to the <Id> of the accommodation</param>
    /// <returns></returns>
    public static Item[] BuildExtrasItems<T>(IList<T> items, IEnumerable<Holidays.Api.Domain.Data.Guests.Person> guests) where T : BookingItem
    {
        if (items == null || !items.Any())
        {
            return new Item[0];
        }

        return items.Select(x =>
        {
            Enum.TryParse<Set_Type>(x.SetType, out var setType);
            Enum.TryParse<ItemRate_Rule>(x.RateRule, out var rateRule);

            var serviceStates = x.ServiceStates?.Select(s =>
            {
                Enum.TryParse<Ser_Sts>(s, out var serSts);
                return serSts;
            });

            // if item has PerBooking method it can be only one
            var quantity = x.MCMethod == MultiCentreMethod.PB ? 1 : x.Quantity;

            return new Item
            {
                Code = x.Code,
                Auto_Inc = x.AutoInclude,
                St_Dt = DateFormatUtils.DateOnly(x.StartDate),

                Set_TypeSpecified = !string.IsNullOrEmpty(x.SetType),
                Set_Type = setType,

                Item_Type = new Item_Type { Code = x.TypeCode },
                Item1 = new Prom { Code = x.Prom }, // Prom
                Bkg_Qty = quantity.ToString(),
                Ser_Sts = serviceStates?.ToArray(),

                Rate_RuleSpecified = !string.IsNullOrEmpty(x.RateRule),
                Rate_Rule = rateRule,

                Item_MethodSpecified = true,
                Item_Method = x.Method == ItemMethod.PI ? ItemItem_Method.PI : ItemItem_Method.PP,

                MC_MethodSpecified = true,
                MC_Method = x.MCMethod == MultiCentreMethod.PP ? MC_Method.PP : (x.MCMethod == MultiCentreMethod.PB ? MC_Method.PB : MC_Method.MANY),

                SubServPaxs = guests.Where(g => g.Type != PersonType.Infant)?.Select((paxId, idx) => new SubServPax
                {
                    Pax_Id = (idx + 1).ToString(),
                }).ToArray(),

                Ref_Prd_Id = AccommodationSectionId
            };
        }).ToArray();
    }

    /// <summary>
    /// Build airport parking item
    /// </summary>
    /// <param name="airportParking"></param>
    /// <returns></returns>
    public static Item BuildAirportParkingItem(AirportParkingItem airportParking)
    {
        if (airportParking == null) return new Item();
        
        return new Item
        {
            Code = airportParking.BookingDetails.ProductCode,
            St_Dt = DateFormatUtils.DateOnly(airportParking.BookingDetails.StartDate),
            End_Dt = DateFormatUtils.DateOnly(airportParking.BookingDetails.EndDate),
            Bkg_Qty = "1", // only 1 parking is allowed to book
            Set_Type =  Set_Type.AIRPORT_PARKING,
            Set_TypeSpecified = true,
            Item1 = new Prom { Code = airportParking.BookingDetails.PromotionCode },
            SubServPaxs = [ new SubServPax{ Pax_Id = "1"}],
            Item_InvState = Item_InvState.EXTERNAL,
            Items =
            [
                new CarPark
                {
                    Start_TimeStr = airportParking.BookingDetails.StartTime,
                    End_TimeStr = airportParking.BookingDetails.EndTime,
                    Type = Enum.Parse<Type>(airportParking.BookingDetails.Type.ToString()),
                    TypeSpecified = true
                },
                new SrcData
                {
                    System = "holidayextras",
                    KeyValuePair =
                    [
                        new KeyValuePair { Key = "KeyData", Value = airportParking.BookingDetails.KeyData },
                        new KeyValuePair { Key = "TotalPrice", Value = airportParking.BookingDetails.TotalPrice.ToString(CultureInfo.InvariantCulture) }
                    ]
                }
            ]
        };
    }
}