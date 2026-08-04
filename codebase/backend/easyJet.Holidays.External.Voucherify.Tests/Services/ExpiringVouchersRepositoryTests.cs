using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.Vouchers;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Voucherify.Api;
using easyJet.Holidays.External.Voucherify.Models.Vouchers;
using easyJet.Holidays.External.Voucherify.Services;
using easyJet.Holidays.Tests.Domain;
using easyJet.Holidays.Tests.Domain.Mock;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;
using VoucherType = easyJet.Holidays.Api.Domain.Data.Vouchers.VoucherType;

namespace easyJet.Holidays.External.Voucherify.Tests.Services
{
    public class ExpiringVouchersRepositoryTests
    {
        private IFixture _fixture;
        private Mock<IApiService> _apiServiceMock;
        private Mock<ILogger<ExpiringVouchersRepository>> _loggerMock;
        private readonly IOptions<VoucherifySettings> _voucherifySettings;
        private EndpointsProvider _endpointProvider;
        private Mock<IHttpContextAccessor> _hca;
        private readonly ExpiringVouchersRepository _sut;

        public ExpiringVouchersRepositoryTests()
        {
            _fixture = FixtureUtils.AutoMoqFixture();
            _apiServiceMock = _fixture.Freeze<Mock<IApiService>>();
            _loggerMock = _fixture.Freeze<Mock<ILogger<ExpiringVouchersRepository>>>();

            _voucherifySettings = Options.Create(new VoucherifySettings()
            {
                Host = "https://test.voucherify.io",
                Api = new VoucherifyApiSettings()
                {
                    Voucher = "v1/vouchers/{id}",
                    Vouchers = "/v1/vouchers",
                    Customer = "/v1/customers/{id}",
                }
            });
            _fixture.Inject(_voucherifySettings);

            _hca = MocksProvider.BuildHttpContext(_fixture);
            _endpointProvider = _fixture.Freeze<EndpointsProvider>();

            _sut = new ExpiringVouchersRepository(_apiServiceMock.Object,
                _endpointProvider,
                _hca.Object, _loggerMock.Object);
        }

        [Fact]
        public async Task GetExpiringVouchers_LimitArgumentIsWrong_ThrowException()
        {
            //Arrange
            int limit = 0;
            int page = 1;
            int expirationDays = 10;

            //Act
            var act = _sut.GetAllExpiringVouchers(VoucherType.GIFT_VOUCHER, expirationDays, true, limit);

            //Assert
            await Assert.ThrowsAsync<ArgumentOutOfRangeException>(() => act);
        }

        [Fact]
        public async Task GetExpiringVouchers_ExpirationDaysArgumentIsWrong_ThrowException()
        {
            //Arrange
            int limit = 100;
            int page = 1;
            int expirationDays = -10;

            //Act
            var act = _sut.GetAllExpiringVouchers(VoucherType.GIFT_VOUCHER, expirationDays, true, limit);

            //Assert
            await Assert.ThrowsAsync<ArgumentOutOfRangeException>(() => act);
        }

        [Theory]
        [AutoMoqData]
        public async Task GetAllExpiringVouchers_NotOnePage_MultiplyRequests(List<VoucherWithCustomer> vouchers)
        {
            //Arrange
            var body = new VouchersList
            {
                Vouchers = vouchers,
            };
            body.SetPrivateProperty("Total", 532);
            _apiServiceMock
                .Setup(service =>
                    service.GetResponseContentAsync<VouchersListRequest, VouchersListResponse>(
                        It.IsAny<VouchersListRequest>()))
                .ReturnsAsync(new VouchersListResponse()
                {
                    Payload = new VJsonApiPayload<VouchersList>()
                    {
                        Body = body
                    }
                });

            //Act
            await _sut.GetAllExpiringVouchers(VoucherType.GIFT_VOUCHER, 365, true, 100);

            //Assert
            //total elements 532, limit per page = 100 => 6 times requested
            _apiServiceMock.Verify(
                service =>
                    service.GetResponseContentAsync<VouchersListRequest, VouchersListResponse>(
                        It.IsAny<VouchersListRequest>()),
                Times.Exactly(6));
        }

        [Theory]
        [AutoMoqData]
        public async Task GetAllExpiringVouchers_OnePage_OneRequest(List<VoucherWithCustomer> vouchers)
        {
            //Arrange
            var body = new VouchersList
            {
                Vouchers = vouchers,
            };
            body.SetPrivateProperty("Total", 99);

            _apiServiceMock
                .Setup(service =>
                    service.GetResponseContentAsync<VouchersListRequest, VouchersListResponse>(
                        It.IsAny<VouchersListRequest>()))
                .ReturnsAsync(new VouchersListResponse()
                {
                    Payload = new VJsonApiPayload<VouchersList>()
                    {
                        Body = body
                    }
                });
            //Act
            await _sut.GetAllExpiringVouchers(VoucherType.GIFT_VOUCHER, 365, true, 100);

            //Assert
            //total elements 532, limit per page = 100 => 6 times requested
            _apiServiceMock.Verify(
                service =>
                    service.GetResponseContentAsync<VouchersListRequest, VouchersListResponse>(It.IsAny<VouchersListRequest>()),
                Times.Once);
        }
    }
}