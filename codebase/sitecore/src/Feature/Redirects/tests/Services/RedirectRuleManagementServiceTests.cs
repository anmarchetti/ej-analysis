using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using easyJet.Feature.Redirects.Models;
using easyJet.Feature.Redirects.Services;
using easyJet.Foundation.SitecoreExtensions.Models;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Abstractions;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Globalization;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Feature.Redirects.Tests.Services
{
    public class RedirectRuleManagementServiceTests
    {
        private readonly IRedirectRuleRepository repository;
        private readonly ICsvUtilsService csvUtilsService;
        private readonly BaseLinkManager linkManager;
        private readonly BaseFactory factory;
        private readonly RedirectRuleManagementService service;
        private readonly Database database;

        public RedirectRuleManagementServiceTests()
        {
            repository = Substitute.For<IRedirectRuleRepository>();
            csvUtilsService = Substitute.For<ICsvUtilsService>();
            linkManager = Substitute.For<BaseLinkManager>();
            factory = Substitute.For<BaseFactory>();
            database = FakeUtil.FakeDatabase();
            service = new RedirectRuleManagementService(repository, csvUtilsService, linkManager, factory);
        }

        [Fact]
        public void ImportCsv_ShouldIgnoreInvalidFilterPageTypes()
        {
            // Arrange
            var validId = ID.NewID;
            var rows = new List<RedirectRuleCsvRow>
            {
                new RedirectRuleCsvRow
                {
                    FromUrl = "/from",
                    ToUrl = "/to",
                    RedirectType = "301",
                    FilterPageTypes = $"not-a-guid|{validId}",
                    Priority = "1"
                }
            };
            csvUtilsService.ReadFromCsv<RedirectRuleCsvRow>(Arg.Any<Stream>(), Arg.Any<FileParameters>()).Returns(rows);
            repository.GetRules(Arg.Any<Database>()).Returns(Array.Empty<RedirectRuleItem>());

            RedirectRuleInput captured = null;
            var ruleItem = new FakeItem()
                .WithTemplate(Templates.RedirectRule.ID);

            repository.CreateRule(Arg.Any<Database>(), Arg.Do<RedirectRuleInput>(input => captured = input)).Returns(ruleItem);

            // Act
            var result = service.ImportCsv(new MemoryStream(new byte[] { 1 }), database);

            // Assert
            result.Errors.Should().BeEmpty();
            result.Added.Should().Be(1);
            captured.Should().NotBeNull();
            var capturedIds = captured.FilterPageTypes.Split(new[] { '|' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(ID.Parse)
                .ToList();
            capturedIds.Should().Contain(validId);
            capturedIds.Should().HaveCount(1);
        }

        [Fact]
        public void ImportCsv_ShouldDeleteRule_WhenMarkedToDelete()
        {
            // Arrange
            var existingRuleId = ID.NewID;
            var rows = new List<RedirectRuleCsvRow>
            {
                new RedirectRuleCsvRow
                {
                    FromUrl = "/old",
                    MarkRecordToDelete = "Y"
                }
            };
            csvUtilsService.ReadFromCsv<RedirectRuleCsvRow>(Arg.Any<Stream>(), Arg.Any<FileParameters>()).Returns(rows);
            repository.GetRules(Arg.Any<Database>()).Returns(new[]
                {
                    new RedirectRuleItem
                    {
                        Id = existingRuleId,
                        NormalizedFromUrl = "/old"
                    }
                });

            var existingItem = new FakeItem(existingRuleId).WithTemplate(Templates.RedirectRule.ID);
            repository.GetRuleItemById(Arg.Any<Database>(), existingRuleId).Returns(existingItem);

            // Act
            var result = service.ImportCsv(new MemoryStream(new byte[] { 1 }), database);

            // Assert
            result.Errors.Should().BeEmpty();
            result.Deleted.Should().Be(1);
            repository.Received(1).DeleteRule(existingItem);
            repository.DidNotReceive().CreateRule(Arg.Any<Database>(), Arg.Any<RedirectRuleInput>());
        }

        [Fact]
        public void UpsertRule_ShouldNormalizeFilterPageTypes()
        {
            // Arrange
            var id1 = ID.NewID;
            var id2 = ID.NewID;
            var input = new RedirectRuleInput
            {
                FromUrl = "/from",
                ToUrl = "/to",
                RedirectType = 302,
                Priority = 0,
                FilterPageTypes = $" {id1} | {id1} | {id2} "
            };

            repository.FindRule(Arg.Any<Database>(), Arg.Any<string>(), Arg.Any<string>(), Arg.Any<LanguageMaps>()).Returns((Item)null);

            RedirectRuleInput captured = null;
            var ruleId = ID.NewID;
            var createdItem = new FakeItem(ruleId)
                .WithTemplate(Templates.RedirectRule.ID);

            repository.CreateRule(Arg.Any<Database>(), Arg.Do<RedirectRuleInput>(ruleInput => captured = ruleInput)).Returns(createdItem);
            repository.GetRules(Arg.Any<Database>()).Returns(new[]
                {
                    new RedirectRuleItem
                    {
                        Id = ruleId,
                        FromUrl = input.FromUrl,
                        ToUrl = input.ToUrl,
                        RedirectType = input.RedirectType,
                        FilterPageTypes = $"{id1}|{id2}"
                    }
                });

            // Act
            var result = service.UpsertRule(database, input, out var created, out var error);

            // Assert
            error.Should().BeNull();
            created.Should().BeTrue();
            result.Should().NotBeNull();
            var capturedIds = captured.FilterPageTypes.Split(new[] { '|' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(ID.Parse)
                .ToList();
            capturedIds.Should().BeEquivalentTo(new[] { id1, id2 });
        }

        [Fact]
        public void UpsertRule_ShouldReturnError_WhenRedirectTypeInvalid()
        {
            var input = new RedirectRuleInput
            {
                FromUrl = "/from",
                ToUrl = "/to",
                RedirectType = 200,
                Priority = 0
            };

            var result = service.UpsertRule(database, input, out var created, out var error);

            result.Should().BeNull();
            created.Should().BeFalse();
            error.Should().Be("Redirect type must be 301 or 302.");
        }

        [Fact]
        public void UpsertRule_ShouldReturnError_WhenFilterPageTypesInvalid()
        {
            var input = new RedirectRuleInput
            {
                FromUrl = "/from",
                ToUrl = "/to",
                RedirectType = 301,
                Priority = 0,
                FilterPageTypes = "not-a-guid"
            };

            var result = service.UpsertRule(database, input, out var created, out var error);

            result.Should().BeNull();
            created.Should().BeFalse();
            error.Should().Be("FilterPageTypes must contain valid template IDs separated by '|'.");
        }

        [Fact]
        public void DeleteRule_ShouldReturnError_WhenIdInvalid()
        {
            var success = service.DeleteRule(database, "not-a-guid", out var error);

            success.Should().BeFalse();
            error.Should().Be("Invalid rule id.");
        }

        [Fact]
        public void ImportCsv_ShouldReturnError_WhenStreamMissing()
        {
            var result = service.ImportCsv(null, database);

            result.Errors.Should().Contain("CSV file or database was not provided.");
            result.Skipped.Should().Be(0);
        }

        [Fact]
        public void ImportCsv_ShouldReturnError_WhenParsingFails()
        {
            csvUtilsService.ReadFromCsv<RedirectRuleCsvRow>(Arg.Any<Stream>(), Arg.Any<FileParameters>()).Returns(_ => throw new InvalidDataException("bad"));

            var result = service.ImportCsv(new MemoryStream(new byte[] { 1 }), database);

            result.Errors.Should().Contain("CSV parsing failed. Ensure the file is a valid CSV with the required headers.");
        }

        [Fact]
        public void ImportCsv_ShouldSkipInvalidRows()
        {
            var rows = new List<RedirectRuleCsvRow>
            {
                new RedirectRuleCsvRow { FromUrl = string.Empty, ToUrl = "/to", RedirectType = "301" },
                new RedirectRuleCsvRow { FromUrl = "/from", ToUrl = string.Empty, RedirectType = "301" },
                new RedirectRuleCsvRow { FromUrl = "/from2", ToUrl = "/to", RedirectType = "200" },
                new RedirectRuleCsvRow { FromUrl = "/from3", ToUrl = "/to", RedirectType = "301", Priority = "-1" }
            };
            csvUtilsService.ReadFromCsv<RedirectRuleCsvRow>(Arg.Any<Stream>(), Arg.Any<FileParameters>()).Returns(rows);
            repository.GetRules(Arg.Any<Database>()).Returns(Array.Empty<RedirectRuleItem>());

            var result = service.ImportCsv(new MemoryStream(new byte[] { 1 }), database);

            result.Skipped.Should().Be(4);
            result.Errors.Should().HaveCount(4);
        }

        [Fact]
        public void ImportCsv_ShouldIgnoreEmptyRows()
        {
            var rows = new List<RedirectRuleCsvRow>
            {
                new RedirectRuleCsvRow
                {
                    FromUrl = "/from",
                    ToUrl = "/to",
                    RedirectType = "301"
                },
                new RedirectRuleCsvRow
                {
                    FromUrl = " ",
                    ToUrl = null,
                    SetupDate = " ",
                    SitecoreUser = " ",
                    Comments = " ",
                    RedirectType = " ",
                    Priority = " ",
                    FilterPageTypes = " ",
                    Group = " ",
                    MarkRecordToDelete = " "
                }
            };
            csvUtilsService.ReadFromCsv<RedirectRuleCsvRow>(Arg.Any<Stream>(), Arg.Any<FileParameters>()).Returns(rows);
            repository.GetRules(Arg.Any<Database>()).Returns(Array.Empty<RedirectRuleItem>());
            var item = new FakeItem().WithTemplate(Templates.RedirectRule.ID);
            repository.CreateRule(Arg.Any<Database>(), Arg.Any<RedirectRuleInput>()).Returns(item);

            var result = service.ImportCsv(new MemoryStream(new byte[] { 1 }), database);

            result.Errors.Should().BeEmpty();
            result.Skipped.Should().Be(0);
            result.Added.Should().Be(1);
            repository.Received(1).CreateRule(Arg.Any<Database>(), Arg.Any<RedirectRuleInput>());
        }

        [Fact]
        public void ImportCsv_ShouldIgnoreNullRows()
        {
            var rows = new List<RedirectRuleCsvRow>
            {
                null,
                new RedirectRuleCsvRow
                {
                    FromUrl = "/from",
                    ToUrl = "/to",
                    RedirectType = "301"
                }
            };
            csvUtilsService.ReadFromCsv<RedirectRuleCsvRow>(Arg.Any<Stream>(), Arg.Any<FileParameters>())
                .Returns(rows);
            repository.GetRules(Arg.Any<Database>()).Returns(Array.Empty<RedirectRuleItem>());

            var item = new FakeItem().WithTemplate(Templates.RedirectRule.ID);

            repository.CreateRule(Arg.Any<Database>(), Arg.Any<RedirectRuleInput>())
                .Returns(item);

            var result = service.ImportCsv(new MemoryStream(new byte[] { 1 }), database);

            result.Errors.Should().BeEmpty();
            result.Skipped.Should().Be(0);
            result.Added.Should().Be(1);
            repository.Received(1).CreateRule(Arg.Any<Database>(), Arg.Any<RedirectRuleInput>());
        }

        [Fact]
        public void ExportCsv_ShouldReturnCsvWithHeader()
        {
            repository.GetRules(Arg.Any<Database>()).Returns(new[]
                {
                    new RedirectRuleItem
                    {
                        FromUrl = "/from",
                        ToUrl = "/to",
                        RedirectType = 301,
                        Priority = 1,
                        Comments = "note",
                        FilterPageTypes = string.Empty,
                        GroupName = "GroupA",
                        Created = DateTime.UtcNow,
                        CreatedBy = "sitecore\\admin"
                    }
                });

            var bytes = service.ExportCsv(database);
            var text = Encoding.UTF8.GetString(bytes);

            text.Should().Contain("From URL");
            text.Should().Contain("/from");
        }

        [Fact]
        public void UpsertRule_ShouldReturnError_WhenDatabaseMissing()
        {
            var input = new RedirectRuleInput
            {
                FromUrl = "/from",
                ToUrl = "/to",
                RedirectType = 301,
                Priority = 0
            };

            var result = service.UpsertRule(null, input, out var created, out var error);

            result.Should().BeNull();
            created.Should().BeFalse();
            error.Should().Be("Database was not provided.");
        }

        [Fact]
        public void UpsertRule_ShouldUpdateExistingRule()
        {
            var input = new RedirectRuleInput
            {
                FromUrl = "/from",
                ToUrl = "/to",
                RedirectType = 301,
                Priority = 0
            };
            var ruleId = ID.NewID;

            var existingItem = new FakeItem(ruleId).WithTemplate(Templates.RedirectRule.ID);

            repository.FindRule(database, RedirectRuleHelper.NormalizePattern(input.FromUrl), Arg.Any<string>(), Arg.Any<LanguageMaps>()).Returns(existingItem);
            repository.UpdateRule(existingItem, input).Returns(existingItem);
            repository.GetRules(database).Returns(new[]
            {
                new RedirectRuleItem { Id = ruleId }
            });

            var result = service.UpsertRule(database, input, out var created, out var error);

            result.Should().NotBeNull();
            created.Should().BeFalse();
            error.Should().BeNull();
            repository.Received(1).UpdateRule(existingItem, input);
        }

        [Fact]
        public void UpsertRule_ShouldSkipAutoRule_WhenManualRuleExistsForSameFromUrl()
        {
            var hotelId = ID.NewID;
            var input = new RedirectRuleInput
            {
                FromUrl = "/spain/old-hotel",
                ToUrl = "/spain/new-hotel",
                RedirectType = 302,
                Priority = 0,
                Status = RedirectRuleStatus.AwaitingPublish,
                RelatedItem = hotelId.ToString()
            };
            var ruleId = ID.NewID;
            var existingItem = new FakeItem(ruleId)
                .WithTemplate(Templates.RedirectRule.ID)
                .WithField(Templates.RedirectRule.Fields.RelatedItem, "RelatedItem", string.Empty);

            repository.FindRule(database, RedirectRuleHelper.NormalizePattern(input.FromUrl), Arg.Any<string>(), Arg.Any<LanguageMaps>())
                .Returns(existingItem);

            var result = service.UpsertRule(database, input, out var created, out var error);

            result.Should().BeNull();
            created.Should().BeFalse();
            error.Should().Be("A redirect rule already exists for this URL.");
            repository.DidNotReceive().UpdateRule(Arg.Any<Item>(), Arg.Any<RedirectRuleInput>());
            repository.DidNotReceive().CreateRule(Arg.Any<Database>(), Arg.Any<RedirectRuleInput>());
        }

        [Fact]
        public void DeleteRule_ShouldDeleteRule_WhenFound()
        {
            var ruleId = ID.NewID;

            var item = new FakeItem(ruleId).WithTemplate(Templates.RedirectRule.ID);
            repository.GetRuleItemById(database, ruleId).Returns(item);
            var success = service.DeleteRule(database, ruleId.ToString(), out var error);

            success.Should().BeTrue();
            error.Should().BeNull();
            repository.Received(1).DeleteRule(item);
        }

        [Fact]
        public void ImportCsv_ShouldUpdateExistingRule()
        {
            var ruleId = ID.NewID;
            var rows = new List<RedirectRuleCsvRow>
            {
                new RedirectRuleCsvRow
                {
                    FromUrl = "/from",
                    ToUrl = "/to",
                    RedirectType = "301"
                }
            };
            csvUtilsService.ReadFromCsv<RedirectRuleCsvRow>(Arg.Any<Stream>(), Arg.Any<FileParameters>()).Returns(rows);
            repository.GetRules(Arg.Any<Database>()).Returns(new[]
                {
                    new RedirectRuleItem
                    {
                        Id = ruleId,
                        NormalizedFromUrl = RedirectRuleHelper.NormalizePattern("/from")
                    }
                });

            var item = new FakeItem(ruleId).WithTemplate(Templates.RedirectRule.ID);

            repository.GetRuleItemById(database, ruleId).Returns(item);
            repository.UpdateRule(item, Arg.Any<RedirectRuleInput>()).Returns(item);

            var result = service.ImportCsv(new MemoryStream(new byte[] { 1 }), database);

            result.Updated.Should().Be(1);
            repository.Received(1).UpdateRule(item, Arg.Any<RedirectRuleInput>());
        }

        [Fact]
        public void ImportCsv_ShouldCreateRule_WhenExistingRuleHasDifferentLanguages()
        {
            var ruleId = ID.NewID;
            var rows = new List<RedirectRuleCsvRow>
            {
                new RedirectRuleCsvRow
                {
                    FromUrl = "/from",
                    ToUrl = "/to",
                    RedirectType = "301",
                    Languages = "fr-FR"
                }
            };
            csvUtilsService.ReadFromCsv<RedirectRuleCsvRow>(Arg.Any<Stream>(), Arg.Any<FileParameters>()).Returns(rows);
            repository.GetRules(Arg.Any<Database>()).Returns(new[]
                {
                    new RedirectRuleItem
                    {
                        Id = ruleId,
                        NormalizedFromUrl = RedirectRuleHelper.NormalizePattern("/from"),
                        Languages = "de-DE"
                    }
                });

            var created = new FakeItem(ID.NewID).WithTemplate(Templates.RedirectRule.ID);
            repository.CreateRule(database, Arg.Any<RedirectRuleInput>()).Returns(created);
            repository.GetRules(database).Returns(new[]
            {
                new RedirectRuleItem { Id = created.ID }
            });

            var result = service.ImportCsv(new MemoryStream(new byte[] { 1 }), database);

            result.Added.Should().Be(1);
            result.Updated.Should().Be(0);
            repository.Received(1).CreateRule(database, Arg.Any<RedirectRuleInput>());
            repository.DidNotReceive().UpdateRule(Arg.Any<Item>(), Arg.Any<RedirectRuleInput>());
        }

        [Fact]
        public void ImportCsv_ShouldReportDuplicateFromUrl()
        {
            var rows = new List<RedirectRuleCsvRow>
            {
                new RedirectRuleCsvRow
                {
                    FromUrl = "/from",
                    ToUrl = "/to",
                    RedirectType = "301"
                },
                new RedirectRuleCsvRow
                {
                    FromUrl = "/from",
                    ToUrl = "/to-dup",
                    RedirectType = "301"
                }
            };
            csvUtilsService.ReadFromCsv<RedirectRuleCsvRow>(Arg.Any<Stream>(), Arg.Any<FileParameters>()).Returns(rows);
            repository.GetRules(Arg.Any<Database>()).Returns(Array.Empty<RedirectRuleItem>());

            var item = new FakeItem().WithTemplate(Templates.RedirectRule.ID);

            repository.CreateRule(Arg.Any<Database>(), Arg.Any<RedirectRuleInput>()).Returns(item);

            var result = service.ImportCsv(new MemoryStream(new byte[] { 1 }), database);

            result.Skipped.Should().Be(1);
            result.Errors.Should().Contain(error => error.Contains("Duplicate From URL"));
            repository.Received(1).CreateRule(Arg.Any<Database>(), Arg.Any<RedirectRuleInput>());
        }

        [Fact]
        public void ImportCsv_ShouldReportMissingRuleOnDelete()
        {
            var rows = new List<RedirectRuleCsvRow>
            {
                new RedirectRuleCsvRow
                {
                    FromUrl = "/missing",
                    MarkRecordToDelete = "Y"
                }
            };
            csvUtilsService.ReadFromCsv<RedirectRuleCsvRow>(Arg.Any<Stream>(), Arg.Any<FileParameters>()).Returns(rows);
            repository.GetRules(Arg.Any<Database>()).Returns(Array.Empty<RedirectRuleItem>());

            var result = service.ImportCsv(new MemoryStream(new byte[] { 1 }), database);

            result.Errors.Should().Contain(error => error.Contains("Rule not found for delete"));
            result.Deleted.Should().Be(0);
            repository.DidNotReceive().DeleteRule(Arg.Any<Item>());
        }

        [Fact]
        public void ActivateReadyRules_ShouldActivateAllRelatedRulesWithSameTarget()
        {
            var hotelId = ID.NewID;
            var ruleToActivateId = ID.NewID;
            var parallelRuleId = ID.NewID;
            var ruleToActivate = new RedirectRuleItem
            {
                Id = ruleToActivateId,
                FromUrl = "/spain/new-hotel",
                RelatedItemId = hotelId,
                Status = RedirectRuleStatus.AwaitingPublish,
                RedirectType = 302
            };
            var parallelRule = new RedirectRuleItem
            {
                Id = parallelRuleId,
                FromUrl = "/spain/old-hotel",
                RelatedItemId = hotelId,
                Status = RedirectRuleStatus.AwaitingPublish,
                RedirectType = 302
            };

            repository.GetRules(database).Returns(new[] { ruleToActivate, parallelRule });

            var webDatabase = FakeUtil.FakeDatabase();
            var webItem = new FakeItem(hotelId).ToSitecoreItem();
            webDatabase.GetItem(hotelId, Arg.Any<Language>()).Returns(webItem);
            factory.GetDatabase("web").Returns(webDatabase);
            linkManager.GetItemUrl(webItem).Returns("/destinations/spain/final-hotel");

            var activatingItem = new FakeItem(ruleToActivateId).WithTemplate(Templates.RedirectRule.ID).ToSitecoreItem();
            var parallelItem = new FakeItem(parallelRuleId).WithTemplate(Templates.RedirectRule.ID).ToSitecoreItem();
            repository.GetRuleItemById(database, ruleToActivateId).Returns(activatingItem);
            repository.GetRuleItemById(database, parallelRuleId).Returns(parallelItem);

            var capturedInputs = new List<RedirectRuleInput>();
            repository.UpdateRule(Arg.Any<Item>(), Arg.Do<RedirectRuleInput>(input => capturedInputs.Add(input)))
                .Returns(callInfo => callInfo.Arg<Item>());

            var activated = service.ActivateReadyRules(database, out var error);

            error.Should().BeNull();
            activated.Should().Be(1);
            repository.DidNotReceive().DeleteRule(Arg.Any<Item>());
            capturedInputs.Should().HaveCount(2);
            capturedInputs.Should().OnlyContain(input =>
                input.Status == RedirectRuleStatus.Active
                && input.RedirectType == 301
                && input.ToUrl == "/destinations/spain/final-hotel");
        }

        [Fact]
        public void ActivateReadyRules_ShouldLeaveExistingActiveRulesUnchanged()
        {
            var ruleAtoBId = ID.NewID;
            var ruleBtoCId = ID.NewID;
            var hotelId = ID.NewID;

            var ruleAtoB = new RedirectRuleItem
            {
                Id = ruleAtoBId,
                FromUrl = "/a",
                ToUrl = "/b",
                RelatedItemId = hotelId,
                Status = RedirectRuleStatus.Active,
                RedirectType = 301
            };
            var ruleBtoC = new RedirectRuleItem
            {
                Id = ruleBtoCId,
                FromUrl = "/b",
                RelatedItemId = hotelId,
                Status = RedirectRuleStatus.AwaitingPublish,
                RedirectType = 302
            };

            repository.GetRules(database).Returns(new[] { ruleAtoB, ruleBtoC });

            var webDatabase = FakeUtil.FakeDatabase();
            var webItem = new FakeItem(hotelId).ToSitecoreItem();
            webDatabase.GetItem(hotelId, Arg.Any<Language>()).Returns(webItem);
            factory.GetDatabase("web").Returns(webDatabase);
            linkManager.GetItemUrl(webItem).Returns("/c");

            var activatingItem = new FakeItem(ruleBtoCId).ToSitecoreItem();
            repository.GetRuleItemById(database, ruleBtoCId).Returns(activatingItem);

            RedirectRuleInput captured = null;
            repository.UpdateRule(Arg.Any<Item>(), Arg.Do<RedirectRuleInput>(input => captured = input))
                .Returns(activatingItem);

            var activated = service.ActivateReadyRules(database, out var error);

            error.Should().BeNull();
            activated.Should().Be(1);
            captured.Should().NotBeNull();
            captured.FromUrl.Should().Be("/b");
            captured.ToUrl.Should().Be("/c");
            captured.Status.Should().Be(RedirectRuleStatus.Active);
            repository.Received(1).UpdateRule(activatingItem, Arg.Any<RedirectRuleInput>());
            repository.DidNotReceive().UpdateRule(Arg.Is<Item>(item => item.ID == ruleAtoBId), Arg.Any<RedirectRuleInput>());
            repository.DidNotReceive().DeleteRule(Arg.Any<Item>());
        }

        [Fact]
        public void ActivateReadyRules_ShouldPromoteAwaitingPublishRuleWithDeletingActiveRules()
        {
            var hotelId = ID.NewID;
            var ruleAtoBId = ID.NewID;
            var ruleBtoCId = ID.NewID;
            var ruleCtoAId = ID.NewID;

            var ruleAtoB = new RedirectRuleItem
            {
                Id = ruleAtoBId,
                FromUrl = "/a",
                ToUrl = "/b",
                RelatedItemId = hotelId,
                Status = RedirectRuleStatus.Active,
                RedirectType = 301
            };
            var ruleBtoC = new RedirectRuleItem
            {
                Id = ruleBtoCId,
                FromUrl = "/b",
                ToUrl = "/c",
                RelatedItemId = hotelId,
                Status = RedirectRuleStatus.Active,
                RedirectType = 301
            };
            var ruleCtoA = new RedirectRuleItem
            {
                Id = ruleCtoAId,
                FromUrl = "/c",
                ToUrl = "/a",
                RelatedItemId = hotelId,
                Status = RedirectRuleStatus.AwaitingPublish,
                RedirectType = 302
            };

            repository.GetRules(database).Returns(new[] { ruleAtoB, ruleBtoC, ruleCtoA });

            var webDatabase = FakeUtil.FakeDatabase();
            var webItem = new FakeItem(hotelId).ToSitecoreItem();
            webDatabase.GetItem(hotelId, Arg.Any<Language>()).Returns(webItem);
            factory.GetDatabase("web").Returns(webDatabase);
            linkManager.GetItemUrl(webItem).Returns("/a");

            var ruleAtoBItem = new FakeItem(ruleAtoBId).ToSitecoreItem();
            var ruleBtoCItem = new FakeItem(ruleBtoCId).ToSitecoreItem();
            var ruleCtoAItem = new FakeItem(ruleCtoAId).ToSitecoreItem();
            repository.GetRuleItemById(database, ruleAtoBId).Returns(ruleAtoBItem);
            repository.GetRuleItemById(database, ruleBtoCId).Returns(ruleBtoCItem);
            repository.GetRuleItemById(database, ruleCtoAId).Returns(ruleCtoAItem);

            var activated = service.ActivateReadyRules(database, out var error);

            error.Should().BeNull();
            activated.Should().Be(1);
            repository.Received().DeleteRule(ruleAtoBItem);
            repository.Received(1).UpdateRule(ruleCtoAItem, Arg.Is<RedirectRuleInput>(input =>
                input.Status == RedirectRuleStatus.Active
                && input.ToUrl == "/a"
                && input.RedirectType == 301));
            repository.DidNotReceive().UpdateRule(ruleAtoBItem, Arg.Any<RedirectRuleInput>());
            repository.Received().UpdateRule(ruleBtoCItem, Arg.Any<RedirectRuleInput>());
        }
    }
}
