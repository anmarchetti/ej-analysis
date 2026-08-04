using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.SitecoreExtensions.Services;
using easyJet.Foundation.Voucherify.Commands;
using easyJet.Foundation.Voucherify.Logging;
using easyJet.Foundation.Voucherify.Models.SingleUsePromocodes;
using easyJet.Foundation.Voucherify.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data.Items;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Foundation.Voucherify.Tests.Commands
{
    public class UploadSingleUsePromocodesCommandTests
    {
        private readonly UploadSingleUsePromocodesCommand command;
        private readonly ISingleUsePromoCodeUploadService service;

        public UploadSingleUsePromocodesCommandTests()
        {
            service = Substitute.For<ISingleUsePromoCodeUploadService>();
            var databaseProvider = Substitute.For<IDatabaseProvider>();
            var csvUtilsService = Substitute.For<ICsvUtilsService>();
            var logger = Substitute.For<IVoucherifyLogger>();
            var userCreationService = Substitute.For<IUserCreationService>();
            var sitecoreUiService = Substitute.For<ISitecoreUIService>();

            command = Substitute.ForPartsOf<UploadSingleUsePromocodesCommand>(service, databaseProvider, csvUtilsService, logger, userCreationService, sitecoreUiService);
        }

        [Fact]
        public void ProcessItems_ShouldBeEmpty_IfGetFileDataIsEmpty()
        {
            // Arrange
            command.GetFileData<SingleUsePromocodesCsv>(Arg.Any<Item>()).Returns(new List<SingleUsePromocodesCsv>());
            var contextItem = new FakeItem().WithField("CampaignName", "CampaignName");

            // Act
            var actual = command.ProcessItems(contextItem);

            // Assert
            actual.Should().BeEmpty();
            service.DidNotReceive().UploadSingleUsePromoCodes(Arg.Any<IEnumerable<string>>(), Arg.Any<string>());
        }

        [Fact]
        public void ProcessItems_ShouldUploadCodes_WithCampaignName()
        {
            // Arrange
            var expectedCodes = new[] { "Code1", "Code2" };
            const string campaignName = "CampaignName";
            var list = expectedCodes.Select(code => new SingleUsePromocodesCsv { Code = code }).ToList();

            command.GetFileData<SingleUsePromocodesCsv>(Arg.Any<Item>()).Returns(list);
            var contextItem = new FakeItem().WithField("CampaignName", campaignName);

            // Act
            var actual = command.ProcessItems(contextItem).ToList();

            // Assert
            actual.Should().BeEmpty();
            service.Received(1).UploadSingleUsePromoCodes(
                Arg.Is<IEnumerable<string>>(codes => codes.SequenceEqual(expectedCodes)),
                campaignName);
        }

        [Fact]
        public void ProcessItems_ShouldUploadCodes_AsProvided_WhenCodesAreNullOrEmpty()
        {
            // Arrange
            var expectedCodes = new[] { null, string.Empty, "Code1" };
            const string campaignName = "CampaignName";
            var list = expectedCodes.Select(code => new SingleUsePromocodesCsv { Code = code }).ToList();

            command.GetFileData<SingleUsePromocodesCsv>(Arg.Any<Item>()).Returns(list);
            var contextItem = new FakeItem().WithField("CampaignName", campaignName);

            // Act
            command.ProcessItems(contextItem).ToList();

            // Assert
            service.Received(1).UploadSingleUsePromoCodes(
                Arg.Is<IEnumerable<string>>(codes => codes.SequenceEqual(expectedCodes)),
                campaignName);
        }

        [Fact]
        public void ProcessItems_ShouldNotThrow_WhenUploadServiceThrows()
        {
            // Arrange
            const string campaignName = "CampaignName";
            var list = new List<SingleUsePromocodesCsv>
            {
                new SingleUsePromocodesCsv { Code = "Code1" }
            };

            command.GetFileData<SingleUsePromocodesCsv>(Arg.Any<Item>()).Returns(list);
            service
                .When(x => x.UploadSingleUsePromoCodes(Arg.Any<IEnumerable<string>>(), campaignName))
                .Do(_ => throw new Exception("Upload failed"));

            var contextItem = new FakeItem().WithField("CampaignName", campaignName);

            // Act
            Action act = () => command.ProcessItems(contextItem).ToList();

            // Assert
            act.Should().NotThrow();
            service.Received(1).UploadSingleUsePromoCodes(
                Arg.Is<IEnumerable<string>>(codes => codes.SequenceEqual(new[] { "Code1" })),
                campaignName);
        }
    }
}
