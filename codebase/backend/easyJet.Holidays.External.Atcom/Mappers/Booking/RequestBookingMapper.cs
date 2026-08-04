using easyJet.Holidays.Api.Domain.Constants;
using easyJet.Holidays.Api.Domain.Data.AirportParking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.ReferenceData;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Domain.Utils;
using easyJet.Holidays.External.Atcom.Mappers.Guests;
using easyJet.Holidays.External.Atcom.Mappers.Utils;
using easyJet.Holidays.External.Atcom.Models.Internal;
using easyJet.Holidays.External.Atcom.Services;
using easyJet.Holidays.External.Domain.Utils;
using Microsoft.Extensions.Options;
using System.Globalization;
using BookingResponse = easyJet.Holidays.Api.Domain.Data.Booking.BookingResponse;

namespace easyJet.Holidays.External.Atcom.Mappers.Booking
{
    public class RequestBookingMapper
    {
        private readonly AtcomSettings _atcomSettings;
        private readonly PriceMapper _priceMapper;
        private readonly SeatsMapper _seatsMapper;
        private readonly AtcomRequestGenerator _atcomRequestGenerator;
        private readonly LanguageSettings _languageSettings;
        private readonly ExtraLuggageMapper _extraLuggageMapper;
        private readonly IGuestsMapper _guestsMapper;

        public RequestBookingMapper(
            IOptions<AtcomSettings> atcomSettings,
            PriceMapper priceMapper,
            SeatsMapper seatsMapper,
            AtcomRequestGenerator atcomRequestGenerator,
            IOptions<LanguageSettings> languageSettings,
            ExtraLuggageMapper extraLuggageMapper,
            IGuestsMapper guestsMapper)
        {
            _atcomSettings = atcomSettings.Value ?? throw new ArgumentNullException(nameof(atcomSettings));
            _priceMapper = priceMapper;
            _seatsMapper = seatsMapper;
            _atcomRequestGenerator = atcomRequestGenerator;
            _extraLuggageMapper = extraLuggageMapper;
            _languageSettings = languageSettings.Value;
            _guestsMapper = guestsMapper;
        }

        /// map between
        ///     easyJet.Holidays.External.Atcom.Models.Booking
        /// and
        ///     easyJet.Holidays.Api.Domain.Data.Booking
        ///
        public static Models.Booking.BookingRequest MapCreateWithoutPayment(
            LeadPassenger leadPassenger,
            CltInfo cltInfo,
            string sessionId, string requestId, string customerID, string atcomLang)
        {
            var bookingRequest = new Models.Booking.BookingRequest();

            Cus cus = string.IsNullOrWhiteSpace(customerID) ? null : new Cus
            {
                CusId = customerID,
            };

            bookingRequest.Payload.Body = new Models.Internal.BookingRequest
            {
                Cus = cus,
                Adm = VrpRequestUtils.BuildAdm(),
                CltInfo = cltInfo,
                CusDet = new[]
                {
                    new CusDet()
                    {
                        Person = GuestsMapper.MapLeadPassenger(leadPassenger)
                    }
                },
                TrvDox = new TrvDox { DoxLang = atcomLang }
            };

            bookingRequest.Payload.Body.Adm.SessId = sessionId;
            bookingRequest.Payload.Body.Adm.ReqId = requestId;

            return bookingRequest;
        }

        /// <summary>
        /// Display booking request
        /// </summary>
        /// <param name="cltInfo">client info</param>
        /// <param name="bookingReference">booking reference</param>
        /// <param name="version"></param>
        /// <returns></returns>
        public static Models.Booking.DisplayBookingRequest MapDisplay(CltInfo cltInfo, string bookingReference, string version = null)
        {
            var bookingRequest = new Models.Booking.DisplayBookingRequest();

            bookingRequest.Payload.Body = new DisplayRequest
            {
                Adm = VrpRequestUtils.BuildAdm(),
                CltInfo = cltInfo
            };

            bookingRequest.Payload.Body.BkgNum = new BkgNum
            {
                BkgId = bookingReference
            };

            if (!string.IsNullOrWhiteSpace(version))
            {
                bookingRequest.Payload.Body.BkgNum.CurrentVersion = version;
            }


            return bookingRequest;
        }

