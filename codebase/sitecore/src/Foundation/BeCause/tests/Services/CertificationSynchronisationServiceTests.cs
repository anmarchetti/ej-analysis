using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.BeCause.Logging;
using easyJet.Foundation.BeCause.Models;
using easyJet.Foundation.BeCause.Services;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Collections;
using Sitecore.ContentSearch.Linq;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Foundation.BeCause.Tests.Services
{
    public class CertificationSynchronisationServiceTests
    {
        private readonly ICertificationDataService certificationDataService;
        private readonly IDatabaseProvider databaseProvider;
        private readonly IDestinationsRepository destinationsRepository;
        private readonly IBeCauseLogger logger;
        private readonly ICertificationSynchronisationService sut;

        public CertificationSynchronisationServiceTests()
        {
            certificationDataService = Substitute.For<ICertificationDataService>();
            databaseProvider = Substitute.For<IDatabaseProvider>();
            destinationsRepository = Substitute.For<IDestinationsRepository>();
            logger = Substitute.For<IBeCauseLogger>();
            sut = new CertificationSynchronisationService(logger, certificationDataService, destinationsRepository, databaseProvider);
        }

        [Fact]
        public void Synchronize_Should_AddCertificate()
        {
            var ecoFacilityId = ID.NewID;
            var ecoFacilityTypeId = ID.NewID;

            var certifiedHotelId = ID.NewID;
            var certifiedHotelCode = "certifiedHotelCode";

            var ecoFacilityItem = new FakeItem(ecoFacilityId)
                .WithItemEditing()
                .WithField(Destinations.Constants.Fields.BaseAppearance.ShowOnSite, Destinations.Constants.Common.CheckboxFalseValue)
                .WithField(Destinations.Constants.Fields.BaseFacilityItem.FacilityType, ecoFacilityTypeId.ToString())
                .WithField(Constants.FieldIds.FacilityType, ecoFacilityTypeId.ToString());

            var facilitiesFolder = new FakeItem()
                .WithTemplate(BeCause.Constants.TemplateIds.AccomodationFacilitiesFolder)
                .WithChild(ecoFacilityItem);

            var certifiedItem = new FakeItem(certifiedHotelId)
                .WithField(ID.NewID, Destinations.Constants.Fields.AccommodationItem.GiataCode, certifiedHotelCode)
                .WithChild(facilitiesFolder);

            facilitiesFolder.ToSitecoreItem().Add("Eco Certified", Constants.TemplateIds.AccomodationFacility).Returns(ecoFacilityItem);

            // arrange
            var hints = new List<SearchHit<HotelSyncSearchResultItem>>()
            {
                new SearchHit<HotelSyncSearchResultItem>(1, new HotelSyncSearchResultItem()
                {
                    SourceCodes = new[] { certifiedHotelCode },
                    ItemId = certifiedHotelId,
                }),
            };

            destinationsRepository.GetAllHotels(Arg.Any<string>()).Returns(hints);
            certificationDataService.GetCertifiedHotelIds().Returns((false, string.Empty, new HashSet<string>() { certifiedHotelCode }));
            databaseProvider.GetItem(certifiedHotelId, DatabaseType.Master).Returns(certifiedItem);

            // Act
            var result = sut.Synchronize("/");

            // Assert
            result.ToList().Should().HaveCount(4);
            result.Skip(2).First().Operation.Should().Be(SynchronizationOperation.CertificateAdded);
        }

        [Fact]
        public void Synchronize_Should_DoNotUpdateHotelIdCurrentStateIsCorrect()
        {
            var ecoFacilityId = ID.NewID;
            var ecoFacilityTypeId = ID.NewID;
            var notCertifiedHotelId = ID.NewID;
            var notCertifiedHotelCode = "certifiedHotelCode";

            var ecoFacilityItem = new FakeItem(ecoFacilityId)
                .WithItemEditing()
                .WithField(Destinations.Constants.Fields.BaseAppearance.ShowOnSite, Destinations.Constants.Common.CheckboxFalseValue)
                .WithField(Destinations.Constants.Fields.BaseFacilityItem.FacilityType, ecoFacilityTypeId.ToString())
                .WithField(Constants.FieldIds.FacilityType, ecoFacilityTypeId.ToString());

            var facilitiesFolder = new FakeItem()
                .WithTemplate(BeCause.Constants.TemplateIds.AccomodationFacilitiesFolder)
                .WithChild(ecoFacilityItem);

            var notCertifiedItem = new FakeItem(notCertifiedHotelId)
                .WithField(ID.NewID, Destinations.Constants.Fields.AccommodationItem.GiataCode, notCertifiedHotelCode)
                .WithChild(facilitiesFolder);

            facilitiesFolder.ToSitecoreItem().Add("Eco Certified", Constants.TemplateIds.AccomodationFacility).Returns(ecoFacilityItem);

            // arrange
            var hints = new List<SearchHit<HotelSyncSearchResultItem>>()
            {
                new SearchHit<HotelSyncSearchResultItem>(1, new HotelSyncSearchResultItem()
                {
                    SourceCodes = new[] { notCertifiedHotelCode },

                    ItemId = notCertifiedHotelId,
                })
            };

            destinationsRepository.GetAllHotels(Arg.Any<string>()).Returns(hints);
            certificationDataService.GetCertifiedHotelIds().Returns((false, string.Empty, new HashSet<string>() { }));
            databaseProvider.GetItem(notCertifiedHotelId, DatabaseType.Master).Returns(notCertifiedItem);
            // Act
            var result = sut.Synchronize("/");

            // Assert
            result.ToList().Should().HaveCount(4);
            result.Skip(2).First().Operation.Should().Be(SynchronizationOperation.Untouched);
        }

        [Fact]
        public void Synchronize_Should_ReturnErrorOnOrphanHotels()
        {
            var orphanHotelId = ID.NewID;
            var orphanHotelCode = "orphanHotelCode";
            var orphanItem = new FakeItem(orphanHotelId)
                .WithField(ID.NewID, Destinations.Constants.Fields.AccommodationItem.GiataCode, orphanHotelCode);
            // arrange
            var hints = new List<SearchHit<HotelSyncSearchResultItem>>()
            {
                new SearchHit<HotelSyncSearchResultItem>(1, new HotelSyncSearchResultItem()
                {
                    SourceCodes = new[] { orphanHotelCode },
                    ItemId = orphanHotelId,
                }),
            };

            destinationsRepository.GetAllHotels(Arg.Any<string>()).Returns(hints);
            certificationDataService.GetCertifiedHotelIds().Returns((false, string.Empty, new HashSet<string>() { orphanHotelCode }));
            databaseProvider.GetItem(orphanHotelId, DatabaseType.Master).Returns(orphanItem);

            // Act
            var result = sut.Synchronize("/");

            // Assert
            result.ToList().Should().HaveCount(4);
            result.Skip(2).First().Operation.Should().Be(SynchronizationOperation.Error);
        }

        [Fact]
        public void Synchronize_Should_RemoveCertificateIfNoLongerCertified()
        {
            var ecoFacilityId = ID.NewID;
            var ecoFacilityTypeId = ID.NewID;
            var ecoCode = "ECO";
            var notCertifiedAnymoreHotelId = ID.NewID;
            var notCertifiedAnymoreHotelCode = "notCertifiedAnymoreHotelCode";

            var ecoFacilityTypeItem = new FakeItem(ecoFacilityTypeId)
                .WithTemplate(Destinations.Constants.TemplateIds.FacilityType)
                .WithField(Destinations.Constants.Fields.DatasourceItem.Code, Destinations.Constants.Fields.AccommodationFacilityItem.Eco);

            var ecoFacilityItem = new FakeItem(ecoFacilityId)
                .WithItemEditing()
                .WithField(Destinations.Constants.Fields.BaseAppearance.ShowOnSite, Destinations.Constants.Common.CheckboxFalseValue)
                .WithField(Destinations.Constants.Fields.BaseFacilityItem.FacilityType, ecoFacilityTypeId.ToString())
                .WithField(Constants.FieldIds.FacilityType, ecoFacilityTypeId.ToString());

            var facilitiesFolder = new FakeItem()
                .WithTemplate(BeCause.Constants.TemplateIds.AccomodationFacilitiesFolder);

            facilitiesFolder.ToSitecoreItem().Children.Returns(
                new ChildList(
                    facilitiesFolder,
                    new List<Item>()
                    {
                        ecoFacilityItem
                    }),
                new ChildList(
                    facilitiesFolder,
                    new List<Item>()
                    {
                        ecoFacilityItem
                    }),
                new ChildList(
                    facilitiesFolder,
                    new List<Item>()));

            var notCertifiedAnymoreHotelItem = new FakeItem(notCertifiedAnymoreHotelId)
                .WithField(ID.NewID, Destinations.Constants.Fields.AccommodationItem.GiataCode, notCertifiedAnymoreHotelCode)
                .WithChild(facilitiesFolder);

            facilitiesFolder.ToSitecoreItem().Add("Eco Certified", Constants.TemplateIds.AccomodationFacility).Returns(ecoFacilityItem);

            // arrange
            var hints = new List<SearchHit<HotelSyncSearchResultItem>>()
            {
                new SearchHit<HotelSyncSearchResultItem>(1, new HotelSyncSearchResultItem()
                {
                    SourceCodes = new[] { notCertifiedAnymoreHotelCode },
                    EcoFacility = ecoCode,
                    ItemId = notCertifiedAnymoreHotelId,
                }),
            };

            destinationsRepository.GetAllHotels(Arg.Any<string>()).Returns(hints);
            certificationDataService.GetCertifiedHotelIds().Returns((false, string.Empty, new HashSet<string>() { }));

            databaseProvider.GetItem(notCertifiedAnymoreHotelId, DatabaseType.Master).Returns(notCertifiedAnymoreHotelItem);

            databaseProvider.GetItem(ecoFacilityId, DatabaseType.Master).Returns(ecoFacilityItem);
            databaseProvider.GetItem(ecoFacilityTypeId, DatabaseType.Master).Returns(ecoFacilityTypeItem);

            // Act
            var result = sut.Synchronize("/").ToList();

            // Assert
            result.Should().HaveCount(4);
            result.Skip(2).First().Operation.Should().Be(SynchronizationOperation.CertificateRemoved);
        }

        [Fact]
        public void Synchronize_Should_AddCertificate_WhenSearchIndexIncorrectlyReportsCertified()
        {
            var ecoFacilityId = ID.NewID;
            var ecoFacilityTypeId = ID.NewID;

            var certifiedHotelId = ID.NewID;
            var certifiedHotelCode = "certifiedHotelCode";

            var ecoFacilityItem = new FakeItem(ecoFacilityId)
                .WithItemEditing()
                .WithField(Destinations.Constants.Fields.BaseAppearance.ShowOnSite, Destinations.Constants.Common.CheckboxFalseValue)
                .WithField(Destinations.Constants.Fields.BaseFacilityItem.FacilityType, ecoFacilityTypeId.ToString())
                .WithField(Constants.FieldIds.FacilityType, ecoFacilityTypeId.ToString());

            var facilitiesFolder = new FakeItem()
                .WithTemplate(BeCause.Constants.TemplateIds.AccomodationFacilitiesFolder)
                .WithChild(ecoFacilityItem);

            var certifiedItem = new FakeItem(certifiedHotelId)
                .WithField(ID.NewID, Destinations.Constants.Fields.AccommodationItem.GiataCode, certifiedHotelCode)
                .WithChild(facilitiesFolder);

            facilitiesFolder.ToSitecoreItem().Add("Eco Certified", Constants.TemplateIds.AccomodationFacility).Returns(ecoFacilityItem);

            // arrange - search index falsely claims the hotel already has an Eco Certified facility
            var hints = new List<SearchHit<HotelSyncSearchResultItem>>()
            {
                new SearchHit<HotelSyncSearchResultItem>(1, new HotelSyncSearchResultItem()
                {
                    SourceCodes = new[] { certifiedHotelCode },
                    EcoFacility = "ECO",
                    ItemId = certifiedHotelId,
                }),
            };

            destinationsRepository.GetAllHotels(Arg.Any<string>()).Returns(hints);
            certificationDataService.GetCertifiedHotelIds().Returns((false, string.Empty, new HashSet<string>() { certifiedHotelCode }));
            databaseProvider.GetItem(certifiedHotelId, DatabaseType.Master).Returns(certifiedItem);

            // databaseProvider.GetItem(ecoFacilityTypeId, ...) is intentionally NOT mocked so GetEcoFacility returns null,
            // i.e. master DB authoritatively says "not currently certified" while the search index says it is.

            // Act
            var result = sut.Synchronize("/");

            // Assert - the new master-DB-backed check ignores the stale search-index claim and adds the certificate
            result.ToList().Should().HaveCount(4);
            result.Skip(2).First().Operation.Should().Be(SynchronizationOperation.CertificateAdded);
        }

        [Fact]
        public void Synchronize_Should_RemoveCertificate_WhenSearchIndexIncorrectlyReportsNotCertified()
        {
            var ecoFacilityId = ID.NewID;
            var ecoFacilityTypeId = ID.NewID;
            var notCertifiedAnymoreHotelId = ID.NewID;
            var notCertifiedAnymoreHotelCode = "notCertifiedAnymoreHotelCode";

            var ecoFacilityTypeItem = new FakeItem(ecoFacilityTypeId)
                .WithTemplate(Destinations.Constants.TemplateIds.FacilityType)
                .WithField(Destinations.Constants.Fields.DatasourceItem.Code, Destinations.Constants.Fields.AccommodationFacilityItem.Eco);

            var ecoFacilityItem = new FakeItem(ecoFacilityId)
                .WithItemEditing()
                .WithField(Destinations.Constants.Fields.BaseAppearance.ShowOnSite, Destinations.Constants.Common.CheckboxFalseValue)
                .WithField(Destinations.Constants.Fields.BaseFacilityItem.FacilityType, ecoFacilityTypeId.ToString())
                .WithField(Constants.FieldIds.FacilityType, ecoFacilityTypeId.ToString());

            var facilitiesFolder = new FakeItem()
                .WithTemplate(BeCause.Constants.TemplateIds.AccomodationFacilitiesFolder);

            facilitiesFolder.ToSitecoreItem().Children.Returns(
                new ChildList(
                    facilitiesFolder,
                    new List<Item>()
                    {
                        ecoFacilityItem
                    }),
                new ChildList(
                    facilitiesFolder,
                    new List<Item>()
                    {
                        ecoFacilityItem
                    }),
                new ChildList(
                    facilitiesFolder,
                    new List<Item>()));

            var notCertifiedAnymoreHotelItem = new FakeItem(notCertifiedAnymoreHotelId)
                .WithField(ID.NewID, Destinations.Constants.Fields.AccommodationItem.GiataCode, notCertifiedAnymoreHotelCode)
                .WithChild(facilitiesFolder);

            facilitiesFolder.ToSitecoreItem().Add("Eco Certified", Constants.TemplateIds.AccomodationFacility).Returns(ecoFacilityItem);

            // arrange - search index falsely claims the hotel has no Eco Certified facility (EcoFacility is empty)
            var hints = new List<SearchHit<HotelSyncSearchResultItem>>()
            {
                new SearchHit<HotelSyncSearchResultItem>(1, new HotelSyncSearchResultItem()
                {
                    SourceCodes = new[] { notCertifiedAnymoreHotelCode },
                    ItemId = notCertifiedAnymoreHotelId,
                }),
            };

            destinationsRepository.GetAllHotels(Arg.Any<string>()).Returns(hints);
            certificationDataService.GetCertifiedHotelIds().Returns((false, string.Empty, new HashSet<string>() { }));

            databaseProvider.GetItem(notCertifiedAnymoreHotelId, DatabaseType.Master).Returns(notCertifiedAnymoreHotelItem);

            databaseProvider.GetItem(ecoFacilityId, DatabaseType.Master).Returns(ecoFacilityItem);
            databaseProvider.GetItem(ecoFacilityTypeId, DatabaseType.Master).Returns(ecoFacilityTypeItem);

            // Act
            var result = sut.Synchronize("/").ToList();

            // Assert - the new master-DB-backed check ignores the stale empty index value and removes the orphan facility
            result.Should().HaveCount(4);
            result.Skip(2).First().Operation.Should().Be(SynchronizationOperation.CertificateRemoved);
        }

        [Fact]
        public void Synchronize_Should_LeaveUntouched_WhenAlreadyCertifiedWithCanonicalFacilityType()
        {
            var ecoFacilityId = ID.NewID;
            var certifiedHotelId = ID.NewID;
            var certifiedHotelCode = "certifiedHotelCode";

            // The facility carries the canonical Eco Certified facility type ID,
            // which is what AddCertificate writes for every facility it creates.
            var ecoFacilityItem = new FakeItem(ecoFacilityId)
                .WithItemEditing()
                .WithField(Destinations.Constants.Fields.BaseAppearance.ShowOnSite, Destinations.Constants.Common.CheckboxTrueValue)
                .WithField(Destinations.Constants.Fields.BaseFacilityItem.FacilityType, Constants.ItemIds.EcoCertifiedFacilityType.ToString())
                .WithField(Constants.FieldIds.FacilityType, Constants.ItemIds.EcoCertifiedFacilityType.ToString());

            var facilitiesFolder = new FakeItem()
                .WithTemplate(BeCause.Constants.TemplateIds.AccomodationFacilitiesFolder)
                .WithChild(ecoFacilityItem);

            var certifiedItem = new FakeItem(certifiedHotelId)
                .WithField(ID.NewID, Destinations.Constants.Fields.AccommodationItem.GiataCode, certifiedHotelCode)
                .WithChild(facilitiesFolder);

            // arrange
            var hints = new List<SearchHit<HotelSyncSearchResultItem>>()
            {
                new SearchHit<HotelSyncSearchResultItem>(1, new HotelSyncSearchResultItem()
                {
                    SourceCodes = new[] { certifiedHotelCode },
                    ItemId = certifiedHotelId,
                }),
            };

            destinationsRepository.GetAllHotels(Arg.Any<string>()).Returns(hints);
            certificationDataService.GetCertifiedHotelIds().Returns((false, string.Empty, new HashSet<string>() { certifiedHotelCode }));
            databaseProvider.GetItem(certifiedHotelId, DatabaseType.Master).Returns(certifiedItem);

            // databaseProvider.GetItem is intentionally NOT mocked for the canonical EcoCertifiedFacilityType ID -
            // if the fast path is bypassed and the defensive path runs, GetItem returns null and the test would fail.

            // Act
            var result = sut.Synchronize("/").ToList();

            // Assert - the fast path recognises the canonical type ID without an extra DB lookup,
            // BeCause and master agree, and the hotel is left untouched.
            result.Should().HaveCount(4);
            result.Skip(2).First().Operation.Should().Be(SynchronizationOperation.Untouched);
        }

        [Fact]
        public void Synchronize_Should_SkipHotel_WhenGiataCodeIsMissing()
        {
            var hotelId = ID.NewID;

            var hotelItem = new FakeItem(hotelId)
                .WithField(ID.NewID, Destinations.Constants.Fields.AccommodationItem.GiataCode, string.Empty);

            var hints = new List<SearchHit<HotelSyncSearchResultItem>>()
            {
                new SearchHit<HotelSyncSearchResultItem>(1, new HotelSyncSearchResultItem()
                {
                    ItemId = hotelId,
                }),
            };

            destinationsRepository.GetAllHotels(Arg.Any<string>()).Returns(hints);
            certificationDataService.GetCertifiedHotelIds().Returns((false, string.Empty, new HashSet<string>()));
            databaseProvider.GetItem(hotelId, DatabaseType.Master).Returns(hotelItem);

            // Act
            var result = sut.Synchronize("/").ToList();

            // Assert - hotel is logged and skipped, only the surrounding UiMessages are emitted
            result.Should().HaveCount(3);
            result.Should().OnlyContain(r => r.Operation == SynchronizationOperation.UiMessage);
        }

        [Fact]
        public void Synchronize_Should_LeaveUntouched_WhenFacilityHasUnparseableFacilityType()
        {
            var facilityId = ID.NewID;
            var hotelId = ID.NewID;
            var hotelCode = "hotelCode";

            // FacilityType field holds a malformed value; ID.TryParse returns false and the facility is skipped.
            var bogusFacility = new FakeItem(facilityId)
                .WithField(Destinations.Constants.Fields.BaseFacilityItem.FacilityType, "not-a-valid-id");

            var facilitiesFolder = new FakeItem()
                .WithTemplate(BeCause.Constants.TemplateIds.AccomodationFacilitiesFolder)
                .WithChild(bogusFacility);

            var hotelItem = new FakeItem(hotelId)
                .WithField(ID.NewID, Destinations.Constants.Fields.AccommodationItem.GiataCode, hotelCode)
                .WithChild(facilitiesFolder);

            var hints = new List<SearchHit<HotelSyncSearchResultItem>>()
            {
                new SearchHit<HotelSyncSearchResultItem>(1, new HotelSyncSearchResultItem()
                {
                    SourceCodes = new[] { hotelCode },
                    ItemId = hotelId,
                }),
            };

            destinationsRepository.GetAllHotels(Arg.Any<string>()).Returns(hints);
            certificationDataService.GetCertifiedHotelIds().Returns((false, string.Empty, new HashSet<string>()));
            databaseProvider.GetItem(hotelId, DatabaseType.Master).Returns(hotelItem);

            // Act
            var result = sut.Synchronize("/").ToList();

            // Assert - the bogus facility is skipped via the TryParse continue, GetEcoFacility returns null,
            // BeCause and master agree the hotel is not certified -> Untouched.
            result.Should().HaveCount(4);
            result.Skip(2).First().Operation.Should().Be(SynchronizationOperation.Untouched);
        }

        [Fact]
        public void Synchronize_Should_LeaveUntouched_WhenFacilityHasNoFacilityTypeField()
        {
            var facilityId = ID.NewID;
            var hotelId = ID.NewID;
            var hotelCode = "hotelCode";

            var facilityWithoutType = new FakeItem(facilityId);

            var facilitiesFolder = new FakeItem()
                .WithTemplate(BeCause.Constants.TemplateIds.AccomodationFacilitiesFolder)
                .WithChild(facilityWithoutType);

            var hotelItem = new FakeItem(hotelId)
                .WithField(ID.NewID, Destinations.Constants.Fields.AccommodationItem.GiataCode, hotelCode)
                .WithChild(facilitiesFolder);

            var hints = new List<SearchHit<HotelSyncSearchResultItem>>()
            {
                new SearchHit<HotelSyncSearchResultItem>(1, new HotelSyncSearchResultItem()
                {
                    SourceCodes = new[] { hotelCode },
                    ItemId = hotelId,
                }),
            };

            destinationsRepository.GetAllHotels(Arg.Any<string>()).Returns(hints);
            certificationDataService.GetCertifiedHotelIds().Returns((false, string.Empty, new HashSet<string>()));
            databaseProvider.GetItem(hotelId, DatabaseType.Master).Returns(hotelItem);

            // Act
            var result = sut.Synchronize("/").ToList();

            // Assert - missing Facility Type must not throw; hotel is treated as not certified.
            result.Should().HaveCount(4);
            result.Skip(2).First().Operation.Should().Be(SynchronizationOperation.Untouched);
        }

        [Fact]
        public void Synchronize_Should_ReturnError_WhenFacilityAppearsAfterDecisionCheck()
        {
            var ecoFacilityId = ID.NewID;
            var hotelId = ID.NewID;
            var hotelCode = "hotelCode";

            var ecoFacilityItem = new FakeItem(ecoFacilityId)
                .WithField(Destinations.Constants.Fields.BaseFacilityItem.FacilityType, Constants.ItemIds.EcoCertifiedFacilityType.ToString())
                .WithField(Constants.FieldIds.FacilityType, Constants.ItemIds.EcoCertifiedFacilityType.ToString());

            var facilitiesFolder = new FakeItem()
                .WithTemplate(BeCause.Constants.TemplateIds.AccomodationFacilitiesFolder);

            // Decision-time check sees an empty folder; by the time AddCertificate runs the
            // facility has appeared (e.g. concurrent edit / cache drift). The defensive guard
            // inside AddCertificate must catch this and surface an Error.
            facilitiesFolder.ToSitecoreItem().Children.Returns(
                new ChildList(facilitiesFolder, new List<Item>()),
                new ChildList(facilitiesFolder, new List<Item>() { ecoFacilityItem }));

            var hotelItem = new FakeItem(hotelId)
                .WithField(ID.NewID, Destinations.Constants.Fields.AccommodationItem.GiataCode, hotelCode)
                .WithChild(facilitiesFolder);

            var hints = new List<SearchHit<HotelSyncSearchResultItem>>()
            {
                new SearchHit<HotelSyncSearchResultItem>(1, new HotelSyncSearchResultItem()
                {
                    SourceCodes = new[] { hotelCode },
                    ItemId = hotelId,
                }),
            };

            destinationsRepository.GetAllHotels(Arg.Any<string>()).Returns(hints);
            certificationDataService.GetCertifiedHotelIds().Returns((false, string.Empty, new HashSet<string>() { hotelCode }));
            databaseProvider.GetItem(hotelId, DatabaseType.Master).Returns(hotelItem);

            // Act
            var result = sut.Synchronize("/").ToList();

            // Assert - AddCertificate's defensive guard catches the late-appearing facility and surfaces an Error
            result.Should().HaveCount(4);
            result.Skip(2).First().Operation.Should().Be(SynchronizationOperation.Error);
        }

        [Fact]
        public void Synchronize_Should_ReturnErrorWhenErrorWhileCallingAPI()
        {
            // Arrange
            certificationDataService.GetCertifiedHotelIds().Returns((true, string.Empty, new HashSet<string>() { }));

            // Act
            var result = sut.Synchronize("/");

            // Assert
            result.ToList().Should().HaveCount(2);
            result.Skip(1).First().Operation.Should().Be(SynchronizationOperation.Error);
        }

        [Fact]
        public void Synchronize_Should_ReturnErrorWhenCodesFromAPIAreNull()
        {
            // Arrange
            certificationDataService.GetCertifiedHotelIds().Returns((false, string.Empty, null));

            // Act
            var result = sut.Synchronize("/");

            // Assert
            result.ToList().Should().HaveCount(2);
            result.Skip(1).First().Operation.Should().Be(SynchronizationOperation.Error);
        }

        [Fact]
        public void Synchronize_Should_SkipDuplicate_WhenSameHotelAppearsMoreThanOnceInSearchResults()
        {
            var facilityId = ID.NewID;
            var hotelId = ID.NewID;
            var hotelCode = "hotelCode";

            var newFacility = new FakeItem(facilityId)
                .WithItemEditing()
                .WithField(Constants.FieldIds.FacilityType, string.Empty)
                .WithField(Destinations.Constants.Fields.BaseAppearance.ShowOnSite, string.Empty);

            var facilitiesFolder = new FakeItem()
                .WithTemplate(BeCause.Constants.TemplateIds.AccomodationFacilitiesFolder);

            facilitiesFolder.ToSitecoreItem().Children.Returns(
                new ChildList(facilitiesFolder, new List<Item>()));

            facilitiesFolder.ToSitecoreItem().Add("Eco Certified", Constants.TemplateIds.AccomodationFacility).Returns(newFacility);

            var hotelItem = new FakeItem(hotelId)
                .WithField(ID.NewID, Destinations.Constants.Fields.AccommodationItem.GiataCode, hotelCode)
                .WithChild(facilitiesFolder);

            // Same hotel ID appears twice — simulates a corrupt search index returning two documents for one item.
            var hints = new List<SearchHit<HotelSyncSearchResultItem>>()
            {
                new SearchHit<HotelSyncSearchResultItem>(1, new HotelSyncSearchResultItem()
                {
                    SourceCodes = new[] { hotelCode },
                    ItemId = hotelId,
                }),
                new SearchHit<HotelSyncSearchResultItem>(1, new HotelSyncSearchResultItem()
                {
                    SourceCodes = new[] { hotelCode },
                    ItemId = hotelId,
                }),
            };

            destinationsRepository.GetAllHotels(Arg.Any<string>()).Returns(hints);
            certificationDataService.GetCertifiedHotelIds().Returns((false, string.Empty, new HashSet<string>() { hotelCode }));
            databaseProvider.GetItem(hotelId, DatabaseType.Master).Returns(hotelItem);

            // Act
            var result = sut.Synchronize("/").ToList();

            // Assert - hotel is processed once; the duplicate hit is logged and skipped
            result.Should().HaveCount(4);
            result.Skip(2).First().Operation.Should().Be(SynchronizationOperation.CertificateAdded);
            logger.Received(1).Warn(Arg.Is<string>(message => message.Contains(hotelId.ToString())), Arg.Any<object>());
        }

        [Fact]
        public void Synchronize_Should_RepairExistingEcoCertifiedItem_WhenFacilityTypeIsMissing()
        {
            var facilityId = ID.NewID;
            var hotelId = ID.NewID;
            var hotelCode = "hotelCode";

            // An "Eco Certified" item exists from a previous crashed sync run but has no recognised
            // FacilityType value, so GetEcoFacility skips it and IsCertified returns false.
            var orphanedEcoCertified = new FakeItem(facilityId)
                .WithItemEditing()
                .WithField(Constants.FieldIds.FacilityType, string.Empty)
                .WithField(Destinations.Constants.Fields.BaseAppearance.ShowOnSite, string.Empty);
            orphanedEcoCertified.ToSitecoreItem().Name.Returns("Eco Certified");

            var facilitiesFolder = new FakeItem()
                .WithTemplate(BeCause.Constants.TemplateIds.AccomodationFacilitiesFolder)
                .WithChild(orphanedEcoCertified);

            var hotelItem = new FakeItem(hotelId)
                .WithField(ID.NewID, Destinations.Constants.Fields.AccommodationItem.GiataCode, hotelCode)
                .WithChild(facilitiesFolder);

            var hints = new List<SearchHit<HotelSyncSearchResultItem>>()
            {
                new SearchHit<HotelSyncSearchResultItem>(1, new HotelSyncSearchResultItem()
                {
                    SourceCodes = new[] { hotelCode },
                    ItemId = hotelId,
                }),
            };

            destinationsRepository.GetAllHotels(Arg.Any<string>()).Returns(hints);
            certificationDataService.GetCertifiedHotelIds().Returns((false, string.Empty, new HashSet<string>() { hotelCode }));
            databaseProvider.GetItem(hotelId, DatabaseType.Master).Returns(hotelItem);

            // Act
            var result = sut.Synchronize("/").ToList();

            // Assert - the orphaned item is found by name, repaired in place, and returned as CertificateAdded
            result.Should().HaveCount(4);
            result.Skip(2).First().Operation.Should().Be(SynchronizationOperation.CertificateAdded);
        }

        [Fact]
        public void GetFinalStatusMessage_ShouldBeNullOrEmpty()
        {
            // Arrange
            var processedItems = new List<CertificationSynchronisationResult>();

            // Act
            var result = sut.GetFinalStatusMessage(processedItems);

            // Assert
            result.Should().BeNullOrEmpty();
        }

        [Fact]
        public void GetFinalStatusMessage_ShouldNotBeNullOrEmpty()
        {
            // Arrange
            var processedItems = new List<CertificationSynchronisationResult>
            {
                new CertificationSynchronisationResult { Operation = SynchronizationOperation.CertificateAdded, Message = "Added" },
                new CertificationSynchronisationResult { Operation = SynchronizationOperation.CertificateRemoved, Message = "Removed" },
                new CertificationSynchronisationResult { Operation = SynchronizationOperation.UiMessage, Message = "Message" },
                new CertificationSynchronisationResult { Operation = SynchronizationOperation.Error, Message = "Error" },
                new CertificationSynchronisationResult { Operation = SynchronizationOperation.Untouched, Message = "Unchanged" }
            };

            // Act
            var result = sut.GetFinalStatusMessage(processedItems);

            // Assert
            result.Should().NotBeNullOrEmpty();
        }

        [Fact]
        public void GetFinalStatusMessage_Should_AppendErrorMessages_WhenAllOperationsAreErrorsOrUiMessages()
        {
            // Arrange - no Add/Remove/Untouched present, so the error-message detail block runs
            var processedItems = new List<CertificationSynchronisationResult>
            {
                new CertificationSynchronisationResult { Operation = SynchronizationOperation.UiMessage, Message = "Fetching..." },
                new CertificationSynchronisationResult { Operation = SynchronizationOperation.Error, Message = "Cert lookup failed" },
                new CertificationSynchronisationResult { Operation = SynchronizationOperation.Error, Message = "API timed out" },
            };

            // Act
            var result = sut.GetFinalStatusMessage(processedItems);

            // Assert - count summary plus each individual error message
            result.Should().Contain("2 errors occurred!");
            result.Should().Contain("Cert lookup failed");
            result.Should().Contain("API timed out");
        }
    }
}
