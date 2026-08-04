using AutoFixture;
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Services;
using easyJet.Holidays.External.Voucherify.Models.Spend;
using easyJet.Holidays.External.Voucherify.Models.ValidateRedemption;
using easyJet.Holidays.External.Voucherify.Models.Vouchers;
using easyJet.Holidays.External.Voucherify.Services;
using easyJet.Holidays.Tests.Domain;
using easyJet.Holidays.Tests.Domain.Mock;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using System.Net;
using Voucherify.DataModel;
using Xunit;
using KeyValuePair = System.Collections.Generic.KeyValuePair;
using Redemption = easyJet.Holidays.Api.Domain.Data.Vouchers.Redemption;
using Voucher = easyJet.Holidays.Api.Domain.Data.Vouchers.Voucher;
using VVoucherify = Voucherify;

namespace easyJet.Holidays.External.Voucherify.Tests.Services
{
    public class VouchersRepositoryTests
    {
        private void BuildMainServices(IFixture _fixture, bool disableSort = false, bool disableReco = false)
        {
            var endpointProvider = _fixture.Freeze<Mock<BaseEndpointsProvider>>();
            var logger = _fixture.Freeze<Mock<ILogger<VouchersRepository>>>();
            var voucherifySettings = _fixture.Freeze<Mock<IOptions<VoucherifySettings>>>();
            var apiSettings = _fixture.Freeze<Mock<IOptions<ApiSettings>>>();

            apiSettings
                .SetupGet(x => x.Value)
                .Returns(new ApiSettings()
                {
                    Vouchers = new VoucherSettings()
                    {
                        Metadata = new Dictionary<string, object>(),
                        Campaign = "test",
                        ExpirationMonths = 12,
                        Category = "test",
                    }
                });

            voucherifySettings
                .SetupGet(x => x.Value)
                .Returns(new VoucherifySettings()
                {
                    RollbackRetryPolicy = new RetryPolicySettings()
                    {
                        RetryCount = 1,
                        SleepMls = 100,
                    },
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
                    Host = "http://test",
                    ShowExpiredAndUsedVouchersInYears = 2
                });
        }

        [Fact]
        public async Task Create_Create()
        {
            IFixture _fixture = FixtureUtils.AutoMoqFixture();

            BuildMainServices(_fixture);
            MocksProvider.BuildHttpContext(_fixture, true);

            var apiService = _fixture.Freeze<Mock<IApiService>>();
            var v1 = new Voucher();
            v1.SetProperty(x => x.Active, true);
            v1.SetProperty(x => x.Code, "test_v");
            apiService
                .Setup(x => x.GetResponseContentAsync<VoucherCreateRequest, VoucherCreateResponse>(It.IsAny<VoucherCreateRequest>()))
                .Returns(Task.FromResult(new VoucherCreateResponse()
                {
                    Payload = new Domain.Models.Api.Payload.JsonApiPayload<Voucher>
                    {
                        Body = v1
                    }
                }));
            _fixture.Inject(apiService);

            var sut = _fixture.Create<VouchersRepository>();

            var actual = await sut.Create("voucherCode", new Dictionary<string, object>());

            actual.Should().BeEquivalentTo(v1);
        }

        [Fact]
        public async Task CreateOrGet_Create_with_Expiration_2359()
        {
            IFixture _fixture = FixtureUtils.AutoMoqFixture();

            BuildMainServices(_fixture);
            MocksProvider.BuildHttpContext(_fixture, true);

            var apiService = _fixture.Freeze<Mock<IApiService>>();
            var v1 = new Voucher();
            v1.SetProperty(x => x.Active, true);
            v1.SetProperty(x => x.Code, "test_v");
            apiService
                .Setup(x => x.GetResponseContentAsync<VoucherCreateRequest, VoucherCreateResponse>(It.IsAny<VoucherCreateRequest>()))
                .Returns(Task.FromResult(new VoucherCreateResponse()
                {
                    Payload = new Domain.Models.Api.Payload.JsonApiPayload<Voucher>
                    {
                        Body = v1
                    }
                }));
            _fixture.Inject(apiService);

            var sut = _fixture.Create<VouchersRepository>();

            await sut.Create("voucherCode", new Dictionary<string, object>());

            apiService.Verify(x => x.GetResponseContentAsync<VoucherCreateRequest, VoucherCreateResponse>(It.Is<VoucherCreateRequest>(
                r => r.Payload.Body.ExpirationDate.Value.Hour == 23 && r.Payload.Body.ExpirationDate.Value.Minute == 59 && r.Payload.Body.ExpirationDate.Value.Second == 59)),
                Times.Once);
        }