        /// <summary>
        /// Display booking request
        /// </summary>
        /// <param name="cltInfo">client info</param>
        /// <param name="bookingReference">booking reference</param>
        /// <returns></returns>
        public static Models.Booking.BookingSearchRequest MapSearch(CltInfo cltInfo, string customerId)
        {
            var bookingRequest = new Models.Booking.BookingSearchRequest();

            bookingRequest.Payload.Body = new BookingSearchRequest
            {
                Adm = VrpRequestUtils.BuildAdm(),
                CltInfo = cltInfo
            };

            bookingRequest.Payload.Body.Cus = new Cus
            {
                CusId = customerId
            };

            return bookingRequest;
        }

        public static Models.Booking.BookingSearchRequest MapSearch(AdvancedBookingSearchRequest request, CltInfo cltInfo)
        {
            var serviceRequest = new Models.Booking.BookingSearchRequest();
            List<BkgSts> statuses = new List<BkgSts>();
            switch (request.BookingType)
            {
                case BookingType.Cancelled:
                {
                    statuses.Add(BkgSts.CANCELED);
                    break;
                }
                case BookingType.Confirmed:
                {
                    statuses.Add(BkgSts.BOOKING);
                    break;
                }
                case BookingType.All:
                {
                    statuses.Add(BkgSts.BOOKING);
                    statuses.Add(BkgSts.CANCELED);
                    break;
                }
                default:
                    throw new InvalidOperationException("Selected booking type is not supported");
            }

            var offerCtl = new Offer_Ctl
            {
                Sort = new[]
                {
                    new Sort
                    {
                        Order = (Models.Internal.SortOrder) Enum.Parse(typeof(Models.Internal.SortOrder), request.SearchSort.SortOrder.ToString(), true),
                        Sort_Dir = (SortSort_Dir) Enum.Parse(typeof(SortSort_Dir), request.SearchSort.SortDirection.ToString(), true)
                    }
                },
                NumOfResPerPage = request.ResultsPerPage?.ToString(CultureInfo.InvariantCulture),
                Page = request.PageNumber?.ToString(CultureInfo.InvariantCulture)
            };

            var adm = VrpRequestUtils.BuildAdm();
            adm.SessId = request.SearchSessionId;

            var body = new BookingSearchRequest
            {
                Offer_Ctl = offerCtl,
                Adm = adm,
                CltInfo = cltInfo,
                Lastname = request.LeadPassengerName?.Split().Last(),
                Search_Trv_From = request.HolidayStart ?? DateTime.MinValue,
                Search_Trv_FromSpecified = request.HolidayStart.HasValue,
                Search_Trv_To = request.HolidayEnd ?? DateTime.MinValue,
                Search_Trv_ToSpecified = request.HolidayEnd.HasValue,
                Search_Bkg_To = request.BookingTo ?? DateTime.MinValue,
                Search_Bkg_ToSpecified = request.BookingTo.HasValue,
                Search_Bkg_From = request.BookingFrom ?? DateTime.MinValue,
                Search_Bkg_FromSpecified = request.BookingFrom.HasValue,
                BkgSts = statuses.ToArray()
            };

            if (request.ExactBookingDate.HasValue)
            {
                body.Search_Bkg_To = request.ExactBookingDate.Value;
                body.Search_Bkg_ToSpecified = true;
                body.Search_Bkg_From = request.ExactBookingDate.Value;
                body.Search_Bkg_FromSpecified = true;
            }

            serviceRequest.Payload.Body = body;

            return serviceRequest;
        }

        /// <summary>
        /// Display booking Memos request
        /// </summary>
        /// <param name="cltInfo">client info</param>
        /// <param name="bookingReference">booking reference</param>
        /// <returns></returns>
        public static Models.Booking.DisplayBookingMemoRequest MapDisplayMemo(CltInfo cltInfo, string bookingReference)
        {
            var bookingRequest = new Models.Booking.DisplayBookingMemoRequest();

            bookingRequest.Payload.Body = new DisplayMemoRequest
            {
                Adm = VrpRequestUtils.BuildAdm(),
                CltInfo = cltInfo
            };

            bookingRequest.Payload.Body.BkgNum = new BkgNum
            {
                BkgId = bookingReference
            };

            return bookingRequest;
        }

        public static Models.Booking.ModifyMemoRequest MapModifyMemo(CltInfo cltInfo, string bookingReference, IEnumerable<BookingMemo> memos)
        {
            var request = new Models.Booking.ModifyMemoRequest();

            request.Payload.Body = new ModifyMemoRequest
            {
                Adm = VrpRequestUtils.BuildAdm(),
                CltInfo = cltInfo,
                BkgNum = new BkgNum
                {
                    BkgId = bookingReference
                },
                Memo = memos.Select(memo =>
                    new Models.Internal.Memo
                    {
                        Memo_Cd = memo.Code,
                        Memo_Key = memo.Key,
                        Memo_Des = memo.Description,
                        Ser_Id = memo.ServiceCode,
                        Status = memo.Status,
                        Deleted = memo.Delete,
                        DeletedSpecified = memo.Delete
                    }).ToArray()
            };

            return request;
        }

