using easyJet.Holidays.Api.Domain.Data.Hotels;
using easyJet.Holidays.Api.Domain.Data.Hotels.Facilities;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Interfaces.Mappers;
using easyJet.Holidays.Api.Domain.Interfaces.Offers;
using easyJet.Holidays.Api.Domain.Logging;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Utils;
using Microsoft.Extensions.Logging;
using BoardType = easyJet.Holidays.Api.Domain.Data.PackageOffers.BoardType;
using RoomType = easyJet.Holidays.Api.Domain.Data.PackageOffers.RoomType;

namespace easyJet.Holidays.Api.Domain.Mappers
{
    /// <summary>
    /// Hotels models mapper
    /// </summary>
    public class OfferHotelMapper : IOfferHotelMapper
    {
        private readonly IReferenceDataService _referenceDataService;
        private readonly IHotelThemeService _hotelThemeService;
        private readonly ILogger<OfferHotelMapper> _logger;

        public OfferHotelMapper(IReferenceDataService referenceDataService, IHotelThemeService hotelThemeService, ILogger<OfferHotelMapper> logger)
        {
            _referenceDataService = referenceDataService;
            _hotelThemeService = hotelThemeService;
            _logger = logger;
        }

        /// <summary>
        /// Map between CMS hotel model and API response model.
        /// Doesn't map available Rooms and Board Types
        /// </summary>
        /// <param name="hotel">CMS hotel model</param>
        /// <param name="promCode">Hotel code (accommodation code)</param>
        /// <returns>Api hotel model</returns>
        public async Task<OfferHotel> MapWithoutBoardsRooms(Hotel hotel, string promCode, BaseSearchRequest request = null)
        {
            if (hotel == null)
            {
                return null;
            }

            var (theme, type) = await _hotelThemeService.GetTheme(promCode);
            var hotelType = await _hotelThemeService.GetHotelType(hotel.FacilityMatrix, request);

            // get Closest facility based on theme

            AccommodationFacility closestFacility = null;
            if (theme != null && hotel.ClosestFacilities != null)
            {
                hotel.ClosestFacilities.TryGetValue(theme.Code, out closestFacility);
            }

            return new OfferHotel
            {
                GiataCode = hotel.GiataCode,
                Name = hotel.Name,
                Strapline = hotel.Strapline,
                Description = hotel.Description,
                Address = hotel.Address,
                BookingPhone = hotel.BookingPhone,
                Email = hotel.Email,
                FaxNumber = hotel.FaxNumber,
                HotelPhone = hotel.HotelPhone,
                Latitude = hotel.Latitude,
                Longitude = hotel.Longitude,
                ManagementPhone = hotel.ManagementPhone,
                PostalCode = hotel.PostalCode,
                Website = hotel.Website,
                StarRating = hotel.StarRating,
                City = hotel.City,
                NumberOfReviews = hotel.NumberOfReviews,
                TripAdvisorRating = hotel.Rating,
                Images = hotel.Images ?? new List<HotelImage>(),
                Airports = hotel.AirportCodes ?? new List<string>(),
                Facilities = hotel.Facilities?.Select(x => MapFacilityGroup(x)) ?? new List<HotelFacilityGroup>(),
                ErrataFacilities = hotel.ErrataFacilities?.Select(x => MapFacility(x)),
                ClosestFacility = closestFacility != null ? MapFacility(closestFacility) : null,
                EcoFacility = hotel.EcoFacility,
                Country = hotel.Country == null ? null : new HotelCountry()
                {
                    Code = hotel.Country.Code,
                    Name = hotel.Country.Name,
                    ItemName = hotel.Country.ItemName,
                    Url = hotel.Country.Url
                },
                Location = hotel.Location == null ? null : new HotelLocation()
                {
                    Code = hotel.Location.Code,
                    Name = hotel.Location.Name,
                    ItemName = hotel.Location.ItemName,
                    Url = hotel.Location.Url
                },
                Resort = hotel.Resort == null ? null : new HotelResort()
                {
                    Code = hotel.Resort.Code,
                    Name = hotel.Resort.Name,
                    ItemName = hotel.Resort.ItemName,
                    Url = hotel.Resort.Url
                },
                KeySellingPoint1 = hotel.KeySellingPoint1,
                KeySellingPoint2 = hotel.KeySellingPoint2,
                Theme = theme, // TODO ignore CMS property for now: hotel.HotelTheme,
                Type = type,// TODO ignore CMS property for now: hotel.HighestPriorityType,
                HotelType = hotelType,
                TripAdvisorId = hotel.TripAdvisorId,
                IsGreatDeal = hotel.IsGreatDeal,
                LanguageOfHotel = hotel.LanguageOfHotel,
                Url = hotel.Url,
                YoutubeVideoId = hotel.YoutubeVideoId,
                VideoPlaceholder = hotel.VideoPlaceholder,
                CloudinaryVideoSrc = hotel.CloudinaryVideoSrc,
                PromoCollections = hotel.PromoCollections
            };
        }