        [Fact]
        public async Task CreateOrGet_CreateWithExpirationDate_SetDateCorrectly()
        {
            IFixture _fixture = FixtureUtils.AutoMoqFixture();
            var expiredDate = DateTimeOffset.UtcNow;

            BuildMainServices(_fixture);
            MocksProvider.BuildHttpContext(_fixture, true);

            var apiService = _fixture.Freeze<Mock<IApiService>>();
            var v1 = new Voucher();
            v1.SetProperty(x => x.Active, true);
            v1.SetProperty(x => x.Code, "test_v");
            apiService
                .Setup(x => x.GetResponseContentAsync<VoucherCreateRequest, VoucherCreateResponse>(It.IsAny<VoucherCreateRequest>()))
                .Returns(Task.FromResult(new VoucherCreateResponse()
                {
                    Payload = new Domain.Models.Api.Payload.JsonApiPayload<Voucher>
                    {
                        Body = v1
                    }
                }));
            _fixture.Inject(apiService);

            var sut = _fixture.Create<VouchersRepository>();

            await sut.Create("voucherCode", new Dictionary<string, object>(), null, expiredDate);

            apiService.Verify(x => x.GetResponseContentAsync<VoucherCreateRequest, VoucherCreateResponse>(It.Is<VoucherCreateRequest>(
                r => r.Payload.Body.ExpirationDate.Value.Hour == 23
                && r.Payload.Body.ExpirationDate.Value.Minute == 59
                && r.Payload.Body.ExpirationDate.Value.Second == 59
                && r.Payload.Body.ExpirationDate.Value.Day == expiredDate.Day
                && r.Payload.Body.ExpirationDate.Value.Month == expiredDate.Month
                && r.Payload.Body.ExpirationDate.Value.Year == expiredDate.Year)),
                Times.Once);
        }

        [Fact]
        public async Task CreateOrGet_Get()
        {
            IFixture _fixture = FixtureUtils.AutoMoqFixture();

            BuildMainServices(_fixture);
            MocksProvider.BuildHttpContext(_fixture, true);

            var apiService = _fixture.Freeze<Mock<IApiService>>();
            var v1 = new Voucher();
            v1.SetProperty(x => x.Active, true);
            v1.SetProperty(x => x.Code, "test_v");

            var ex = new Exception();
            var apiEx = new ApiClientErrorResponseException(HttpStatusCode.Conflict, null);

            apiService
                .Setup(x => x.GetResponseContentAsync<VoucherCreateRequest, VoucherCreateResponse>(It.IsAny<VoucherCreateRequest>()))
                .Throws(new Exception("test", new Exception("test1", new ApiClientErrorResponseException(HttpStatusCode.Conflict, null))));

            apiService
                .Setup(x => x.GetResponseContentAsync<VoucherGetRequest, VoucherCreateResponse>(It.IsAny<VoucherGetRequest>()))
                .Returns(Task.FromResult(new VoucherCreateResponse()
                {
                    Payload = new Domain.Models.Api.Payload.JsonApiPayload<Voucher>
                    {
                        Body = v1
                    }
                }));

            _fixture.Inject(apiService);

            var sut = _fixture.Create<VouchersRepository>();

            Func<Task> act = async () => await sut.Create("voucherCode", new Dictionary<string, object>());
            await act.Should().ThrowAsync<Exception>();

        }

        [Fact]
        public async Task CreateOrGet_Fail()
        {
            IFixture _fixture = FixtureUtils.AutoMoqFixture();

            BuildMainServices(_fixture);
            MocksProvider.BuildHttpContext(_fixture, true);

            var apiService = _fixture.Freeze<Mock<IApiService>>();
            apiService
                .Setup(x => x.GetResponseContentAsync<VoucherCreateRequest, VoucherCreateResponse>(It.IsAny<VoucherCreateRequest>()))
                .Throws(new Exception("test"));
            _fixture.Inject(apiService);

            var sut = _fixture.Create<VouchersRepository>();
            Exception e = null;
            try
            {
                var actual = await sut.Create("voucherCode", new Dictionary<string, object>());
            }
            catch (Exception ex)
            {
                e = ex;
            }

            e.Should().NotBeNull();
        }

        [Theory]
        [AutoMoqData]
        public async Task UpdateMeta(DateTime dateTime)
        {
            IFixture _fixture = FixtureUtils.AutoMoqFixture();

            BuildMainServices(_fixture);
            MocksProvider.BuildHttpContext(_fixture, true);

            var apiService = _fixture.Freeze<Mock<IApiService>>();
            var v1 = new Voucher();
            v1.SetProperty(x => x.Active, true);
            v1.SetProperty(x => x.Code, "test_v");
            v1.SetProperty(x => x.ExpirationDate, dateTime);
            apiService
                .Setup(x => x.GetResponseContentAsync<VoucherUpdateRequest, VoucherCreateResponse>(It.Is<VoucherUpdateRequest>(u => u.Payload.Body.Metadata.Keys.FirstOrDefault(y => y == "test") != null)))
                .Returns(Task.FromResult(new VoucherCreateResponse()
                {
                    Payload = new Domain.Models.Api.Payload.JsonApiPayload<Voucher>
                    {
                        Body = v1
                    }
                }));
            _fixture.Inject(apiService);

            var sut = _fixture.Create<VouchersRepository>();

            var actual = await sut.UpdateDetails("voucherCode", new Dictionary<string, object>() { { "test", "test" } }, dateTime);

            actual.Should().BeEquivalentTo(v1);
        }

