using easyJet.Holiday.IntegrationTests.Shared.Api;
using easyJet.Holiday.IntegrationTests.Shared.Constants;
using easyJet.Holiday.IntegrationTests.Shared.Decorators;
using easyJet.Holiday.IntegrationTests.Shared.Mappers;
using easyJet.Holiday.IntegrationTests.Shared.ModelConfiguration.Booking;
using easyJet.Holiday.IntegrationTests.Shared.ModelConfiguration.Offers;
using easyJet.Holiday.IntegrationTests.Shared.Models.Customers;
using easyJet.Holiday.IntegrationTests.Shared.Models.Offer;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.RoomVariants;
using easyJet.Holidays.Api.Domain.Extensions;
using Force.DeepCloner;
using Refit;

namespace easyJet.Holiday.IntegrationTests.Shared.Strategies.BookingCreationStrategy.ConcreteStrategies;

[Obsolete]
public class RoomAndBoard : IBookingCreationStrategy
{
    private readonly ISearchApi _searchApi;
    private readonly IBookingApi _bookingApi;
    private readonly AdultFaker _adultFaker;

    BookingCreationCause IBookingCreationStrategy.BookingCreationCause => BookingCreationCause.RoomAndBoard;
    private const int RETRY_POLICY_COUNT = 10;

    public RoomAndBoard(
        ISearchApi searchApi,
        IBookingApi bookingApi,
        AdultFaker adultFaker)
    {
        _searchApi = searchApi;
        _bookingApi = bookingApi;
        _adultFaker = adultFaker;
    }

    public async Task<BookingResponse> CreateBooking(CustomerInfo customerInfo, string loginCookie, GetPackagesRequestFaker getPackagesRequestFaker)
    {
        BookingResponse? bookingResponse = null;
        int counter = 0;
        while (counter < RETRY_POLICY_COUNT && bookingResponse is null)
        {
            var request = getPackagesRequestFaker.Generate();

            //1.Search packages
            var packages = await _searchApi.GetPackages(request);

            if (packages.Content is null || packages.Content.Offers.IsNullOrEmpty())
                continue;


            for (int i = 0; i < packages.Content.Offers.Length; i++)
            {
                // 2.Select and validate package
                var offer = packages.Content.Offers[i];

                var validateResponse = await _bookingApi.ValidatePackage(Build(offer));

                if (validateResponse.Content == null)
                    continue;

                var leadPassenger = customerInfo.MapToLeadPassenger();

                // 3.Check if has available room and board options
                var roomVariantsSearchResponse = await _searchApi.OffersAlterations(Build(request, offer));

                if (roomVariantsSearchResponse.Content is null)
                    continue;

                if (!roomVariantsSearchResponse.Content.AltBoards.Any() && !roomVariantsSearchResponse.Content.Rooms.Any())
                    continue;

                // 4.Commit booking
                BookingRequest bookingCommitRequest = Build(customerInfo, offer, validateResponse, leadPassenger);

                var booking = await _bookingApi.Commit(bookingCommitRequest, Guid.NewGuid().ToString(), loginCookie);

                if (booking.Content is null)
                    continue;

                bookingResponse = booking.Content;
                break;
            }
            counter++;
        }

        return bookingResponse;
    }

    private static RoomVariantsSearchRequest Build(GetPackagesRequest request, Offer offer)
    {
        return new RoomVariantsSearchRequestDecorator
        {
            StartDate = request.StartDate,
            FlexibleDays = 0,
            Duration = new List<int> { request.Duration },
            Departure = offer.Transport.Routes[0].DepPt,
            Adult = request.Adults,
            Infant = request.Infants,
            Children = request.Children,
            RoomCode = offer.Accom.Unit[0].Code,
            AccommodationId = offer.Accom.Id,
            OutboundRouteId = offer.Transport.Routes[0].Id,
            InboundRouteId = offer.Transport.Routes[1].Id,
            PackageId = offer.Accom.PackageId,
            BoardType = offer.Accom.Unit[0].BoardType.Code
        };
    }

    private static ValidateBookingRequest Build(Offer offer)
    {
        return new ValidateBookingRequest
        {
            ExtraLuggageInfo = offer.ExtraLuggageInfo.DeepClone(),
            Offer = offer,
            Guests = new List<Person>
                {
                    new Person
                    {
                        Age = 30,
                        Sex = Sex.Unknown,
                        Type = PersonType.Adult
                    },
                    new Person
                    {
                        Age = 30,
                        Sex = Sex.Unknown,
                        Type = PersonType.Adult
                    }
                }
        };
    }

    private BookingRequest Build(CustomerInfo customerInfo, Offer offer, ApiResponse<ValidateBookingResponse> validateResponse, LeadPassenger leadPassenger)
    {
        return new BookingRequest
        {
            ExtraLuggageInfo = offer.ExtraLuggageInfo.DeepClone(),
            DeviceId = Guid.NewGuid().ToString(),
            Offer = offer,
            LeadPassenger = leadPassenger,
            Guests = new List<PersonWithDetails>
                {
                     customerInfo.MapToPersonWithDetails(true),
                    _adultFaker.Generate()
                },
            PaymentInfo = PaymentInfoConstants.CreatePaymentInfo(validateResponse.Content.PaymentInfo.BalanceDueAmount),
            BrowserInfo = BrowserInfoConstants.DefaultBrowserInfo()
        };
    }
}