        /// <summary>
        /// Converts offers and hotel model to <see cref="AccommodationOffersResponse"/> instance:
        /// - do mapping
        /// - fills board and room types
        /// </summary>
        /// <param name="hotelModel">Hotel content model</param>
        /// <param name="offers">List of offers</param>
        /// <returns>Response model</returns>
        public async Task<AccommodationOffersResponse> BuildAccommodationOffers(Hotel hotelModel, List<Offer> offers, BaseSearchRequest request = null)
        {
            var result = new AccommodationOffersResponse
            {
                Hotel = await MapWithoutBoardsRooms(hotelModel, offers.FirstOrDefault()?.Accom?.Prom, request),
                Offers = offers
            };

            // Map room types and board types
            foreach (var offer in result.Offers ?? new List<Offer>())
            {
                foreach (var unit in offer.Accom.Unit ?? new List<Unit>())
                {
                    await EnrichBoardTypeAndRoomType(hotelModel, unit, offer.Date, offer.Stay);
                }

                await EnrichAltBoards(hotelModel, offer);

                // transfer data
                await TransfersServiceUtils.EnrichCmsData(offer.Transfers, offer?.Transport, hotelModel.Transfers, _referenceDataService);
            }

            return result;
        }

        /// <summary>
        /// Enrich board and room type based on Hotel information.
        /// Doesn't fill data if hotel doesn't contain required board or room types
        /// </summary>
        /// <param name="hotelModel">Hotel with available types</param>
        /// <param name="offerUnit">Offer to update</param>
        /// <param name="startDate">Package start date</param>
        /// <param name="duration">Package duration</param>
        public async Task EnrichBoardTypeAndRoomType(Hotel hotelModel, Unit offerUnit, DateTime? startDate, int? duration)
        {
            offerUnit.RoomType = await GetRoomType(offerUnit.Code, offerUnit.Name, hotelModel, startDate, duration);
            offerUnit.BoardType = await GetBoardType(offerUnit.Board, hotelModel);
        }

        /// <summary>
        /// Enrich board and room type based on Hotel information.
        /// Doesn't fill data if hotel doesn't contain required board or room types
        /// </summary>
        /// <param name="hotelModel">Hotel with available types</param>
        /// <param name="board">Board code</param>
        public async Task<BoardType> GetBoardType(string board, Hotel hotelModel)
        {
            var foundBoardType = hotelModel?.BoardTypes?.FirstOrDefault(bt => bt.Code == board);

            if (foundBoardType == null)
            {
                _logger.LogTrace($"No board types available in CMS for code {board} in hotel {hotelModel?.Code}. Reference/Atcom data data will be used");

                var fallbackBoardType = await _referenceDataService.GetBoardType(board);

                foundBoardType = new Data.Hotels.BoardType
                {
                    Code = fallbackBoardType?.Code ?? board,
                    Name = fallbackBoardType?.Name ?? board,
                    ItemName = fallbackBoardType?.ItemName,
                    Content = fallbackBoardType?.Content,
                    Description = fallbackBoardType?.Description,
                    IconUrl = fallbackBoardType?.IconUrl,
                    BoardGroup = fallbackBoardType?.BoardGroup
                };
            }

            return MapBoardType(foundBoardType);
        }

        /// <summary>
        /// Enrich room type based on Hotel information.
        /// Doesn't fill data if hotel doesn't contain required room types
        /// </summary>
        /// <param name="roomCode">Room code</param>
        /// <param name="roomName">Fallback room name</param>
        /// <param name="hotelModel">Hotel with available types</param>
        /// <param name="startDate">Package start date</param>
        /// <param name="duration">Package duration</param>
        public async Task<RoomType> GetRoomType(string roomCode, string roomName, Hotel hotelModel, DateTime? startDate = null, int? duration = null)
        {
            var logger = LoggerFactoryProvider.CreateLogger<OfferHotelMapper>();

            var roomCodeParsed = ParseRoomCode(roomCode);

            var foundRoomType = hotelModel?.RoomTypes?.FirstOrDefault(rt => rt.Code == roomCodeParsed ||
                                                                            rt.BedGroups?.Any(bg =>
                                                                                string.Equals(
                                                                                    $"{rt.Code}.{bg.BedGroupId}",
                                                                                    roomCodeParsed,
                                                                                    StringComparison.OrdinalIgnoreCase)) == true);
            if (foundRoomType == null)
            {
                logger.LogTrace($"No room types available in CMS for code {roomCodeParsed} in hotel {hotelModel?.Code}. Reference/Atcom data data will be used");

                var fallbackRoomTypes = await _referenceDataService.GetRoomType(roomCodeParsed);
                foundRoomType = new Data.Hotels.RoomType
                {
                    Code = fallbackRoomTypes?.Code ?? roomCode,
                    Name = fallbackRoomTypes?.Name ?? roomName,
                    ItemName = fallbackRoomTypes?.ItemName,
                    Content = fallbackRoomTypes?.Content,
                    Description = fallbackRoomTypes?.Description,
                    IconUrl = fallbackRoomTypes?.IconUrl
                };
            }

            return MapRoomType(foundRoomType, startDate, duration);
        }

