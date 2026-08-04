using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.DynamoDB.Bookings;
using easyJet.Holidays.Api.Domain.Data.SES;
using easyJet.Holidays.Api.Domain.Interfaces.Repositories;
using easyJet.Holidays.Api.Domain.Interfaces.SES;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Globalization;
using System.Text;

namespace easyJet.Holidays.Api.Domain.Services.Booking
{
    public class GroupBookingService : IGroupBookingService
    {
        private readonly ILogger<GroupBookingService> _logger;
        private readonly IAWSDbRepository<GroupBooking> _awsDbRepository;
        private readonly TradePortalSettings _tradePortalSettings;
        private readonly ISesClient _sesClient;

        public GroupBookingService(
            ILogger<GroupBookingService> logger,
            IAWSDbRepository<GroupBooking> awsDbRepository,
            IOptions<TradePortalSettings> tradePortalOptions,
            ISesClient sesClient)
        {
            _logger = logger;
            _awsDbRepository = awsDbRepository;
            _tradePortalSettings = tradePortalOptions.Value ?? throw new ArgumentNullException(nameof(tradePortalOptions));
            _sesClient = sesClient;
        }

        public async Task Submit(GroupBookingRequest request)
        {
            await SaveToDb(request);
            await SendEmail(request);
        }

        private async Task SendEmail(GroupBookingRequest request)
        {
            try
            {
                var rooms = AssembleRooms(request);

                var email = new Email
                {
                    From = _tradePortalSettings.GroupBookings.EmailFrom,
                    To = _tradePortalSettings.GroupBookings.EmailTo,
                    ReplyTo = request.Email,
                    Subject = _tradePortalSettings.GroupBookings.Subject,
                    Template = _tradePortalSettings.GroupBookings.BodyTemplate,
                    Variables = GetTemplateVariables(request, rooms.ToString())
                };

                await _sesClient.SendEmail(email);
            }
            catch (Exception e)
            {
                _logger.LogError(e, "Group booking email sending failed.");
                throw new ApiException(ApiExceptionCodes.GroupBookingEmailSendingFailed, null, e);
            }
        }

        private static Dictionary<string, string> GetTemplateVariables(GroupBookingRequest request, string rooms)
        {
            return new Dictionary<string, string>
            {
                    {"TradeAgentName", request.AgentName},
                    {"Email", request.Email},
                    {"ABTANumber", request.ABTANumber},
                    {"NumberOfRooms", request.NumberOfRooms == 0 ? "I don't mind" : request.NumberOfRooms.ToString() },
                    {"Rooms", rooms},
                    {"Adults", request.TotalPassengers.Adults.ToString()},
                    {"Children", request.TotalPassengers.Children.ToString()},
                    {"Infants", request.TotalPassengers.Infants.ToString()},
                    {"DepartureAirport", request.DepartureAirport.Airport},
                    {"DepartureDate", request.DepartureDate.Date.ToString(CultureInfo.CurrentCulture)},
                    {"IAmFlexible", request.DepartureAirport.IAmFlexible.ToString()},
                    {"DurationOfHoliday", request.DurationOfHoliday.ToString()},
                    {"BoardBasis", request.BoardBasis},
                    {"DestinationHotelOrRegion", request.DestinationHotelOrRegion},
                    {"AdditionalDetails", request.AdditionalDetails}
            };
        }

        private StringBuilder AssembleRooms(GroupBookingRequest request)
        {
            var stringBuilder = new StringBuilder();

            foreach (var room in request.Rooms)
            {
                stringBuilder.AppendLine($"\tRoom {room.RoomNumber}");
                stringBuilder.AppendLine($"\t\tAdults: {room.Adults}");
                stringBuilder.AppendLine($"\t\tChildren: {room.Children}");
                stringBuilder.AppendLine($"\t\t\tAges of children: {string.Join(", ", room.ChildAges)}");
                stringBuilder.AppendLine($"\t\tInfants: {room.Infants}");
            }

            return stringBuilder;
        }

        private async Task SaveToDb(GroupBookingRequest request)
        {
            try
            {
                var groupBooking = new GroupBooking
                {
                    Id = Guid.NewGuid().ToString(),
                    Created = DateTime.UtcNow,
                    AgentName = request.AgentName,
                    Email = request.Email,
                    ABTANumber = request.ABTANumber,
                    NumberOfRooms = request.NumberOfRooms,
                    TotalPassengers = request.TotalPassengers,
                    DepartureAirport = request.DepartureAirport,
                    DepartureDate = request.DepartureDate,
                    DurationOfHoliday = request.DurationOfHoliday,
                    BoardBasis = request.BoardBasis,
                    DestinationHotelOrRegion = request.DestinationHotelOrRegion,
                    AdditionalDetails = request.AdditionalDetails,
                    Rooms = request.Rooms,
                };

                await _awsDbRepository.SaveAsync(groupBooking);
            }
            catch (Exception e)
            {
                _logger.LogError(e, "Group booking persisting failed.");
                throw new ApiException(ApiExceptionCodes.GroupBookingPersistingFailed, null, e);
            }
        }
    }
}