        /// <summary>
        /// Create CancellationRequest based on booking reference
        /// </summary>
        /// <param name="cltInfo">client info</param>
        /// <param name="bookingReference">booking reference</param>
        /// <returns></returns>
        public static Models.Booking.CancellationBookingRequest MapCancellation(CltInfo cltInfo, string bookingReference, string reason, bool withoutFee)
        {
            var cancellationRequest = new Models.Booking.CancellationBookingRequest();

            cancellationRequest.Payload.Body = new CancellationRequest
            {
                Adm = VrpRequestUtils.BuildAdm(),
                Memo = new[]
                {
                    new Models.Internal.Memo
                    {
                        Memo_Cd = "BC",
                        Memo_Name = "Cancellation Comments",
                        Memo_Des = reason
                    }
                },
                CltInfo = cltInfo,
                BkgNum = new[]
                {
                    new BkgNum
                    {
                        BkgId = bookingReference
                    }
                },
                Cnx_Without_FeeSpecified = true,
                Cnx_Without_Fee = withoutFee
            };

            return cancellationRequest;
        }

        /// <summary>
        /// Build <see cref="UpdateCustomerDetailsRequest"/>
        /// </summary>
        /// <param name="cltInfo">Culture info</param>
        /// <param name="bookingId">Booking reference</param>
        /// <param name="customerId">Customer Id</param>
        /// <returns>Request model</returns>
        public static Models.Booking.UpdateCustomerDetailsRequest MapUpdateCustomerDetailsRequest(CltInfo cltInfo, string bookingId, string customerId)
        {
            var request = new Models.Booking.UpdateCustomerDetailsRequest();
            request.Payload.Body = new UpdateCustomerDetailsRequest
            {
                Adm = VrpRequestUtils.BuildAdm(),
                CltInfo = cltInfo,
                BkgNum = new BkgNum()
                {
                    BkgId = bookingId
                },
                Cus = new Cus()
                {
                    CusId = customerId
                }
            };

            return request;
        }

