using System.Collections.Generic;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using easyJet.Foundation.Voucherify.Models.Domain;
using easyJet.Foundation.Voucherify.Services;
using easyJet.Foundation.Voucherify.Services.Sync;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data.Fields;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Foundation.Voucherify.Tests.Tests.Services
{
    public class SyncDataServiceTests
    {
        private readonly IVoucherifyService voucherifyService;
        private readonly SyncDataService syncDataService;

        public SyncDataServiceTests()
        {
            voucherifyService = Substitute.For<IVoucherifyService>();

            syncDataService = new SyncDataService(voucherifyService);
        }

        [Fact]
        public void SyncPromotionToVoucherify_ShouldNotSyncVoucher_IfVoucherIfNull()
        {
            // Arrange
            var child1 = new FakeItem()
                .WithTemplate(Templates.PromotionCodeConfiguration.Id)
                .WithField(Templates.PromotionCodeConfiguration.Fields.AtcomPromoCode, "TESTCODE")
                .WithField(Templates.PromotionCodeConfiguration.Fields.IsPromotionInVoucherify, string.Empty)
                .WithField(Templates.Promotion.Fields.DateValidityFrom, null)
                .WithField(Templates.Promotion.Fields.DateValidityTo, null)
                .WithField(Sitecore.FieldIDs.Sortorder, null)
                .WithItemEditing();

            var child2 = new FakeItem()
                .WithTemplate(Templates.PromotionCodeConfiguration.Id)
                .WithField(Templates.PromotionCodeConfiguration.Fields.AtcomPromoCode, "TESTCODE2")
                .WithField(Templates.PromotionCodeConfiguration.Fields.IsPromotionInVoucherify, string.Empty)
                .WithField(Templates.Promotion.Fields.DateValidityFrom, null)
                .WithField(Templates.Promotion.Fields.DateValidityTo, null)
                .WithField(Sitecore.FieldIDs.Sortorder, null)
                .WithItemEditing();

            var item = new FakeItem()
                .WithTemplate(Templates.Promotion.Id)
                .WithField(Templates.Promotion.Fields.CustomerPromoCode, "Test title")
                .WithField(Templates.Promotion.Fields.DateValidityFrom, "20200707T081700Z")
                .WithField(Templates.Promotion.Fields.DateValidityTo, "20200707T081700Z")
                .WithChild(child1)
                .WithChild(child2)
                .WithItemEditing()
                .ToSitecoreItem();

            string voucherCode = null;
            voucherifyService.CreateOrUpdate(Arg.Any<VoucherInfo>()).Returns(voucherCode);

            // Act
            var actual = syncDataService.SyncPromotionToVoucherifyAndEnforceSortOrder(item);

            // Assert
            actual.Length.Should().Be(0);
            item.Children[0].Fields[Templates.PromotionCodeConfiguration.Fields.IsPromotionInVoucherify].Value.Should().BeEmpty();
            item.Children[1].Fields[Templates.PromotionCodeConfiguration.Fields.IsPromotionInVoucherify].Value.Should().BeEmpty();
        }

        [Fact]
        public void SyncPromotionToVoucherify_ShouldSyncVoucher_IfHasVoucher()
        {
            // Arrange
            var child1 = new FakeItem()
                .WithTemplate(Templates.PromotionCodeConfiguration.Id)
                .WithField(Templates.PromotionCodeConfiguration.Fields.AtcomPromoCode, "TESTCODE")
                .WithField(Templates.PromotionCodeConfiguration.Fields.IsPromotionInVoucherify, string.Empty)
                .WithField(Templates.Promotion.Fields.DateValidityFrom, null)
                .WithField(Templates.Promotion.Fields.DateValidityTo, null)
                .WithField(Sitecore.FieldIDs.Sortorder, null)
                .WithItemEditing();

            var fakeItem = new FakeItem()
                .WithTemplate(Templates.Promotion.Id)
                .WithField(Templates.Promotion.Fields.CustomerPromoCode, "Test title")
                .WithField(Templates.Promotion.Fields.DateValidityFrom, "20200707T081700Z")
                .WithField(Templates.Promotion.Fields.DateValidityTo, "20200707T081700Z")
                .WithChild(child1)
                .WithItemEditing();

            var item = fakeItem.ToSitecoreItem();
            var childItem = child1.ToSitecoreItem();

            var voucherInfo = new VoucherInfo()
            {
                Title = "Test title",
                StartDate = ((DateField)item.Fields[Templates.Promotion.Fields.DateValidityFrom]).IsoTimeToServerDateTime(),
                ExpirationDate = ((DateField)item.Fields[Templates.Promotion.Fields.DateValidityTo]).IsoTimeToServerDateTime(),
                Redemption = null,
                Metadata = new Dictionary<string, object> { { Constants.AtcomCodeMetadataName, "TESTCODE" } },
                VoucherCode = childItem.ID.ToString()
            };

            string voucherCode = "TESTVoucher10";
            voucherifyService.CreateOrUpdate(Arg.Any<VoucherInfo>()).Returns(voucherCode);

            // Act
            var actual = syncDataService.SyncPromotionToVoucherifyAndEnforceSortOrder(item);

            // Assert
            actual[0].Fields[Templates.PromotionCodeConfiguration.Fields.IsPromotionInVoucherify].Value.Should().Be("1");
            actual[0].Fields[Sitecore.FieldIDs.Sortorder].Value.Should().Be("0");
            voucherifyService.Received().CreateOrUpdate(Arg.Is<VoucherInfo>(
                vi => vi.ExpirationDate == voucherInfo.ExpirationDate &&
                      vi.StartDate == voucherInfo.StartDate &&
                      vi.Redemption == voucherInfo.Redemption &&
                      vi.Title == voucherInfo.Title &&
                      vi.VoucherCode == voucherInfo.VoucherCode));
        }

        [Fact]
        public void SyncPromotionToVoucherify_ShouldSyncVoucherWithChildDates_IfHasVoucher()
        {
            // Arrange
            var parentItem = new FakeItem()
                .WithTemplate(Templates.Promotion.Id)
                .WithField(Templates.Promotion.Fields.CustomerPromoCode, "Test title")
                .WithField(Templates.Promotion.Fields.DateValidityFrom, "20200707T081700Z")
                .WithField(Templates.Promotion.Fields.DateValidityTo, "20200707T081700Z");

            var child1 = new FakeItem()
                .WithTemplate(Templates.PromotionCodeConfiguration.Id)
                .WithField(Templates.PromotionCodeConfiguration.Fields.AtcomPromoCode, "TESTCODE")
                .WithField(Templates.Promotion.Fields.DateValidityFrom, "20250707T081700Z")
                .WithField(Templates.Promotion.Fields.DateValidityTo, "20250707T081700Z")
                .WithField(Templates.PromotionCodeConfiguration.Fields.IsPromotionInVoucherify, string.Empty)
                .WithField(Sitecore.FieldIDs.Sortorder, null)
                .WithItemEditing();

            parentItem.WithChild(child1);
            var item = parentItem.ToSitecoreItem();
            var childItem = child1.ToSitecoreItem();

            var voucherInfo = new VoucherInfo()
            {
                Title = "Test title",
                StartDate = ((DateField)childItem.Fields[Templates.Promotion.Fields.DateValidityFrom]).IsoTimeToServerDateTime(),
                ExpirationDate = ((DateField)childItem.Fields[Templates.Promotion.Fields.DateValidityTo]).IsoTimeToServerDateTime(),
                Redemption = null,
                Metadata = new Dictionary<string, object> { { Constants.AtcomCodeMetadataName, "TESTCODE" } },
                VoucherCode = childItem.ID.ToString()
            };

            string voucherCode = "TESTVoucher10";
            voucherifyService.CreateOrUpdate(Arg.Any<VoucherInfo>()).Returns(voucherCode);

            // Act
            var actual = syncDataService.SyncPromotionToVoucherifyAndEnforceSortOrder(item);

            // Assert
            actual[0].Fields[Templates.PromotionCodeConfiguration.Fields.IsPromotionInVoucherify].Value.Should().Be("1");
            actual[0].Fields[Sitecore.FieldIDs.Sortorder].Value.Should().Be("0");
            voucherifyService.Received().CreateOrUpdate(Arg.Is<VoucherInfo>(
                vi => vi.ExpirationDate == voucherInfo.ExpirationDate &&
                      vi.StartDate == voucherInfo.StartDate &&
                      vi.Redemption == voucherInfo.Redemption &&
                      vi.Title == voucherInfo.Title &&
                      vi.VoucherCode == voucherInfo.VoucherCode));
        }

        [Fact]
        public void SyncPromotionToVoucherify_ShouldEnforceOrder()
        {
            // Arrange
            var child1 = new FakeItem()
                .WithTemplate(Templates.PromotionCodeConfiguration.Id)
                .WithField(Templates.PromotionCodeConfiguration.Fields.AtcomPromoCode, "TESTCODE")
                .WithField(Templates.PromotionCodeConfiguration.Fields.IsPromotionInVoucherify, string.Empty)
                .WithField(Templates.Promotion.Fields.DateValidityFrom, null)
                .WithField(Templates.Promotion.Fields.DateValidityTo, null)
                .WithField(Sitecore.FieldIDs.Sortorder, null)
                .WithItemEditing();

            var child2 = new FakeItem()
                .WithTemplate(Templates.PromotionCodeConfiguration.Id)
                .WithField(Templates.PromotionCodeConfiguration.Fields.AtcomPromoCode, "TESTCODE2")
                .WithField(Templates.PromotionCodeConfiguration.Fields.IsPromotionInVoucherify, string.Empty)
                .WithField(Templates.Promotion.Fields.DateValidityFrom, null)
                .WithField(Templates.Promotion.Fields.DateValidityTo, null)
                .WithField(Sitecore.FieldIDs.Sortorder, null)
                .WithItemEditing();

            var item = new FakeItem()
                .WithTemplate(Templates.Promotion.Id)
                .WithField(Templates.Promotion.Fields.CustomerPromoCode, "Test title")
                .WithField(Templates.Promotion.Fields.DateValidityFrom, "20200707T081700Z")
                .WithField(Templates.Promotion.Fields.DateValidityTo, "20200707T081700Z")
                .WithChild(child1)
                .WithChild(child2)
                .WithItemEditing()
                .ToSitecoreItem();

            string voucherCode = "test";
            voucherifyService.CreateOrUpdate(Arg.Any<VoucherInfo>()).Returns(voucherCode);

            // Act
            var actual = syncDataService.SyncPromotionToVoucherifyAndEnforceSortOrder(item);

            // Assert
            actual.Length.Should().Be(2);
            actual[0].Fields[Sitecore.FieldIDs.Sortorder].Value.Should().Be("0");
            actual[1].Fields[Sitecore.FieldIDs.Sortorder].Value.Should().Be("10");
        }
    }
}
