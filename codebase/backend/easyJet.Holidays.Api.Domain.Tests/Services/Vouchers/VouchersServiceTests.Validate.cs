using AutoFixture;
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Authentication;
using easyJet.Holidays.Api.Domain.Services.Authentication;
using easyJet.Holidays.Api.Domain.Services.Vouchers;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Moq;
using System.Net;
using Voucherify.Core.DataModel;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Vouchers
{
    public partial class VouchersServiceTests
    {
        [Theory]
        [AutoMoqData]
        public async Task Validate_NotFoundVoucher_ThrowExceptionNotFound(string voucherCode)
        {
            var voucherRepositoryMock = _fixture.Freeze<Mock<IVouchersRepository>>();

            voucherRepositoryMock.Setup(repository => repository.Get(It.IsAny<string>()))
                .ThrowsAsync(new ApiException(new ExceptionCode()));

            var vouchersService = _fixture.Freeze<VouchersService>();

            Func<Task> act = () => vouchersService.Validate(voucherCode);

            // Assert
            await act.Should().ThrowExactlyAsync<ApiException>().Where(ex => ex.Code.Code == ApiExceptionCodes.VoucherNotFound.Code && ex.StatusCode == HttpStatusCode.NotFound);
        }

        [Theory]
        [AutoMoqData]
        public async Task Validate_FoundVoucherWithEmptyCampaign_ThrowExceptionVoucherInvalid(string voucherCode)
        {
            var voucherRepositoryMock = _fixture.Freeze<Mock<IVouchersRepository>>();

            var voucher = CreateCorrectGiftVoucher(voucherCode);

            voucher.SetPrivateField("<Campaign>k__BackingField", "");

            voucherRepositoryMock.Setup(repository => repository.Get(It.IsAny<string>())).ReturnsAsync(voucher);

            var vouchersService = _fixture.Freeze<VouchersService>();

            Func<Task> act = () => vouchersService.Validate(voucherCode);

            // Assert
            await act.Should().ThrowExactlyAsync<ApiException>().Where(ex => ex.Code.Code == ApiExceptionCodes.VoucherInvalid.Code && ex.StatusCode == HttpStatusCode.BadRequest);
        }

        [Theory]
        [AutoMoqData]
        public async Task Validate_FoundNotActiveVoucher_ThrowExceptionVoucherNotActiveOrExpired(string voucherCode)
        {
            var voucherRepositoryMock = _fixture.Freeze<Mock<IVouchersRepository>>();

            var voucher = CreateCorrectGiftVoucher(voucherCode, false);
            
            voucherRepositoryMock.Setup(repository => repository.Get(It.IsAny<string>())).ReturnsAsync(voucher);

            var vouchersService = _fixture.Freeze<VouchersService>();

            Func<Task> act = () => vouchersService.Validate(voucherCode);

            // Assert
            await act.Should().ThrowExactlyAsync<ApiException>().Where(ex => ex.Code.Code == ApiExceptionCodes.VoucherNotActiveOrExpired.Code && ex.StatusCode == HttpStatusCode.BadRequest);
        }

        [Theory]
        [AutoMoqData]
        public async Task Validate_FoundExpiredVoucher_ThrowExceptionVoucherNotActiveOrExpired(string voucherCode)
        {
            var voucherRepositoryMock = _fixture.Freeze<Mock<IVouchersRepository>>();

            var voucher = CreateCorrectGiftVoucher(voucherCode);

            voucher.SetPrivateField("<ExpirationDate>k__BackingField", DateTime.UtcNow.AddDays(-1));

            voucherRepositoryMock.Setup(repository => repository.Get(It.IsAny<string>())).ReturnsAsync(voucher);

            var vouchersService = _fixture.Freeze<VouchersService>();

            Func<Task> act = () => vouchersService.Validate(voucherCode);

            // Assert
            await act.Should().ThrowExactlyAsync<ApiException>().Where(ex => ex.Code.Code == ApiExceptionCodes.VoucherNotActiveOrExpired.Code && ex.StatusCode == HttpStatusCode.BadRequest);
        }

        [Theory]
        [AutoMoqData]
        public async Task Validate_FutureStartDateVoucher_ThrowExceptionVoucherNotActiveOrExpired(string voucherCode)
        {
            var voucherRepositoryMock = _fixture.Freeze<Mock<IVouchersRepository>>();

            var voucher = CreateCorrectGiftVoucher(voucherCode);

            voucher.SetPrivateField("<StartDate>k__BackingField", DateTime.UtcNow.AddDays(+1));

            voucherRepositoryMock.Setup(repository => repository.Get(It.IsAny<string>())).ReturnsAsync(voucher);

            var vouchersService = _fixture.Freeze<VouchersService>();

            Func<Task> act = () => vouchersService.Validate(voucherCode);

            // Assert
            await act.Should().ThrowExactlyAsync<ApiException>().Where(ex => ex.Code.Code == ApiExceptionCodes.VoucherNotActiveOrExpired.Code && ex.StatusCode == HttpStatusCode.BadRequest);
        }

        [Theory]
        [AutoMoqData]
        public async Task Validate_FoundVoucherEmptyCustomCampaignMetadata_ThrowExceptionVoucherVoucherInvalid(string voucherCode)
        {
            var voucherRepositoryMock = _fixture.Freeze<Mock<IVouchersRepository>>();

            var voucher = CreateCorrectGiftVoucher(voucherCode);

            voucher.SetPrivateField("<Metadata>k__BackingField", new Metadata());

            voucherRepositoryMock.Setup(repository => repository.Get(It.IsAny<string>())).ReturnsAsync(voucher);

            var vouchersService = _fixture.Freeze<VouchersService>();

            Func<Task> act = () => vouchersService.Validate(voucherCode);

            // Assert
            await act.Should().ThrowExactlyAsync<ApiException>().Where(ex => ex.Code.Code == ApiExceptionCodes.VoucherInvalid.Code && ex.StatusCode == HttpStatusCode.BadRequest);
        }

        [Theory]
        [AutoMoqData]
        public async Task Validate_FoundRedeemedVoucherNotNullCustomer_ThrowExceptionVoucherVoucherRedeemedAlready(string voucherCode, string customerId)
        {
            var voucherRepositoryMock = _fixture.Freeze<Mock<IVouchersRepository>>();

            var voucher = CreateCorrectGiftVoucher(voucherCode, true, customerId);

            voucherRepositoryMock.Setup(repository => repository.Get(It.IsAny<string>())).ReturnsAsync(voucher);

            var vouchersService = _fixture.Freeze<VouchersService>();

            Func<Task> act = () => vouchersService.Validate(voucherCode);

            // Assert
            await act.Should().ThrowExactlyAsync<ApiException>().Where(ex => ex.Code.Code == ApiExceptionCodes.VoucherRedeemedAlready.Code && ex.StatusCode == HttpStatusCode.BadRequest);
        }

        [Theory]
        [AutoMoqData]
        public async Task Validate_FoundRedeemedVoucherZeroBalance_ThrowExceptionVoucherVoucherRedeemedAlready(string voucherCode)
        {
            var voucherRepositoryMock = _fixture.Freeze<Mock<IVouchersRepository>>();

            var voucher = CreateCorrectGiftVoucher(voucherCode, true, null, 0);

            voucherRepositoryMock.Setup(repository => repository.Get(It.IsAny<string>())).ReturnsAsync(voucher);

            var vouchersService = _fixture.Freeze<VouchersService>();

            Func<Task> act = () => vouchersService.Validate(voucherCode);

            // Assert
            await act.Should().ThrowExactlyAsync<ApiException>().Where(ex => ex.Code.Code == ApiExceptionCodes.VoucherRedeemedAlready.Code && ex.StatusCode == HttpStatusCode.BadRequest);
        }

        [Theory]
        [AutoMoqData]
        public async Task Validate_FoundRedeemedByCurrentUser_ThrowExceptionVoucherRedeemedAlreadyByYou(string voucherCode, string customerId)
        {
            var voucherRepositoryMock = _fixture.Freeze<Mock<IVouchersRepository>>();

            var authenticationServiceMock = _fixture.Freeze<Mock<IAuthenticationService>>();

            var voucher = CreateCorrectGiftVoucher(voucherCode, true, customerId);

            voucherRepositoryMock.Setup(repository => repository.Get(It.IsAny<string>())).ReturnsAsync(voucher);

            authenticationServiceMock.Setup(service => service.MappedCustomerId(It.IsAny<CustomerDetails>()))
                .ReturnsAsync(customerId);

            var vouchersService = _fixture.Freeze<VouchersService>();

            Func<Task> act = () => vouchersService.Validate(voucherCode);

            // Assert
            await act.Should().ThrowExactlyAsync<ApiException>().Where(ex => ex.Code.Code == ApiExceptionCodes.VoucherRedeemedAlreadyByYou.Code && ex.StatusCode == HttpStatusCode.BadRequest);
        }

        [Theory]
        [AutoMoqData]
        public async Task Validate_FoundCorrectGiftVoucher_ValidationPassed(string voucherCode, int amount, string currency)
        {
            var voucherRepositoryMock = _fixture.Freeze<Mock<IVouchersRepository>>();

            var voucher = CreateCorrectGiftVoucher(voucherCode, true, null, amount, currency);

            voucherRepositoryMock.Setup(repository => repository.Get(It.IsAny<string>())).ReturnsAsync(voucher);

            var vouchersService = _fixture.Freeze<VouchersService>();

            var validateVoucher = await vouchersService.Validate(voucherCode);

            validateVoucher.Active.Should().BeTrue();
            validateVoucher.VoucherCode.Should().BeEquivalentTo(voucherCode);
            validateVoucher.Amount?.Should().Be((decimal)amount / 100); //converting amount to the voucherify format;
            validateVoucher.Currency?.Should().Be(currency);
        }

        [Theory]
        [AutoMoqData]
        public async Task Validate_CorrectDiscountVoucher_Ok(string voucherCode, string customerId)
        {
            var voucherRepositoryMock = _fixture.Freeze<Mock<IVouchersRepository>>();

            var authenticationServiceMock = _fixture.Freeze<Mock<IAuthenticationService>>();

            var voucher = CreateCorrectDiscountVoucher(voucherCode, true, customerId);

            voucherRepositoryMock.Setup(repository => repository.Get(It.IsAny<string>())).ReturnsAsync(voucher);

            authenticationServiceMock.Setup(service => service.MappedCustomerId(It.IsAny<CustomerDetails>()))
                .ReturnsAsync(customerId);

            var vouchersService = _fixture.Freeze<VouchersService>();

            var validate = await vouchersService.Validate(voucherCode);

            validate.Active.Should().BeTrue();
            validate.VoucherCode.Should().BeEquivalentTo(voucherCode);
            validate.VoucherType.Should().Be(Domain.Data.Vouchers.VoucherType.PROMO_VOUCHER);
        }

        [Theory]
        [AutoMoqData]
        public async Task Validate_DiscountVoucherWithoutMetadata_ThrowExceptionVoucherVoucherInvalid(string voucherCode, string customerId)
        {
            var voucherRepositoryMock = _fixture.Freeze<Mock<IVouchersRepository>>();

            var authenticationServiceMock = _fixture.Freeze<Mock<IAuthenticationService>>();

            var voucher = CreateCorrectDiscountVoucher(voucherCode, true, customerId);

            //override correct discount voucher metada
            voucher.SetPrivateField("<Metadata>k__BackingField", new Metadata()
            {
                {_singleUsePromoVouchersMetaData, null},
            });

            voucherRepositoryMock.Setup(repository => repository.Get(It.IsAny<string>())).ReturnsAsync(voucher);

            authenticationServiceMock.Setup(service => service.MappedCustomerId(It.IsAny<CustomerDetails>()))
                .ReturnsAsync(customerId);

            var vouchersService = _fixture.Freeze<VouchersService>();

            Func<Task> act = () => vouchersService.Validate(voucherCode);

            // Assert
            await act.Should().ThrowExactlyAsync<ApiException>().Where(ex => ex.Code.Code == ApiExceptionCodes.VoucherInvalid.Code && ex.StatusCode == HttpStatusCode.BadRequest);
        }
    }
}