        /// <summary>
        /// Enrich offer AltBoards with more details from Sitecore
        /// </summary>
        /// <param name="hotel">Hotel board types</param>
        /// <param name="offer">Offer to update</param>
        public async Task EnrichAltBoards(Hotel hotel, Offer offer)
        {
            if (offer?.AltBoards == null)
            {
                return;
            }

            offer.AltBoards = await EnrichAltBoards(hotel, offer.AltBoards);
        }

        /// <summary>
        /// Enrich AltBoards with more details from Sitecore
        /// </summary>
        /// <param name="hotel">Hotel board types</param>
        /// <param name="altBoards">AltBoards to update</param>
        public async Task<List<AltBoardType>> EnrichAltBoards(Hotel hotel, IEnumerable<AltBoardType> altBoards)
        {
            var enrichTasks = altBoards.EmptyIfNull()
                .Select(async (board) =>
                {
                    var boardType = await GetBoardType(board.Code, hotel);

                    return new AltBoardType(boardType)
                    {
                        AccommodationId = board.AccommodationId,
                        PackageId = board.PackageId,
                        Price = board.Price,
                        PricePP = board.PricePP,
                        PriceExcludingTouristTax = board.PriceExcludingTouristTax,
                        PricePPExcludingTouristTax = board.PricePPExcludingTouristTax,
                        Currency = board.Currency,
                        UnitCodes = board.UnitCodes,
                        RoomAlterations = board.RoomAlterations,
                        IsExternal = board.IsExternal,
                    };
                })
                .ToArray();

            if (enrichTasks.Length == 0) return new List<AltBoardType>();

            return (await Task.WhenAll(enrichTasks)).ToList();
        }

        /// <summary>
        /// Map between hotel.BoardType and public board type.
        /// If hotelBoardType is null then boardCode will be used to map data (Code will be used for name also)
        /// </summary>
        /// <param name="hotelBoardType">Object to map</param>
        /// <returns>Mapped object</returns>
        private static BoardType MapBoardType(Data.Hotels.BoardType hotelBoardType)
        {
            if (hotelBoardType == null)
            {
                return null;
            };

            return new BoardType()
            {
                Code = hotelBoardType.Code,
                Content = hotelBoardType.Content,
                Title = hotelBoardType.Name,
                ItemName = hotelBoardType.ItemName,
                Description = hotelBoardType.Description,
                IconUrl = hotelBoardType.IconUrl,
                BoardGroup = hotelBoardType.BoardGroup
            };
        }

        /// <summary>
        /// Map between hotel.RoomType and public board type
        /// </summary>
        /// <param name="hotelRoomType">Object to map</param>
        /// <param name="startDate">Package start date</param>
        /// <param name="duration">Package duration</param>
        /// <returns>Mapped object</returns>
        private static RoomType MapRoomType(Data.Hotels.RoomType hotelRoomType, DateTime? startDate = null, int? duration = null)
        {
            if (hotelRoomType == null) return null;

            return new RoomType()
            {
                Code = hotelRoomType.Code,
                Content = hotelRoomType.Content,
                Description = hotelRoomType.Description,
                Title = hotelRoomType.Name,
                ItemName = hotelRoomType.ItemName,
                IconUrl = hotelRoomType.IconUrl,
                Images = hotelRoomType.Images,
                Facilities = hotelRoomType.Facilities?.Select(facility => MapFacility(facility, startDate, duration)).Where(facility => facility != null),
                Stays = hotelRoomType.Stays?.Select(MapRoomStay),
                BedGroups = hotelRoomType.BedGroups?.Select(MapBedGroup)
            };
        }

        /// <summary>
        /// Map room facility
        /// </summary>
        /// <param name="roomFacility"></param>
        /// <param name="startDate">Package start date</param>
        /// <param name="duration">Package duration</param>
        /// <returns></returns>
        private static HotelFacility MapFacility(RoomFacility roomFacility, DateTime? startDate = null, int? duration = null)
        {
            var hotelFacility = MapBaseFacility(roomFacility);

            if (!startDate.HasValue || !duration.HasValue || roomFacility.SeasonalFacilitiesDataRange.IsNullOrEmpty())
            {
                return hotelFacility;
            }

            var endDate = startDate.Value.AddDays(duration.Value);

            //check dates for season room facilities 
            if (roomFacility.SeasonalFacilitiesDataRange.Any(range => range.Start <= startDate && endDate <= range.End))
            {
                return hotelFacility;
            }

            return null;
        }