        /// map between
        ///     easyJet.Holidays.External.Atcom.Models.Booking
        /// and
        ///     easyJet.Holidays.Api.Domain.Data.Booking
        ///
        public async Task<BookingResponse> MapResponse(AtcomresBookingBaseResponse response,
            PriceBreakdownResponse priceBreakdownResponse,
            List<Benefit> benefitsContentData, GetBookingOptions options = null)
        {
            var filteredPax = FilterCancelledPax(response.Pax, response.BkgSts);
            var guests = filteredPax?.Select(p => _guestsMapper.MapGuest(p)).ToList();

            var leadPassenger = response.Pax?
                .Where(p => p.Lead_Pax)
                .Select(p => _guestsMapper.MapLeadPassenger(p, response.CusDet?.FirstOrDefault()?.Person))
                .FirstOrDefault();

            var package = response.Bkg_Ent?.Package?.Select((x, index) => MapToOffer(x, guests)).FirstOrDefault();

            if (package != null)
            {
                decimal.TryParse(
                    response.PayData?.FirstOrDefault()?.Est_Loc_Amt?.AmountOrValue,
                    NumberStyles.Any,
                    CultureInfo.InvariantCulture,
                    out var touristTax);

                package.TouristTax = touristTax;
            }
            var firstOutboundFlightId = package?.Transport?.Routes?.FirstOrDefault(r => r.Direction == Direction.Outbound)?.Id;

            var customerDetails = new CustomerDetails
            {
                Email = response.CusDet?.FirstOrDefault()?.Person?.Email?.FirstOrDefault()?.Address
            };

            var currency = _priceMapper.MapCurrency(response.Bkg_Ent);
            var lateRoomCheckout = ItemsMapper.Map(response.Bkg_Ent?.Item, currency, _atcomSettings?.Transfers?.SurchargeSettings, _atcomSettings?.Extras?.LateCheckoutType).FirstOrDefault();

            var transferItems = ItemsMapper.MapTransfers(ItemsMapper.Map(response.Bkg_Ent?.Item, currency, _atcomSettings?.Transfers?.SurchargeSettings, _atcomSettings?.Extras?.TransferTypeCode), _atcomSettings?.Transfers?.Types);
            if (transferItems?.Count <= 0)
            {
                transferItems = new List<TransferItem>()
                {
                    TransfersServiceUtils.BuildSyntaticTransfer(
                        _atcomSettings?.Transfers?.Types?.SyntheticNoTransfer,
                        _atcomSettings?.Transfers?.Types?.DefaultNoTransferCode)
                };
            }
            
            var market = response.Agt_No != null
                ? _atcomSettings?.CltInfo.AgentGroups.SelectMany(ag => ag.Value.AgentsNames).FirstOrDefault(x => x.Value == response.Agt_No).Key ?? Market.Uk
                : null;

            var mapRealExtraLuggageInfoForInternalFlightsWhenConfiguredInCms = options?.MapRealExtraLuggageInfoForInternalFlightsWhenConfiguredInCms ?? false;

            var bookingResponse = new BookingResponse
            {
                BookingReference = response.BkgNum?.BkgId,
                BookingStatus = response.BkgSts.ToString(),
                BookingDate = response.His?.Bkg_Dt_Tm ?? DateTimeOffset.MinValue,
                CancellationDate = response.His?.Cnx_Dt_Tm,
                LeadPassenger = leadPassenger,
                Guests = guests,
                Package = package,
                Currency = currency,
                Language = MapLanguage(response.TrvDox?.DoxLang, market),
                MarketCode = market,
                Prom = package?.Accom?.Prom,
                CustomerId = response.Cus?.CusId,
                CustomerDetails = customerDetails,
                IsExternalAgency = !(_atcomSettings?.CustomerAgencyNo ?? new List<string>()).Contains(response.Agt_No),
                PriceBreakdown = _priceMapper.MapPriceBreakdown(response.Bkg_Ent, priceBreakdownResponse?.PriceCategories),
                DiscountCode = response?.Bkg_Ent?.Prices?.FirstOrDefault(x => !string.IsNullOrEmpty(x.Disc?.Disc_Code))?.Disc?.Disc_Code,
                TradeAgentPriceBreakdown = _priceMapper.MapTradeAgentPriceBreakdown(response.Bkg_Ent, priceBreakdownResponse?.PriceCategories),
                PaymentInfo = _priceMapper.MapPaymentInfo(response.PayData, response.Pax?.Where(p => p.Pax_Tp == Pax_Tp.ADULT || p.Pax_Tp == Pax_Tp.CHILD).Count() ?? 0, currency, response.Bkg_Ent?.Prices),
                TaxesAndFees = [
                    .. _priceMapper.MapTaxesAndFees(
                        response.Bkg_Ent?.Package?
                            .SelectMany(p => p.Items?.OfType<Models.Internal.Accom>() ?? [])
                            .SelectMany(a => a.Rm_Cd ?? [])
                            .ToArray()
                        ?? [])
                ],
                ExtraLuggageInfo = await _extraLuggageMapper.MapLuggageInfo(response.Bkg_Ent?.Flt_Extra_Cat_List, package?.Transport?.Routes, package, mapRealExtraLuggageInfoForInternalFlightsWhenConfiguredInCms),
                Transfers = transferItems,
                AirportParking = AirportParkingMapper.MapResponseToAirportParking(response.Bkg_Ent),
                LateRoomCheckout = lateRoomCheckout != null ? new LateRoomCheckoutItem(lateRoomCheckout) : null,
                ErrataInfo = package?.Accom?.Memos?.Where(x => x.Code == "ERR")?.Select(x => HtmlUtils.RemoveStylesAndScripts(x.Text))?.ToList(),
                SeatSelection = _seatsMapper.GetSeatSelection(package?.Transport?.Routes, response.Bkg_Ent?.Seat_Map, benefitsContentData),
                AgentData = GetAgentData(response),
                IsRefundable = package?.Accom?.Rooms.All(i => i.IsRefundable ?? true) ?? true
            };
            
            return bookingResponse;
        }

        private static BookingAgentData GetAgentData(AtcomresBookingBaseResponse response)
        {
            return new BookingAgentData()
            {
                AgentName = response.AgtContact?.Details, 
                AgentNumber = response.Agt_No
            };
        }

