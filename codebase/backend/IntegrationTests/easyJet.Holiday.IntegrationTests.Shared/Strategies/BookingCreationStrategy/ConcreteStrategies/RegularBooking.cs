using easyJet.Holiday.IntegrationTests.Shared.Api;
using easyJet.Holiday.IntegrationTests.Shared.Constants;
using easyJet.Holiday.IntegrationTests.Shared.Mappers;
using easyJet.Holiday.IntegrationTests.Shared.ModelConfiguration.Booking;
using easyJet.Holiday.IntegrationTests.Shared.ModelConfiguration.Offers;
using easyJet.Holiday.IntegrationTests.Shared.Models.Customers;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Guests;
using Force.DeepCloner;

namespace easyJet.Holiday.IntegrationTests.Shared.Strategies.BookingCreationStrategy.ConcreteStrategies;

[Obsolete]
public class RegularBooking : IBookingCreationStrategy
{
    private const int RETRY_POLICY_COUNT = 10;
    private readonly ISearchApi _searchApi;
    private readonly IBookingApi _bookingApi;
    private readonly AdultFaker _adultFaker;

    BookingCreationCause IBookingCreationStrategy.BookingCreationCause => BookingCreationCause.Regular;

    public RegularBooking(
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
        BookingResponse bookingResponse = null;

        for (int i = 0; i < RETRY_POLICY_COUNT; i++)
        {
            var request = getPackagesRequestFaker.Generate();

            //1. Search packages
            var packages = await _searchApi.GetPackages(request);

            if (packages.Content == null || !packages.Content.Offers.Any())
            {
                continue;
            }

            var offer = packages.Content.Offers[0];

            var validationRequest = new ValidateBookingRequest
            {
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
                    },
                ExtraLuggageInfo = offer.ExtraLuggageInfo.DeepClone()
            };

            // 2. Validate packages
            var validateResponse = await _bookingApi.ValidatePackage(validationRequest);

            if (validateResponse.Content == null)
            {
                i++;
                continue;
            }

            var leadPassenger = customerInfo.MapToLeadPassenger();

            var bookingCommitRequest = new BookingRequest
            {
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

            // 3. Commit booking
            var booking = await _bookingApi.Commit(bookingCommitRequest, Guid.NewGuid().ToString(), loginCookie);

            if (booking.Content == null)
            {
                i++;
                continue;
            }
            else
            {
                bookingResponse = booking.Content;
                break;
            }
        }

        return bookingResponse;
    }
}