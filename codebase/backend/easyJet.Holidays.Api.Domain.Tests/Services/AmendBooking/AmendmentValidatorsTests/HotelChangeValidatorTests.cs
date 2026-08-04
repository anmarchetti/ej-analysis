using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Services.AmendBooking.AmendmentValidators;
using easyJet.Holidays.Api.Domain.Services.Luggage;
using easyJet.Holidays.Api.Domain.Settings;
using FluentAssertions;
using FluentAssertions.Execution;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.AmendBooking.AmendmentValidatorsTests;

public class HotelChangeValidatorTests
{
    private readonly Mock<ILuggageService> _luggageServiceMock = new();
    private readonly HotelChangeValidator _sut;

    public HotelChangeValidatorTests()
    {
        var settings = Options.Create(new ApiSettings
        {
            AmendBookingMemo = new AmendBookingMemoSettings
            {
                AccommodationChange = new MemoSettings
                {
                    Code = "AMD11"
                }
            }
        });

        _sut = new HotelChangeValidator(_luggageServiceMock.Object, settings);
    }

    [Fact]
    public void Constructor_ThrowsException_WhenApiSettingsNull()
    {
        // Act
        var action = () => new HotelChangeValidator(_luggageServiceMock.Object, null);

        // Assert
        action.Should().Throw<ArgumentNullException>();
    }

    [Theory]
    [MemberData(nameof(ValidateAmendHotelTestData))]
    public async Task ValidateAmendHotel(BookingResponse booking, Memo[] memos, AmendBookingSetting settings, 
        bool bookingContainsSportEquipment, bool expectedIsHotelChangeEnabled, ICollection<AmendBookingStatus> expectedBookingStatus)
    {
        //Arrange
        _luggageServiceMock
                .Setup(x => x.ContainsSportEquipment(It.IsAny<IEnumerable<ExtraLuggageItem>>()))
                .ReturnsAsync(bookingContainsSportEquipment);

        // Act
        await _sut.Validate(booking, memos, settings);

        // Assert
        using (new AssertionScope())
        {
            booking.AmendmentInfo.Accom.Should().Be(expectedIsHotelChangeEnabled);
            booking.AmendmentInfo.AmendBookingStatus.Should().BeEquivalentTo(expectedBookingStatus);
        }
    }

    public static TheoryData<BookingResponse, Memo[], AmendBookingSetting, bool, bool, ICollection<AmendBookingStatus>> ValidateAmendHotelTestData()
    {
        var testCases = new TheoryData<BookingResponse, Memo[], AmendBookingSetting, bool, bool, ICollection<AmendBookingStatus>>
        {
            { CreateBooking(1, 1000), [], new AmendBookingSetting { IsAmendHotelEnabled = true},
                false, true, [] },
            { CreateBooking(1, 1000), [], new AmendBookingSetting { IsAmendHotelEnabled = false},
                false, false, [AmendBookingStatus.AmendHotelDisabledOnSite] },
            { CreateBooking(1, 1000), [], new AmendBookingSetting { IsAmendHotelEnabled = true, AmendHotelThresholdHours = 10000},
                false, false, [AmendBookingStatus.AmendHotelDisabledByTimeBound] },
            { CreateBooking(2, 1000), [], new AmendBookingSetting { IsAmendHotelEnabled = true, AmendHotelThresholdHours = 100},
                false, false, [AmendBookingStatus.AmendHotelDisabledByHavingMultipleRooms] },
            { CreateBooking(1, 1000), [], new AmendBookingSetting { IsAmendHotelEnabled = false, AmendHotelThresholdHours = 10000},
                false, false, [AmendBookingStatus.AmendHotelDisabledOnSite, AmendBookingStatus.AmendHotelDisabledByTimeBound] },
            { CreateBooking(2, 1000), [], new AmendBookingSetting { IsAmendHotelEnabled = false, AmendHotelThresholdHours = 10000},
                false, false, [AmendBookingStatus.AmendHotelDisabledOnSite, AmendBookingStatus.AmendHotelDisabledByTimeBound,
                    AmendBookingStatus.AmendHotelDisabledByHavingMultipleRooms] },
            { CreateBooking(1, 1000), [], new AmendBookingSetting { IsAmendHotelEnabled = true, AmendHotelThresholdHours = 100},
                true, false, [AmendBookingStatus.AmendHotelDisabledBySportEquipment] },
            { CreateBooking(1, 1000), [], new AmendBookingSetting { IsAmendHotelEnabled = false, AmendHotelThresholdHours = 10000},
                true, false, [AmendBookingStatus.AmendHotelDisabledOnSite, AmendBookingStatus.AmendHotelDisabledByTimeBound,
                    AmendBookingStatus.AmendHotelDisabledBySportEquipment] },
            { CreateBooking(1, 800), [], new AmendBookingSetting { IsAmendHotelEnabled = true, AmendHotelCount = 3},
                false, true, [] },
            { CreateBooking(1, 800), Enumerable.Range(0, 2).Select(x => new Memo { Code = "AMD11"}).ToArray(),
                new AmendBookingSetting { IsAmendHotelEnabled = true, AmendHotelCount = 3}, false, true, [] },
            { CreateBooking(1, 800), Enumerable.Range(0, 3).Select(x => new Memo { Code = "AMD11"}).ToArray(),
                new AmendBookingSetting { IsAmendHotelEnabled = true, AmendHotelCount = 3}, false, false, 
                [ AmendBookingStatus.AmendHotelDisabledByChangeCountLimit] },
            { CreateBooking(1, 800), Enumerable.Range(0, 5).Select(x => new Memo { Code = "AMD11"}).ToArray(),
                new AmendBookingSetting { IsAmendHotelEnabled = true, AmendHotelCount = 3, AmendHotelThresholdHours = 1000}, 
                false, false, [ AmendBookingStatus.AmendHotelDisabledByChangeCountLimit, AmendBookingStatus.AmendHotelDisabledByTimeBound] }
        };

        return testCases;
    }

    private static BookingResponse CreateBooking(int numberOfRooms, int hoursBeforeDeparture)
    {
        return new BookingResponse
        {
            Package = new BookingPackage
            {
                Accom = new BookingAccommodation
                {
                    Rooms = Enumerable.Range(0, numberOfRooms).Select(x => new Unit()).ToList(),
                },
                Transport = new Transport
                {
                    Routes = new List<Route>
                    {
                        new Route
                        {
                            Direction = Direction.Outbound,
                            DepDate = DateTimeOffset.Now.AddHours(hoursBeforeDeparture)
                        },
                        new Route
                        {
                            Direction = Direction.Inbound
                        }
                    }
                }
            },
            AmendmentInfo = new AmendmentsInfo
            {
                Accom = true
            }
        };
    }
}
