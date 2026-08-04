using AutoFixture.Xunit2;
using easyJet.Feature.Booking.Models;
using easyJet.Foundation.SitecoreExtensions.Utils;
using easyJet.Foundation.WebApi.Models;
using easyJet.Foundation.WebApi.Services;
using easyJet.Foundation.WebApi.Services.CancellationAndRefund;
using FluentAssertions;
using NSubstitute;
using Sitecore.Configuration;
using Xunit;

namespace easyJet.Foundation.CancellationAndRefund.Tests.Services
{
    public class CancellationAndRefundServiceTests
    {
        private readonly IMasterDataService masterDataService;
        private readonly CancellationAndRefundService cancellationAndRefundService;

        public CancellationAndRefundServiceTests()
        {
            masterDataService = Substitute.For<IMasterDataService>();

            cancellationAndRefundService = new CancellationAndRefundService(masterDataService);
        }

        [Theory]
        [AutoData]
        public void CancellationAndRefundProcess_ShouldReciveResponseFromWebApiEndpoint_IfDataExist(Booking booking, CancellationAndRefundResponse response)
        {
            // Arrange
            masterDataService.Post<CancellationAndRefundRequest, CancellationAndRefundResponse>(Arg.Any<CancellationAndRefundRequest>(), Arg.Any<string>()).ReturnsForAnyArgs(response);

            using (new SecretsManagerDisabler())
            {
                // Act
                var actual = cancellationAndRefundService.GetCancellationAndRefundresult<Booking>(booking);
                // Asert
                actual.Should().NotBeNull();
            }
        }
    }
}