        public static AdvancedBookingSearchResponse MapAdvancedSearchResponse(Models.Booking.BookingSearchResponse serviceResponse)
        {
            var response = new AdvancedBookingSearchResponse();

            var entries = new List<BookingSearchEntry>();
            foreach (var entry in serviceResponse.Payload.Body?.BookingSearchResponseEntry
                                  ?? Array.Empty<BookingSearchResponseEntry>())
            {
                var responseEntry = new BookingSearchEntry
                {
                    Id = entry.BkgNum.BkgId,
                    LeadPassengerLastName = entry.Pax_Lastname,
                    BookingDate = entry.Bkg_Dt_Tm,
                    HolidayStart = entry.Earliest_Startdate,
                    HolidayEnd = entry.Latest_Enddate,
                };

                switch (entry.BkgSts)
                {
                    case BkgSts.BOOKING:
                        {
                            responseEntry.Status = BookingType.Confirmed;
                            break;
                        }
                    case BkgSts.CANCELED:
                        {
                            responseEntry.Status = BookingType.Cancelled;
                            break;
                        }
                }

                entries.Add(responseEntry);
            }

            response.Bookings = entries;
            response.SessionId = serviceResponse.Payload.Body?.Adm.SessId;
            response.HasNextPage = serviceResponse.Payload.Body?.Offer_Ctl?.MorePages ?? false;

            return response;
        }

        private IEnumerable<Pax> FilterCancelledPax(Pax[] pax, BkgSts bkgSts)
        {
            // if the booking was cancelled, all passengers get flagged as cancelled as well
            // in this case they shouldn't be filtered though
            if (bkgSts == BkgSts.CANCELED)
                return pax;

            // if the booking has any status other than cancelled,
            // then pax with pax.Cancelled were removed explicitly.
            return pax?.Where(p => !p.Canceled);
        }

        /// <summary>
        /// Mat Atcom Memo fields
        /// </summary>
        /// <param name="memo"></param>
        /// <returns></returns>
        public static List<Holidays.Api.Domain.Data.Booking.Memo> MapMemos(Models.Internal.Memo[] memo)
        {
            return memo?.Select(x => new Holidays.Api.Domain.Data.Booking.Memo { Code = x.Memo_Cd, Text = x.Memo_Des, Key = x.Memo_Key }).ToList();
        }

