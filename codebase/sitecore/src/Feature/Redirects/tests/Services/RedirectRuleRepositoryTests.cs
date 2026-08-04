using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using easyJet.Feature.Redirects.Models;
using easyJet.Feature.Redirects.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore;
using Sitecore.Data;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Feature.Redirects.Tests.Services
{
    [Collection("SitecoreSettings")]
    public class RedirectRuleRepositoryTests
    {
        [Fact]
        public void GetRules_ShouldMapFieldsAndGroupName()
        {
            EnsureRulesRootPath();
            var repository = new RedirectRuleRepository();
            var rootId = ID.NewID;
            var groupId = ID.NewID;
            var ruleId = ID.NewID;
            var filterId = ID.NewID;
            var database = FakeUtil.FakeDatabase();

            var rootItem = new FakeItem(rootId, database)
                .WithName("redirect-rules")
                .WithTemplate(Templates.RedirectRulesFolder.ID)
                .WithPath("/sitecore/content/redirect-rules")
                .WithItemAxes();

            var groupItem = new FakeItem(groupId, database)
                .WithName("GroupA")
                .WithTemplate(Templates.RedirectRulesFolder.ID)
                .WithDisplayName("Group A")
                .WithParent(rootItem);

            var ruleItem = new FakeItem(ruleId, database)
                .WithName("rule-1")
                .WithTemplate(Templates.RedirectRule.ID)
                .WithField(Templates.RedirectRule.Fields.FromUrl, "FromUrl", "/from")
                .WithField(Templates.RedirectRule.Fields.ToUrl, "ToUrl", "/to")
                .WithField(Templates.RedirectRule.Fields.RedirectType, "RedirectType", "301")
                .WithField(Templates.RedirectRule.Fields.Comments, "Comments", "comment")
                .WithField(Templates.RedirectRule.Fields.Priority, "Priority", "10")
                .WithField(Templates.RedirectRule.Fields.FilterPageTypes, "FilterPageTypes", filterId.ToString())
                .WithItemAxes()
                .WithStatistics()
                .WithAppearance()
                .WithParent(groupItem);

            var root = rootItem.ToSitecoreItem();
            var rule = ruleItem.ToSitecoreItem();
            root.Axes.GetDescendants().Returns(new[] { rule });
            rule.Axes.GetAncestors().Returns(new[] { groupItem.ToSitecoreItem() });

            // Setup database to return items when queried by path
            database.GetItem("/sitecore/content/redirect-rules").Returns(rootItem.ToSitecoreItem());
            database.GetItem(rootId).Returns(rootItem.ToSitecoreItem());

            var rules = repository.GetRules(database).ToList();

            rules.Should().HaveCount(1);
            var r = rules[0];
            r.FromUrl.Should().Be("/from");
            r.ToUrl.Should().Be("/to");
            r.RedirectType.Should().Be(301);
            r.Priority.Should().Be(10);
            r.FilterPageTypeIds.Should().Contain(filterId);
            r.GroupName.Should().Be("Group A");
        }

        [Fact]
        public void FindRuleByFromUrl_ShouldReturnMatchingItem()
        {
            EnsureRulesRootPath();
            var repository = new RedirectRuleRepository();
            var rootId = ID.NewID;
            var ruleId = ID.NewID;
            var database = FakeUtil.FakeDatabase();

            var rootItem = new FakeItem(rootId, database)
                .WithName("redirect-rules")
                .WithTemplate(Templates.RedirectRulesFolder.ID)
                .WithPath("/sitecore/content/redirect-rules")
                .WithItemAxes();

            var ruleItem = new FakeItem(ruleId, database)
                .WithName("rule-2")
                .WithTemplate(Templates.RedirectRule.ID)
                .WithField(Templates.RedirectRule.Fields.FromUrl, "FromUrl", "/Deals")
                .WithParent(rootItem);

            var root = rootItem.ToSitecoreItem();
            root.Axes.GetDescendants().Returns(new[] { ruleItem.ToSitecoreItem() });

            // Setup database to return items when queried
            database.GetItem("/sitecore/content/redirect-rules").Returns(root);
            database.GetItem(rootId).Returns(rootItem.ToSitecoreItem());
            database.GetItem(ruleId).Returns(ruleItem.ToSitecoreItem());

            var normalized = RedirectRuleHelper.NormalizePattern("/deals");
            var item = repository.FindRule(
                database,
                normalized,
                string.Empty,
                new LanguageMaps(new Dictionary<ID, string>(), new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)));

            item.Should().NotBeNull();
            item.ID.Should().Be(ruleId);
        }

        [Fact]
        public void FindRuleByFromUrl_ShouldIgnoreLanguageOrder()
        {
            EnsureRulesRootPath();
            var repository = new RedirectRuleRepository();
            var rootId = ID.NewID;
            var ruleId = ID.NewID;
            var enId = ID.NewID;
            var frId = ID.NewID;
            var database = FakeUtil.FakeDatabase();

            var rootItem = new FakeItem(rootId, database)
                .WithName("redirect-rules")
                .WithTemplate(Templates.RedirectRulesFolder.ID)
                .WithPath("/sitecore/content/redirect-rules")
                .WithItemAxes();

            var ruleItem = new FakeItem(ruleId, database)
                .WithName("rule-languages")
                .WithTemplate(Templates.RedirectRule.ID)
                .WithField(Templates.RedirectRule.Fields.FromUrl, "FromUrl", "/Deals")
                .WithField(Templates.RedirectRule.Fields.Languages, "Languages", $"{enId}|{frId}")
                .WithParent(rootItem);

            var root = rootItem.ToSitecoreItem();
            root.Axes.GetDescendants().Returns(new[] { ruleItem.ToSitecoreItem() });

            database.GetItem("/sitecore/content/redirect-rules").Returns(root);
            database.GetItem(rootId).Returns(rootItem.ToSitecoreItem());
            database.GetItem(ruleId).Returns(ruleItem.ToSitecoreItem());

            var languageMaps = new LanguageMaps(
                new Dictionary<ID, string>
                {
                    [enId] = "en",
                    [frId] = "fr-FR"
                },
                new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["en"] = enId.ToString(),
                    ["fr-FR"] = frId.ToString()
                });

            var normalized = RedirectRuleHelper.NormalizePattern("/deals");
            var item = repository.FindRule(database, normalized, "fr-FR,en", languageMaps);

            item.Should().NotBeNull();
            item.ID.Should().Be(ruleId);
        }

        [Fact]
        public void UpdateRule_ShouldNormalizeFilterPageTypes()
        {
            EnsureRulesRootPath();
            var repository = new RedirectRuleRepository();
            var rootId = ID.NewID;
            var ruleId = ID.NewID;
            var id1 = ID.NewID;
            var id2 = ID.NewID;
            var database = FakeUtil.FakeDatabase();

            var rootItem = new FakeItem(rootId, database)
                .WithName("redirect-rules")
                .WithTemplate(Templates.RedirectRulesFolder.ID)
                .WithPath("/sitecore/content/redirect-rules");

            var ruleItem = new FakeItem(ruleId, database)
                .WithName("rule-3")
                .WithTemplate(Templates.RedirectRule.ID)
                .WithField(Templates.RedirectRule.Fields.FromUrl, "FromUrl", string.Empty)
                .WithField(Templates.RedirectRule.Fields.ToUrl, "ToUrl", string.Empty)
                .WithField(Templates.RedirectRule.Fields.RedirectType, "RedirectType", string.Empty)
                .WithField(Templates.RedirectRule.Fields.Comments, "Comments", string.Empty)
                .WithField(Templates.RedirectRule.Fields.Priority, "Priority", string.Empty)
                .WithField(Templates.RedirectRule.Fields.FilterPageTypes, "FilterPageTypes", string.Empty)
                .WithParent(rootItem)
                .WithItemEditing();

            // Setup database
            database.GetItem("/sitecore/content/redirect-rules").Returns(rootItem.ToSitecoreItem());
            database.GetItem(rootId).Returns(rootItem.ToSitecoreItem());
            database.GetItem(ruleId).Returns(ruleItem.ToSitecoreItem());

            var item = ruleItem.ToSitecoreItem();
            var input = new RedirectRuleInput
            {
                FromUrl = "/from",
                ToUrl = "/to",
                RedirectType = 302,
                Comments = "note",
                Priority = 2,
                FilterPageTypes = $" {id1} | {id1} | {id2} "
            };

            repository.UpdateRule(item, input);

            item[Templates.RedirectRule.Fields.FilterPageTypes].Should().Be($"{id1}|{id2}");
            item[Templates.RedirectRule.Fields.FromUrl].Should().Be("/from");
        }

        [Fact]
        public void CreateRule_ShouldCreateGroup_WhenGroupNameProvided()
        {
            EnsureRulesRootPath();
            var repository = new RedirectRuleRepository();
            var rootId = ID.NewID;
            var ruleId = ID.NewID;
            var database = FakeUtil.FakeDatabase();

            var rootItem = new FakeItem(rootId, database)
                .WithName("redirect-rules")
                .WithTemplate(Templates.RedirectRulesFolder.ID)
                .WithPath("/sitecore/content/redirect-rules")
                .WithItemEditing();

            var groupItem = new FakeItem(ID.NewID, database)
                .WithName("GroupA")
                .WithTemplate(Templates.RedirectRulesFolder.ID)
                .WithDisplayName("Group A")
                .WithParent(rootItem)
                .WithItemEditing();

            var ruleItem = new FakeItem(ruleId, database)
                .WithName("rule-4")
                .WithTemplate(Templates.RedirectRule.ID)
                .WithField(FieldIDs.DisplayName, string.Empty)
                .WithField(Templates.RedirectRule.Fields.FromUrl, "FromUrl", string.Empty)
                .WithField(Templates.RedirectRule.Fields.ToUrl, "ToUrl", string.Empty)
                .WithField(Templates.RedirectRule.Fields.RedirectType, "RedirectType", string.Empty)
                .WithField(Templates.RedirectRule.Fields.Comments, "Comments", string.Empty)
                .WithField(Templates.RedirectRule.Fields.Priority, "Priority", string.Empty)
                .WithField(Templates.RedirectRule.Fields.FilterPageTypes, "FilterPageTypes", string.Empty)
                .WithParent(groupItem)
                .WithItemEditing();

            var root = rootItem.ToSitecoreItem();
            var group = groupItem.ToSitecoreItem();

            // Setup database
            database.GetItem("/sitecore/content/redirect-rules").Returns(root);
            database.GetItem(rootId).Returns(root);
            group.Add(Arg.Any<string>(), Arg.Any<TemplateID>()).Returns(ruleItem.ToSitecoreItem());
            root.Add(Arg.Any<string>(), Arg.Any<TemplateID>()).Returns(group);

            var input = new RedirectRuleInput
            {
                FromUrl = "/from",
                ToUrl = "/to",
                RedirectType = 301,
                Comments = "note",
                Priority = 0,
                GroupName = "Group A"
            };

            repository.GetRulesRoot(database).Should().NotBeNull();

            var created = repository.CreateRule(database, input);

            created.Should().NotBeNull();
            created.Parent.Should().NotBeNull();
            created.Parent.DisplayName.Should().Be("Group A");
            created[Templates.RedirectRule.Fields.FromUrl].Should().Be("/from");
        }

        private static void EnsureRulesRootPath()
        {
            var field = typeof(Sitecore.Configuration.Settings).GetField("<InternalSettings>k__BackingField", BindingFlags.NonPublic | BindingFlags.Static);
            var settings = field?.GetValue(null) as Hashtable;
            if (settings != null)
            {
                settings["Redirects.RedirectRulesRootPath"] = "/sitecore/content/redirect-rules";
            }
        }
    }
}
