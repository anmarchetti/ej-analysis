using easyJet.Holidays.Api.Domain.Data.PackageOffers.AccommodationOffer;
using easyJet.Holidays.External.Atcom.Extensions;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.External.Atcom.Tests.Extensions;

public class AmendHotelBaseSearchRequestExtensionsTests
{
    public static IEnumerable<object[]> AlternativeHotelSearchRequestData =>
        new List<object[]>
        {
            new object[]
            {
                new AlternativeHotelsSearchRequest
                {
                    Adults = 2,
                    Infants = 1,
                    Children = 2,
                    ChildAges = new []{ "5", "10"},
                    Proms = new List<string> { "PROMO1", "PROMO2" },
                    AccomCode = "HOTEL123",
                    BookingStartDate = "2023-07-01",
                    Duration = 7,
                    RoomComposition = new Dictionary<int, string> { { 1, "Double" }, { 2, "Single" } },
                    DepartureAirportCode = "JFK",
                    ArrivalAirportCode = "LHR",
                    OutboundDepartureDate = "2023-07-01",
                    OutboundFlightNumber = "FL123",
                    OutboundArrivalDate = "2023-07-02",
                    InboundDepartureDate = "2023-07-08",
                    InboundFlightNumber = "FL456",
                    InboundArrivalDate = "2023-07-09",
                    RouteTotalPrice = 100
                },
                "https://example.com/search?{0}",
                "https://example.com/search?pax_ad=2&pax_in=1&pax_ch=2&ch_age=5,10&rooms=2&rm_1=Double&rm_2=Single&cur_tra_o=JFK/LHR/2023-07-01/FL123/2023-07-02&cur_tra_i=LHR/JFK/2023-07-08/FL456/2023-07-09&dep=JFK&prom=PROMO1,PROMO2&prom_no=2&cur_accom=HOTEL123/2023-07-01/7&cur_fltprc=100"
            },
            new object[]
            {
                new AlternativeHotelsSearchRequest
                {
                    Adults = 1,
                    Infants = 0,
                    Children = 0,
                    Proms = new List<string>(),
                    AccomCode = "HOTEL999",
                    BookingStartDate = "2023-08-01",
                    Duration = 3,
                    RoomComposition = new Dictionary<int, string> { { 1, "Single" } },
                    DepartureAirportCode = "LAX",
                    ArrivalAirportCode = "SFO",
                    OutboundDepartureDate = "2023-08-01",
                    OutboundFlightNumber = "FL789",
                    OutboundArrivalDate = "2023-08-01",
                    InboundDepartureDate = "2023-08-04",
                    InboundFlightNumber = "FL987",
                    InboundArrivalDate = "2023-08-04"
                },
                "https://example.com/search?{0}",
                "https://example.com/search?pax_ad=1&pax_in=0&pax_ch=0&rooms=1&rm_1=Single&cur_tra_o=LAX/SFO/2023-08-01/FL789/2023-08-01&cur_tra_i=SFO/LAX/2023-08-04/FL987/2023-08-04&dep=LAX&cur_accom=HOTEL999/2023-08-01/3&cur_fltprc=0"
            },
            new object[]
            {
                new AlternativeHotelsSearchRequest
                {
                    Adults = 4,
                    Infants = 2,
                    Children = 0,
                    Proms = new List<string> { "SUMMER2023" },
                    AccomCode = "RESORT456",
                    BookingStartDate = "2023-12-15",
                    Duration = 10,
                    RoomComposition = new Dictionary<int, string> { { 1, "FamilySuite" }, { 2, "SingleRoom" } },
                    DepartureAirportCode = "ORD",
                    ArrivalAirportCode = "MIA",
                    OutboundDepartureDate = "2023-12-15",
                    OutboundFlightNumber = "FL1234",
                    OutboundArrivalDate = "2023-12-15",
                    InboundDepartureDate = "2023-12-25",
                    InboundFlightNumber = "FL4321",
                    InboundArrivalDate = "2023-12-25"
                },
                "https://example.com/search?{0}",
                "https://example.com/search?pax_ad=4&pax_in=2&pax_ch=0&rooms=2&rm_1=FamilySuite&rm_2=SingleRoom&cur_tra_o=ORD/MIA/2023-12-15/FL1234/2023-12-15&cur_tra_i=MIA/ORD/2023-12-25/FL4321/2023-12-25&dep=ORD&prom=SUMMER2023&prom_no=1&cur_accom=RESORT456/2023-12-15/10&cur_fltprc=0"
            },
            new object[]
            {
                new AlternativeHotelsSearchRequest
                {
                    Adults = 0,
                    Infants = 0,
                    Children = 0,
                    Proms = new List<string>(),
                    AccomCode = "HOTEL000",
                    BookingStartDate = "2023-11-01",
                    Duration = 0,
                    RoomComposition = new Dictionary<int, string>(),
                    DepartureAirportCode = "XYZ",
                    ArrivalAirportCode = "ABC",
                    OutboundDepartureDate = "2023-11-01",
                    OutboundFlightNumber = "FL000",
                    OutboundArrivalDate = "2023-11-01",
                    InboundDepartureDate = "2023-11-02",
                    InboundFlightNumber = "FL001",
                    InboundArrivalDate = "2023-11-02"
                },
                "https://example.com/search?{0}",
                "https://example.com/search?pax_ad=0&pax_in=0&pax_ch=0&rooms=0&cur_tra_o=XYZ/ABC/2023-11-01/FL000/2023-11-01&cur_tra_i=ABC/XYZ/2023-11-02/FL001/2023-11-02&dep=XYZ&cur_accom=HOTEL000/2023-11-01/0&cur_fltprc=0"
            }
        };

    [Theory]
    [MemberData(nameof(AlternativeHotelSearchRequestData))]
    public void BuildAtcomQueryParams_ShouldReturnCorrectQueryString(
        AlternativeHotelsSearchRequest request, 
        string requestTemplate, 
        string expected)
    {
        // Act
        var result = request.BuildAtcomQueryParams(requestTemplate);

        // Assert
        result.Should().Be(expected);
    }
}