        private static BookingPackage MapToOffer(Package package, List<PersonWithDetails> guests)
        {
            var accoms = package.Items?.Where(i => i is Models.Internal.Accom).Select(i => i as Models.Internal.Accom) ?? new Models.Internal.Accom[0];

            // throw error if Offer doesn't have any accommodations
            if (!accoms.Any())
            {
                return null; // can't map
            }

            // Respose may have multiple accoms, and sometimes the order is not valid, we should validate list of rooms and pick up the last one with rooms
            accoms.ToList().ForEach(a =>
            {
                var accomActiveRooms = (a.Rm_Cd ?? new Rm_Cd[0]).Where(r => r.Ser_Sts == null || r.Ser_Sts.All(x => x != Ser_Sts.CANCELLED));
                a.Rm_Cd = accomActiveRooms.ToArray();
            });

            // Active accomm is Last accom with rooms
            var accom = accoms.LastOrDefault(x => x.Rm_Cd.Length > 0);

            // Get rooms from all Accoms because reponse may have multiple accoms with both active and cancelled rooms.
            var rooms = accoms.SelectMany(x => (x as Models.Internal.Accom).Rm_Cd ?? new Rm_Cd[0]);
            // Get rid of rooms with CANCELLED status
            rooms = rooms.Where(r => r.Ser_Sts == null || r.Ser_Sts.All(x => x != Ser_Sts.CANCELLED));

            HtlPrd htlPrd = accom.HtlPrd;

            var hotel = htlPrd.Hotel;
            var streetWithNumber = hotel?.Add?.Street;
            if (!string.IsNullOrEmpty(hotel?.Add?.HouseNo))
                streetWithNumber += $" {hotel?.Add?.HouseNo}";

            return new BookingPackage
            {
                Accom = new BookingAccommodation
                {
                    Id = accom.Id,
                    Code = htlPrd.Acc_Cd,
                    IsExt = htlPrd.Acc_InvStateSpecified && htlPrd.Acc_InvState == Acc_InvState.EXTERNAL,
                    System = accom.Ext_Ref_Id?.System,
                    StartDate = accom.St_Dt,
                    EndDate = accom.End_Dt,
                    Prom = htlPrd.Prom?.Code,

                    Hotel = new OfferHotel()
                    {
                        FullHotelAddress = new FullHotelAddress
                        {
                            City = hotel?.Add?.City,
                            Street = streetWithNumber,
                            CountryCode = hotel?.Add?.CountryISOCode,
                            Region = hotel?.Add?.Region,
                            PostalCode = hotel?.Add?.ZipCode
                        },
                        Name = htlPrd.Name,
                        StarRating = hotel?.Star_Rating,
                        City = hotel?.Add?.City,
                        Address = hotel?.Add?.Street,
                        Location = new HotelLocation
                        {
                            Name = hotel?.Add?.Region
                        },
                        Country = new HotelCountry
                        {
                            Code = hotel?.Add?.CountryISOCode,
                        }
                    },
                    Rooms = rooms.Select(room =>
                    {
                        var roomSubServPaxs = room.SubServPaxs ?? new SubServPax[0];
                        var guestIds = roomSubServPaxs.Select(pax => { int res; int.TryParse(pax.Pax_Id, out res); return res; })?.ToList() ?? new List<int>();
                        var roomGuests = guestIds.Select(id => guests.FirstOrDefault(g => g.Index == id.ToString())).Where(x => x != null);
                        var childrenIds = roomGuests.Where(x => x.Type == PersonType.Child).Select(x => x.Index);
                        return new Unit
                        {
                            Code = room.Code,
                            Board = room.BB_Cd,
                            BoardName = room.BB_Name,
                            Name = room.Desc,
                            ExternalBoardCode = room.Ext_BB_Cd,
                            ExternalRoomCode = room.Ext_Rm_Cd,
                            FreeForKids = accom.Child_Price_Reduction != null && accom.Child_Price_Reduction.Cd == PriceMapper.AtcomAllowString,
                            Occupation = new Occupation
                            {
                                Adults = roomGuests.Where(x => x.Type == PersonType.Adult).Count(),
                                Children = childrenIds.Count(),
                                Infants = roomGuests.Where(x => x.Type == PersonType.Infant).Count(),
                                PaxIds = guestIds,
                                ChildAges = guests.Where(g => childrenIds.Contains(g.Index?.ToString())).Select(x => (uint)x.Age).ToList()
                            },
                            PaxPrices = roomSubServPaxs.Select(ssp =>
                            {
                                double.TryParse(ssp.Pax_Srv_Prc_Ex.Value, CultureInfo.InvariantCulture, out double parsedPrice);
                                return new PaxPrice
                                {
                                    PaxIndex = ssp.Pax_Id,
                                    Price = parsedPrice
                                };
                            }).ToList(),
                            IsRefundable = !room.Is_Non_Refundable
                        };
                    })
                        .Where(r => (r.Occupation.Adults + r.Occupation.Children + r.Occupation.Infants) > 0)
                        .ToList(),
                    Memos = MapMemos(accom.Memo)
                },
                Location = new Location()
                {
                    City = hotel?.Add?.City,
                    Region = hotel?.Add?.Region,
                    Country = hotel?.Add?.CountryISOCode,
                },
                Transport = new Transport
                {
                    Routes = MapRoutes(package.Route_List ?? new Routing[0]),
                },
            };
        }

        public static Adm BuildAdmProperty()
        {
            return new Adm()
            {
                ReqId = Guid.NewGuid().ToString(),
                Tm = DateFormatUtils.Utc(DateTimeOffset.UtcNow.UtcDateTime),
                Trk = new Trk()
                {
                    From = TrkFrom.easyjet,
                    To = TrkTO.atcomres
                }
            };
        }

