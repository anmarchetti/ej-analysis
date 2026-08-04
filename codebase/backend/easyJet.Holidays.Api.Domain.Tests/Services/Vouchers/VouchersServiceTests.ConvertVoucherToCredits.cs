using AutoFixture;
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Authentication;
using easyJet.Holidays.Api.Domain.Services.Authentication;
using easyJet.Holidays.Api.Domain.Services.Vouchers;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Moq;
using Voucherify.DataModel;
using Xunit;
using Redemption = easyJet.Holidays.Api.Domain.Data.Vouchers.Redemption;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Vouchers
{
    public partial class VouchersServiceTests
    {
        [Theory]
        [AutoMoqData]
        public async Task ConvertVoucherToCredits_VoucherRedeemedButNewOneNotCreated_RollBackRedemption(string voucherCode, string customerId, int amount)
        {
            var voucherRepositoryMock = _fixture.Freeze<Mock<IVouchersRepository>>();

            var customerRepositoryMock = _fixture.Freeze<Mock<IVouchersCustomerRepository>>();

            var authenticationServiceMock = _fixture.Freeze<Mock<IAuthenticationService>>();

            var voucher = CreateCorrectGiftVoucher(voucherCode, true, null, amount);

            voucherRepositoryMock.Setup(repository => repository.Get(It.IsAny<string>())).ReturnsAsync(voucher);

            var redemption = new Redemption();
            redemption.SetProperty(x => x.Amount, amount);
            redemption.SetProperty(x => x.Voucher, voucher);

            voucherRepositoryMock
                .Setup(repository =>
                    repository.ProcessRedemption(It.IsAny<string>(), It.IsAny<decimal?>(), It.IsAny<string>(), It.IsAny<Dictionary<string, object>>()))
                .ReturnsAsync(redemption);

            authenticationServiceMock.Setup(service => service.GetCustomerIdWithErrorsHandling(It.IsAny<CustomerDetails>()))
                .ReturnsAsync(customerId);

            voucherRepositoryMock
                .Setup(repository => repository.Create(It.IsAny<string>(), It.IsAny<Dictionary<string, object>>(),
                    It.IsAny<decimal?>(), It.IsAny<DateTimeOffset?>()))
                .ThrowsAsync(new ApiException(new ExceptionCode()));

            customerRepositoryMock
                .Setup(repository => repository.GetOrCreate(It.IsAny<string>(), It.IsAny<CustomerDetails>()))
                .ReturnsAsync(new Customer()
                {
                    SourceId = customerId
                });

            var vouchersService = _fixture.Freeze<VouchersService>();

            Func<Task> act = () => vouchersService.ConvertVoucherToCredits(voucherCode);

            // Assert

            //should throw appropriate exception
            await act.Should().ThrowExactlyAsync<ApiException>().Where(ex => ex.Code.Code == ApiExceptionCodes.FailedRedeemVoucher.Code);
            //should do a redemption rollback
            voucherRepositoryMock.Verify(repository => repository.RollbackRedemption(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()), Times.Once);
        }
    }
}