        /// <summary>
        /// Map room stay configurations
        /// </summary>
        /// <param name="stay"></param>
        /// <returns></returns>
        private static RoomTypeStay MapRoomStay(HotelRoomStay stay)
        {
            return new RoomTypeStay
            {
                StayType = stay.StayType,
                Description = stay.Description,
                Facilities = stay.Facilities?.Select(MapBaseFacility),
            };
        }
        
        /// <summary>
        /// Map bed group details
        /// </summary>
        /// <param name="bedGroup"></param>
        /// <returns></returns>
        private static BedGroup MapBedGroup(BedGroup bedGroup)
        {
            return new BedGroup
            {
                BedGroupId = bedGroup.BedGroupId,
                Description = bedGroup.Description,
            };
        }

        /// <summary>
        /// Map facility group
        /// </summary>
        /// <param name="facilityGroup">Facility to map</param>
        /// <returns>Mapped facility group</returns>
        private static HotelFacilityGroup MapFacilityGroup(AccommodationFacilityGroup facilityGroup)
        {
            return new HotelFacilityGroup
            {
                Name = facilityGroup.Name,
                Code = facilityGroup.Code,
                IconUrl = facilityGroup.IconUrl,
                Id = facilityGroup.Id,
                Description = facilityGroup.Description,
                Image = facilityGroup.Image,
                Title = facilityGroup.Title,
                Items = (facilityGroup.Items ?? new List<AccommodationFacility>()).Select(MapFacility),
            };
        }

        /// <summary>
        /// Map facility
        /// </summary>
        /// <param name="facility">Facility to map</param>
        /// <returns>Mapped facility</returns>
        private static HotelFacility MapFacility(AccommodationFacility facility)
        {
            var result = MapBaseFacility(facility);
            result.IsErrataInfo = facility.IsErrataInfo;
            result.Distance = facility.Distance;

            return result;
        }

        /// <summary>
        /// Map facility
        /// </summary>
        /// <param name="facility">Facility to map</param>
        /// <returns>Mapped base facility</returns>
        private static HotelFacility MapBaseFacility(BaseFacility facility)
        {
            return new HotelFacility
            {
                Name = facility.Name,
                Code = facility.FacilityCode,
                Number = facility.Number,
                FacilityFilterGroup = facility.FacilityFilterGroup,
                DisclaimerMessage = facility.DisclaimerMessage,
                Icon = facility.Icon
            };
        }

        /// <summary>
        /// Some rooms may have in Atcom code "FAM.ST!NOR.CG-TODOS RO" where "NOR.CG-TODOS RO" is rate plan for this room
        /// </summary>
        /// <param name="roomCode"></param>
        /// <returns>Room code </returns>
        public static string ParseRoomCode(string roomCode)
        {
            return roomCode?.Split('!')[0]; // It's safe to take first item
        }

        /// <summary>
        /// Return whether Atcom code has format like "FAM.ST!NOR.CG-TODOS RO" or not for the room
        /// </summary>
        /// <param name="roomCode"></param>
        /// <returns>Room code </returns>
        public static bool IsExtRoomCode(string roomCode)
        {
            return roomCode?.Contains('!') ?? true;
        }

        /// <summary>
        /// Map reference data board types to hotel board type
        /// </summary>
        /// <param name="boardType">Board to map</param>
        /// <returns></returns>
        public static Data.Hotels.BoardType MapReferenceDataBoardTypeToHotelBoard(Data.ReferenceData.BoardType boardType)
        {
            return new Data.Hotels.BoardType()
            {
                Name = boardType.Name,
                ItemName = boardType.ItemName,
                Code = boardType.Code,
                Content = boardType.Content,
                Description = boardType.Description,
                IconUrl = boardType.IconUrl,
                BoardGroup = boardType.BoardGroup,
            };
        }

        /// <summary>
        /// Map reference data room type to hotel room type
        /// </summary>
        /// <param name="roomType">Room type to map</param>
        /// <returns></returns>
        public static Data.Hotels.RoomType MapReferenceDataRoomTypeToHotelRoom(Data.ReferenceData.RoomType roomType)
        {
            return new Data.Hotels.RoomType()
            {
                Name = roomType.Name,
                Code = roomType.Code,
                Content = roomType.Content,
                Description = roomType.Description,
                IconUrl = roomType.IconUrl,
            };
        }
    }
}