        //TODO Adapt to use it inside InfoBookingMapper.BuildInfoBookingRequest(...)
        /// <summary>
        /// Builds a AtcomresBookingBaseRequest Model
        /// </summary>
        /// <param name="accom"></param>
        /// <param name="transport"></param>
        /// <param name="guests"></param>
        /// <param name="transfers"></param>
        /// <param name="lateRoomCheckoutItem"></param>
        /// <param name="extraLuggageInfo"></param>
        /// <param name="seatSelection"></param>
        /// <param name="airportParking"></param>
        /// <param name="sendExtraFlightInformationForInternalFlights"></param>
        /// <param name="promotionAgentKey"></param>
        /// <returns></returns>
        public AtcomresBookingBaseRequest BuildAtcomBookingBaseRequest(
            BookingAccommodation accom,
            Transport transport,
            List<PersonWithDetails> guests,
            IList<TransferItem> transfers,
            LateRoomCheckoutItem lateRoomCheckoutItem,
            ExtraLuggageInfo extraLuggageInfo,
            IEnumerable<SeatMap> seatSelection, 
            AirportParkingItem airportParking,
            bool sendExtraFlightInformationForInternalFlights = false,
            IList<string> promotionAgentKey = null)
        {
            var accomUnit = accom.Rooms;
            var outFlight = transport.Routes[0];
            var inFlight = transport.Routes[1];
            var seatSelectionList = seatSelection?.ToList() ?? [];

            // Set sector ids for flights from seat selection data if it contains them
            SetRouteSectorFromSeatSelection(outFlight, seatSelectionList);
            SetRouteSectorFromSeatSelection(inFlight, seatSelectionList);

            // Pax ids order should be : adults, children, infants
            var orderedGuests = GuestsMapper.SortGuests(guests, x => x.Type).ToList();

            // Prepare request parts
            var allPaxs = GuestsMapper.MapRoutePax(orderedGuests, outFlight.Paxs);

            var pax = _guestsMapper.Map(orderedGuests);

            //delete syntheticNoTransfer
            transfers = transfers.Where(item => !item.Code.StartsWith(_atcomSettings.Transfers.Types.SyntheticNoTransfer)).ToList();

            // Extra items
            var items = new List<Item>(InfoBookingMapper.BuildExtrasItems(transfers, orderedGuests));

            if (lateRoomCheckoutItem != null)
            {
                items.AddRange(InfoBookingMapper.BuildExtrasItems(new List<LateRoomCheckoutItem> { lateRoomCheckoutItem }, orderedGuests));
            }
            
            // airport parking item
            if (airportParking != null)
                items.Add(InfoBookingMapper.BuildAirportParkingItem(airportParking));
            
            var externalReferenceAccomId = string.IsNullOrWhiteSpace(accom.System)
                ? null
                : new Ext_Ref_Id { System = accom.System };

            var atcomresBookingBaseRequest = new AtcomresBookingBaseRequest()
            {
                Adm = BuildAdmProperty(),
                CltInfo = _atcomRequestGenerator.BuildCurrentCltInfo(promotionAgentKey: promotionAgentKey),
                BkgSts = BkgSts.BOOKING,
                BkgStsSpecified = true,
                Bkg_Ent = new Bkg_Ent
                {
                    Package = new Package[]
                    {
                        new Package
                        {
                            Items = new object[]
                            {
                                new Models.Internal.Accom
                                {
                                    Id = InfoBookingMapper.AccommodationSectionId,
                                    St_Dt = accom.StartDate,
                                    End_Dt = accom.EndDate,
                                    HtlPrd = new HtlPrd
                                    {
                                        Prom = new Prom
                                        {
                                            Code = accom.Prom
                                        },
                                        Acc_Cd = accom.Code,
                                        Acc_InvStateSpecified = true,
                                        Acc_InvState = accom.IsExt ? Acc_InvState.EXTERNAL : Acc_InvState.INTERNAL
                                    },
                                    Child_Price_Reduction = accomUnit.Any(u => u.FreeForKids)
                                        ? new Child_Price_Reduction
                                        {
                                            Cd = PriceMapper.AtcomAllowString
                                        }
                                        : null,
                                    Rm_Cd = accomUnit.Select((unit, idx) =>  {
                                        return new Rm_Cd
                                    {
                                        Rm_No = (idx + 1).ToString(),
                                        Code = unit.Code,
                                        BB_Cd = unit.Board,
                                        Ser_Sts = new Ser_Sts[] {Ser_Sts.FIX},
                                        Ext_Rm_Cd = unit.ExternalRoomCode,
                                        Ext_BB_Cd = unit.ExternalBoardCode,
                                        SubServPaxs = unit.Occupation?.PaxIds?.Select(paxId => new SubServPax
                                        {
                                            Pax_Id = paxId.ToString(),
                                        }).ToArray(),
                                        Is_Non_Refundable = !(unit.IsRefundable ?? true)
                                    };
                                    }
                                    ).ToArray(),
                                    Ext_Ref_Id = externalReferenceAccomId
                                }
                            },
                            Route_List = new[]
                            {
                                new Routing
                                {
                                    Routing_Id = "1",
                                    ItemsElementName = new[] {ItemsChoiceType.Route, ItemsChoiceType.Route},
                                    Items = new object[]
                                    {
                                        // Flight Promotion for the internal flights should be from settings
                                        RouteMapper.BuildInfoModifyBookingRoute(outFlight,
                                            outFlight.IsExternal ? accom.Prom : _atcomSettings.InternalFlightPromotionCode, allPaxs, true),
                                        RouteMapper.BuildInfoModifyBookingRoute(inFlight,
                                            inFlight.IsExternal ? accom.Prom : _atcomSettings.InternalFlightPromotionCode, allPaxs, false)
                                    }
                                }
                            }
                        }
                    },
                    Item = items.ToArray(),
                    Flt_Extra_Cat_List = GetFlightExtras(extraLuggageInfo, transport, sendExtraFlightInformationForInternalFlights),
                    Seat_Map = SeatsMapper.GetAtcomSeatMap(seatSelectionList, guests, includePrices: true)
                },
                Pax = pax
            };

            // We don't support extra luggage for internal flights and therefore use the old mapper in this case
            // For some promotions we need to add extra luggage info.


            return atcomresBookingBaseRequest;
        }

