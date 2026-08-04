using AutoFixture;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;
using easyJet.Holidays.Api.Domain.Interfaces.Payment;
using easyJet.Holidays.Api.Domain.Services.Booking;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Tests.Domain;
using Microsoft.Extensions.Options;
using Moq;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Booking;

public partial class BookingRefundServiceTests
{
    private IFixture Fixture { get; }
    private readonly BookingRefundService _sut;
    private readonly Mock<IPaymentsService> _paymentsServiceMock;
    private readonly Mock<IBookingPaymentsRepository> _bookingPaymentsRepositoryMock;
    private readonly Mock<IOptions<ApiSettings>> _apiSettings;

    public BookingRefundServiceTests()
    {
        Fixture = FixtureUtils.AutoMoqFixture();
        _paymentsServiceMock = Fixture.Freeze<Mock<IPaymentsService>>();
        _bookingPaymentsRepositoryMock = Fixture.Freeze<Mock<IBookingPaymentsRepository>>();
        _apiSettings = Fixture.Freeze<Mock<IOptions<ApiSettings>>>();
        _apiSettings.SetupGet(x => x.Value).Returns(new ApiSettings()
        {
            Vouchers = new VoucherSettings()
            {
                BookingMemos = new BookingMemoSettings()
                {
                    Cred = new MemoSettings() { Code = "CRED" },
                    MovedToCredit = new MemoSettings() { Code = "REP3" }
                }
            },
            BookingsMemos = new BookingsMemosSettings
            {
                Cash = new MemoSettings() { Code = "RF", Description = "Refund" },
            }
        });
        
        _sut = Fixture.Freeze<BookingRefundService>();
    }
}