        [Fact]
        public async Task Delete()
        {
            IFixture _fixture = FixtureUtils.AutoMoqFixture();

            BuildMainServices(_fixture);
            MocksProvider.BuildHttpContext(_fixture, true);

            var apiService = _fixture.Freeze<Mock<IApiService>>();
            apiService
                .Setup(x => x.GetResponseContentAsync<VoucherDeleteRequest, ApiResponseStub>(It.IsAny<VoucherDeleteRequest>()))
                .ThrowsAsync(new InvalidOperationException());
            _fixture.Inject(apiService);

            var sut = _fixture.Create<VouchersRepository>();
            Exception ex = null;

            try
            {
                await sut.Delete("voucherCode");
            }
            catch (Exception e)
            {
                ex = e;
            }

            ex.Should().NotBeNull();
        }

        [Fact]
        public async Task ValidateRedemption()
        {
            IFixture _fixture = FixtureUtils.AutoMoqFixture();

            var voucherWithMeta = new Holidays.Api.Domain.Data.Vouchers.ValidationWithMeta();
            voucherWithMeta.SetProperty(x => x.Code, "test_v");

            BuildMainServices(_fixture);
            MocksProvider.BuildHttpContext(_fixture, true);

            var apiService = _fixture.Freeze<Mock<IApiService>>();
            apiService
                .Setup(x => x.GetResponseContentAsync<ValidateRedemptionRequest, ValidateRedemptionResponse>(It.Is<ValidateRedemptionRequest>(
                        y => y.Payload.Body.Customer.SourceId == "Id" && y.Payload.Body.Order.Amount == 10000
                )))
                .Returns(Task.FromResult(new ValidateRedemptionResponse()
                {
                    Payload = new Domain.Models.Api.Payload.JsonApiPayload<Holidays.Api.Domain.Data.Vouchers.ValidationWithMeta>()
                    {
                        Body = voucherWithMeta
                    }
                }));
            _fixture.Inject(apiService);

            var sut = _fixture.Create<VouchersRepository>();

            var actual = await sut.ValidateRedemption("voucherCode", 100, "Id", new Dictionary<string, object>() { { "test", "test" } });

            actual.Should().BeEquivalentTo(voucherWithMeta);
        }

        [Fact]
        public async Task ProcessRedemption()
        {
            IFixture _fixture = FixtureUtils.AutoMoqFixture();

            var redemption = new Redemption();
            redemption.SetProperty(x => x.Id, "test_v");

            BuildMainServices(_fixture);
            MocksProvider.BuildHttpContext(_fixture, true);

            var apiService = _fixture.Freeze<Mock<IApiService>>();
            apiService
                .Setup(x => x.GetResponseContentAsync<ProcessRedemptionRequest, ProcessRedemptionResponse>(It.Is<ProcessRedemptionRequest>(
                        y => y.Payload.Body.Customer.Id == "Id" && y.Payload.Body.Order.Amount == 10000
                )))
                .Returns(Task.FromResult(new ProcessRedemptionResponse()
                {
                    Payload = new Domain.Models.Api.Payload.JsonApiPayload<Redemption>()
                    {
                        Body = redemption
                    }
                }));
            _fixture.Inject(apiService);

            var sut = _fixture.Create<VouchersRepository>();

            var actual = await sut.ProcessRedemption("voucherCode", 100, "Id", new Dictionary<string, object>() { { "test", "test" } });

            actual.Should().BeEquivalentTo(redemption);
        }

        [Fact]
        public async Task RollbackRedemption()
        {
            IFixture _fixture = FixtureUtils.AutoMoqFixture();

            var redemption = new RedemptionRollback();
            redemption.SetProperty(x => x.Id, "test_v");

            BuildMainServices(_fixture);
            MocksProvider.BuildHttpContext(_fixture, true);

            var apiService = _fixture.Freeze<Mock<IApiService>>();
            apiService
                .Setup(x => x.GetResponseContentAsync<RollbackRedemptionRequest, RollbackRedemptionResponse>(It.Is<RollbackRedemptionRequest>(
                        y => y.Reason == "reason"
                )))
                .Returns(Task.FromResult(new RollbackRedemptionResponse()
                {
                    Payload = new Domain.Models.Api.Payload.JsonApiPayload<RedemptionRollback>()
                    {
                        Body = redemption
                    }
                }));
            _fixture.Inject(apiService);

            var sut = _fixture.Create<VouchersRepository>();

            var actual = await sut.RollbackRedemption("redemptionId", "reason", "Id");

            actual.Should().BeEquivalentTo(redemption);
        }