        private static Flt_Extra_Cat_List[] GetFlightExtras(ExtraLuggageInfo extraLuggageInfo, Transport transport, bool sendExtraFlightInformationForInternalFlights)
        {
            return ExtraLuggageMapper.MapToAtcomModel(extraLuggageInfo, transport.Routes, sendExtraFlightInformationForInternalFlights);
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
        /// Map Atcom Routes to routes
        /// </summary>
        /// <param name="routing"></param>
        /// <returns></returns>
        private static List<Route> MapRoutes(Routing[] routing)
        {
            var routes = routing?.SelectMany(x => x.Items.Where(i => i is Route_Tp)).Select(x => x as Route_Tp);

            // Get rid of cancelled routes
            routes = routes.Where(r => r.Ser_Sts == null || r.Ser_Sts.All(x => x != Ser_Sts.CANCELLED));

            return routes?.Select(route =>
            {
                DateTimeOffset depDate = DateTimeOffset.UtcNow, arrDate = DateTime.Now;
                if (route.Flt_Dt_Tm != null && route.Flt_Dt_Tm.Length > 0)
                {
                    DateTimeOffset.TryParse(route.Flt_Dt_Tm[0].Local, CultureInfo.InvariantCulture, out depDate);
                }

                if (route.Flt_Dt_Tm.Length > 1)
                {
                    DateTimeOffset.TryParse(route.Flt_Dt_Tm[1].Local, CultureInfo.InvariantCulture, out arrDate);
                }

                var routeTotalPriceEx = string.IsNullOrEmpty(route.Tot_Prc_Ex)
                    ? 0m
                    : decimal.Parse(route.Tot_Prc_Ex, CultureInfo.InvariantCulture);

                return new Route
                {
                    Id = route.Flt_Inv_Id,
                    DepDate = depDate,
                    DepPt = route.Dep_Air_Cd,
                    ArrDate = arrDate,
                    ArrPt = route.Arr_Air_Cd,
                    FltNo = route.Flt_No,
                    RouteCd = route.RouteCd?.Value,
                    RouteId = route.Flt_Inv_Id,
                    Direction = MapDirection(route.Rt_Dir),
                    ExtRefId = route?.Ext_Ref_Id?.Code,
                    Car = route.Car_Cd,
                    IsExternal = route.Rt_InvState == Route_TpRt_InvState.EXTERNAL,
                    BookingClass = route.Bkg_Cls?.Code,
                    Paxs = route.SubServPaxs?.Select(x =>
                            new RoutePax
                            {
                                PaxId = x.Pax_Id,
                                ExternalPNR = x.Ext_Ref_Id?.Code,
                                Seat = x.Seat
                            })
                        .ToList(),
                    Terminal = route.Check_In?[0].Value,
                    IsSeatReservationPossible = route.Seat_Res_Possible == "YES",
                    SectorId = route.Sec?.FirstOrDefault()?.SecId, // We assume for now that route has only one sector
                    Duration = int.TryParse(route.Duration, out int dur) && dur != 0 ? $"{dur}" : null,
                    TotalPrice = routeTotalPriceEx
                };
            }).ToList();
        }

        /// <summary>
        /// Map Atcom direction to our enum
        /// </summary>
        /// <param name="direction"></param>
        /// <returns></returns>
        private static Direction MapDirection(string direction)
        {
            if (direction == "inbound") return Direction.Inbound;

            return Direction.Outbound;
        }

        public string MapLanguage(string doxLanguage, string marketCode)
        {
            if (string.IsNullOrEmpty(marketCode))
            {
                return null;
            }

            return string.IsNullOrEmpty(doxLanguage)
                ? _languageSettings.MarketLanguages.GetValueOrDefault(marketCode)?.FirstOrDefault()
                : _languageSettings.MarketLanguages.GetValueOrDefault(marketCode)?.FirstOrDefault(x => x.StartsWith(doxLanguage.Substring(0, 2))) ?? Language.EnglishCode;
        }
    }
}