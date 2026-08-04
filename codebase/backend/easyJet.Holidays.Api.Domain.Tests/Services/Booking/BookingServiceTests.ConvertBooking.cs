namespace easyJet.Holidays.Api.Domain.Tests.Services.Booking
{
    public partial class BookingServiceTests
    {
        /*
        [Fact]
        public void ConvertBooking_BookingCannotBeConverted_ThrowException()
        {
            // Arrange
            var settings = Options.Create(new ApiSettings
            {
                Vouchers = new VoucherSettings
                {
                    CancellationEnable = false
                }
            });

            var fixture = FixtureUtils.AutoMoqFixture();
            //var bookingRepositoryMock = fixture.Freeze<Mock<IBookingRepository>>();
            //bookingRepositoryMock.Setup(b => b.GetBookingMemo(It.IsAny<string>())).ReturnsAsync(new List<Data.Booking.Memo>());

            fixture.Inject(settings);

            var sut = fixture.Freeze<BookingService>(); 

            //var booking = new Data.Booking.BookingResponse
            //{
            //    BookingStatus = bookingStatus,
            //    PaymentInfo = new Data.Booking.PriceInfo
            //    {
            //        BalanceDueAmount = 0
            //    },
            //    Package = new Data.Booking.BookingPackage
            //    {
            //        Transport = new Data.PackageOffers.Transport
            //        {
            //            Routes = new List<Data.PackageOffers.Route> {
            //                new Data.PackageOffers.Route {
            //                    Direction = Data.PackageOffers.Direction.Outbound,
            //                    DepDate = new DateTimeOffset(2020, 08, 1, 0, 0, 0, TimeSpan.Zero)
            //                }
            //            }
            //        }
            //    }
            //};
            var request = new Data.Booking.GetBookingRequest
            {
                BookingReference = "REF",
                Date = DateTimeOffset.Now.Date,
                LastName = "TEST"
            };

            // Act
            Func<Task> act = () => sut.ConvertBooking(request);

            // Assert
            act.Should().ThrowExactly<ApiException>().Where(ex => ex.Code.Code == ApiExceptionCodes.BookingCreditForbidden.Code);
        }
        */
    }
}
