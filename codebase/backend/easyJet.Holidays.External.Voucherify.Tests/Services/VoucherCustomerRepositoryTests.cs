using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.Authentication;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Services;
using easyJet.Holidays.External.Voucherify.Models;
using easyJet.Holidays.External.Voucherify.Services;
using easyJet.Holidays.Tests.Domain;
using easyJet.Holidays.Tests.Domain.Mock;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;
using VVoucherify = Voucherify;

namespace easyJet.Holidays.External.Voucherify.Tests.Services
{
    public class VoucherCustomerRepositoryTests
    {
        private void BuildMainServices(IFixture _fixture, bool disableSort = false, bool disableReco = false)
        {
            var endpointProvider = _fixture.Freeze<Mock<BaseEndpointsProvider>>();
            var logger = _fixture.Freeze<Mock<ILogger<VoucherCustomersRepository>>>();
            var voucherifySettings = _fixture.Freeze<Mock<IOptions<VoucherifySettings>>>();

            voucherifySettings
                .SetupGet(x => x.Value)
                .Returns(new VoucherifySettings()
                {
                    Api = new VoucherifyApiSettings()
                    {
                        Vouchers = "/v1/vouchers",
                        Voucher = "v1/vouchers/{id}",
                        VoucherPublish = "/v1/vouchers/publish",
                        Customers = "/v1/customers",
                        Customer = "/v1/customers/{id}",
                        Redemptions = "/v1/redemptions",
                        ProcessRedemption = "/v1/vouchers/{voucher_code}/redemption",
                        ValidateRedemption = "/v1/vouchers/{voucher_code}/validate",
                        RollBackRedemption = "/v1/redemptions/{redemption_id}/rollback",
                        AddGiftBalance = "v1/vouchers/{id}/balance"
                    },
                    Host = "http://test"
                });
        }

        [Fact]
        public async Task Get_Success()
        {
            IFixture _fixture = FixtureUtils.AutoMoqFixture();

            BuildMainServices(_fixture);
            MocksProvider.BuildHttpContext(_fixture, true);

            var apiService = _fixture.Freeze<Mock<IApiService>>();
            var customer = new VVoucherify.DataModel.Customer()
            {
                SourceId = "test",
            };
            apiService
                .Setup(x => x.GetResponseContentAsync<CustomerGetRequest, CustomerCreateResponse>(It.IsAny<CustomerGetRequest>()))
                .Returns(Task.FromResult(new CustomerCreateResponse()
                {
                    Payload = new Domain.Models.Api.Payload.JsonApiPayload<VVoucherify.DataModel.Customer>()
                    {
                        Body = customer
                    }
                }));
            _fixture.Inject(apiService);

            var sut = _fixture.Create<VoucherCustomersRepository>();

            var actual = await sut.GetOrCreate("test", null);

            actual.Should().BeEquivalentTo(customer);
        }

        [Fact]
        public async Task Create_Success()
        {
            IFixture _fixture = FixtureUtils.AutoMoqFixture();

            BuildMainServices(_fixture);
            MocksProvider.BuildHttpContext(_fixture, true);

            var apiService = _fixture.Freeze<Mock<IApiService>>();
            var customerId = "test";
            CustomerDetails customer = new CustomerDetails()
            {
                FirstName = "firstName",
                LastName = "LastName",
                Email = "Email@email.com"
            };
            var customerResponseBody = new VVoucherify.DataModel.Customer()
            {
                SourceId = "test",
            };
            apiService
                .Setup(x => x.GetResponseContentAsync<CustomerCreateRequest, CustomerCreateResponse>(It.Is<CustomerCreateRequest>(y =>
                    y.Payload.Body.SourceId == customerId &&
                    y.Payload.Body.Name == $"{customer.FirstName} {customer.LastName}" &&
                    y.Payload.Body.Email == "email@email.com")))
                .Returns(Task.FromResult(new CustomerCreateResponse()
                {
                    Payload = new Domain.Models.Api.Payload.JsonApiPayload<VVoucherify.DataModel.Customer>()
                    {
                        Body = customerResponseBody
                    },
                }));
            _fixture.Inject(apiService);

            var sut = _fixture.Create<VoucherCustomersRepository>();

            var actual = await sut.Create(customerId, customer);

            actual.Should().BeEquivalentTo(customerResponseBody);
        }

        [Fact]
        public async Task Update_Success()
        {
            IFixture _fixture = FixtureUtils.AutoMoqFixture();

            BuildMainServices(_fixture);
            MocksProvider.BuildHttpContext(_fixture, true);

            var apiService = _fixture.Freeze<Mock<IApiService>>();
            var customerResponseBody = new VVoucherify.DataModel.Customer()
            {
                SourceId = "test",
            };
            apiService
                .Setup(x => x.GetResponseContentAsync<CustomerUpdateRequest, CustomerCreateResponse>(It.Is<CustomerUpdateRequest>(
                    y => y.Payload.Body.Name == "newName" && y.Payload.Body.SourceId == "newId")))
                .Returns(Task.FromResult(new CustomerCreateResponse()
                {
                    Payload = new Domain.Models.Api.Payload.JsonApiPayload<VVoucherify.DataModel.Customer>()
                    {
                        Body = customerResponseBody
                    }
                }));
            _fixture.Inject(apiService);

            var sut = _fixture.Create<VoucherCustomersRepository>();

            var actual = await sut.Update("test", "newId", "newName");

            actual.Should().BeEquivalentTo(customerResponseBody);
        }
    }
}