        #region Clone
        [Fact]
        public async Task Clone_ClonesProperties()
        {
            // arrange
            IFixture _fixture = FixtureUtils.AutoMoqFixture();

            BuildMainServices(_fixture);
            MocksProvider.BuildHttpContext(_fixture, true);

            var apiService = _fixture.Freeze<Mock<IApiService>>();
            var voucher = new Voucher();
            voucher.SetProperty(x => x.Code, "v_0001");
            voucher.SetProperty(x => x.Active, true);
            voucher.SetProperty(x => x.Campaign, "compaign_id");
            voucher.SetProperty(x => x.Category, "cat");
            voucher.SetProperty(x => x.ExpirationDate, new DateTime(1234567));
            voucher.SetProperty(x => x.Metadata, new VVoucherify.Core.DataModel.Metadata(new Dictionary<string, object> { { "hotel_code", "X0001" }, { "country_code", "ES" } }));
            var gift = new Gift();
            gift.SetProperty(x => x.Amount, 1234500);
            voucher.SetProperty(x => x.Gift, gift);

            apiService
                .Setup(x => x.GetResponseContentAsync<VoucherCreateRequest, VoucherCreateResponse>(It.IsAny<VoucherCreateRequest>()))
                .Returns(Task.FromResult(new VoucherCreateResponse()
                {
                    Payload = new Domain.Models.Api.Payload.JsonApiPayload<Voucher>
                    {
                        Body = voucher
                    }
                }));
            _fixture.Inject(apiService);

            var sut = _fixture.Create<VouchersRepository>();

            // act
            var actual = await sut.Clone(voucher, new Dictionary<string, string>());

            // assert
            apiService.Verify(x => x.GetResponseContentAsync<VoucherCreateRequest, VoucherCreateResponse>(It.Is<VoucherCreateRequest>(req =>
                    req.Endpoint.AbsoluteUri == "http://test/v1/vouchers/v_0001"
                && req.Payload.Body.Active
                && req.Payload.Body.Campaign == "compaign_id"
                && req.Payload.Body.Category == "cat"
                && req.Payload.Body.ExpirationDate == new DateTime(1234567)
                && req.Payload.Body.Gift.Amount == 1234500
                && (string)req.Payload.Body.Metadata["hotel_code"] == "X0001"
                && (string)req.Payload.Body.Metadata["country_code"] == "ES"
                )));
        }
        #endregion

        #region Clone
        [Fact]
        public async Task Clone_MergeesMetadata()
        {
            // arrange
            IFixture _fixture = FixtureUtils.AutoMoqFixture();

            BuildMainServices(_fixture);
            MocksProvider.BuildHttpContext(_fixture, true);

            var apiService = _fixture.Freeze<Mock<IApiService>>();
            var voucher = new Voucher();
            voucher.SetProperty(x => x.Code, "v_0001");
            voucher.SetProperty(x => x.Metadata, new VVoucherify.Core.DataModel.Metadata(new Dictionary<string, object> { { "hotel_code", "X0001" }, { "country_code", "ES" } }));
            var gift = new Gift();
            //gift.SetProperty(x => x.Amount, 1234500);
            voucher.SetProperty(x => x.Gift, gift);

            apiService
                .Setup(x => x.GetResponseContentAsync<VoucherCreateRequest, VoucherCreateResponse>(It.IsAny<VoucherCreateRequest>()))
                .Returns(Task.FromResult(new VoucherCreateResponse()
                {
                    Payload = new Domain.Models.Api.Payload.JsonApiPayload<Voucher>
                    {
                        Body = voucher
                    }
                }));
            _fixture.Inject(apiService);

            var sut = _fixture.Create<VouchersRepository>();

            // act
            var actual = await sut.Clone(voucher, new Dictionary<string, string> { { "new_property", "new_val" } });

            // assert
            apiService.Verify(x => x.GetResponseContentAsync<VoucherCreateRequest, VoucherCreateResponse>(It.Is<VoucherCreateRequest>(req =>
                (string)req.Payload.Body.Metadata["hotel_code"] == "X0001"
                && (string)req.Payload.Body.Metadata["country_code"] == "ES"
                && (string)req.Payload.Body.Metadata["new_property"] == "new_val"
                )));
        }
        #endregion
    }
}
