using System;
using System.Collections;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Reflection;
using System.Web;
using easyJet.Feature.SitecoreEnhancment.ContentManager;
using Sitecore;
using Sitecore.Configuration;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Sitecore.Globalization;
using Sitecore.Web.UI.Sheer;
using Sitecore.Web.UI.XmlControls;
using Xunit;

namespace easyJet.Feature.SitecoreEnhancment.Tests.ContentManager
{
    public class GalleryVersionNamesFormTests
    {
        private const string SettingsKey = "VersionNames.SettingsPath";

        [Fact]
        public void HandleMessage_DoesNothingForClickEvent()
        {
            var sut = new GalleryVersionNamesForm();
            var message = Message.Parse(null, "event:click");

            var exception = Record.Exception(() => sut.HandleMessage(message));

            Assert.Null(exception);
        }

        [Fact]
        public void HandleMessage_ThrowsForNullMessage()
        {
            var sut = new GalleryVersionNamesForm();

            Assert.Throws<ArgumentNullException>(() => sut.HandleMessage(null));
        }

        [Fact]
        public void HandleMessage_InvokesGallery_WhenMessageIsNotClick()
        {
            var sut = new TestableGalleryVersionNamesForm
            {
                IsClientPageEventValue = true,
            };

            sut.HandleMessage(Message.Parse(null, "item:load(id=1)"));

            Assert.True(sut.InvokeGalleryCalled);
        }

        [Fact]
        public void LoadGalleryItems_ReturnsEarly_WhenClientPageIsEvent()
        {
            var sut = new TestableGalleryVersionNamesForm
            {
                IsClientPageEventValue = true,
            };

            sut.ExecuteLoadGalleryItems();

            Assert.Equal(0, sut.GetCurrentItemFromRequestCallCount);
            Assert.Empty(sut.AddedControls);
        }

        [Fact]
        public void LoadGalleryItems_AddsVersionOption_WhenCurrentItemExists()
        {
            var dbItem = new DbItem("Home")
            {
                new DbField(Sitecore.FieldIDs.VersionName) { Value = "Version title" },
                new DbField(Sitecore.FieldIDs.Updated) { Value = "20260408T110000Z" },
                new DbField(Sitecore.FieldIDs.UpdatedBy) { Value = "editor.user" },
            };

            using (var db = new Db { dbItem })
            {
                var currentItem = db.Database.GetItem(dbItem.ID, Language.Parse("en"), Sitecore.Data.Version.Parse("1"));
                var sut = new TestableGalleryVersionNamesForm
                {
                    IsClientPageEventValue = false,
                    CurrentItem = currentItem,
                };

                sut.ExecuteLoadGalleryItems();

                Assert.Single(sut.AddedControls);
                Assert.IsType<XmlControl>(sut.AddedControls[0]);
                Assert.Equal(1, sut.GetCurrentItemFromRequestCallCount);
            }
        }

        [Fact]
        public void LoadGalleryItems_DoesNotThrow_WhenCurrentItemExists()
        {
            var dbItem = new DbItem("Home");

            using (var db = new Db { dbItem })
            {
                var currentItem = db.GetItem(dbItem.ID);
                var sut = new TestableGalleryVersionNamesForm
                {
                    IsClientPageEventValue = false,
                    CurrentItem = currentItem,
                };

                var exception = Record.Exception(() => sut.ExecuteLoadGalleryItems());
                Assert.Null(exception);
            }
        }

        [Fact]
        public void GetTitleRules_UsesOrderedListField_WhenRulesFieldIsConfigured()
        {
            var templateId = ID.NewID;
            var fieldIdSpecific = ID.NewID;
            var fieldIdDefault = ID.NewID;
            var ruleSpecific = new DbItem("Rule Specific")
            {
                new DbField("Templates") { Value = templateId.ToString() },
                new DbField("Fields") { Value = fieldIdSpecific.ToString() },
            };
            var ruleDefault = new DbItem("Rule Default")
            {
                new DbField("Templates") { Value = string.Empty },
                new DbField("Fields") { Value = fieldIdDefault.ToString() },
            };
            var rulesRoot = new DbItem("Version Name Rules")
            {
                ruleSpecific,
                ruleDefault,
                new DbField("Rules") { Value = $"{ruleDefault.ID}|{ruleSpecific.ID}" },
            };

            using (var db = new Db { rulesRoot })
            using (new SettingsSwitcher(SettingsKey, rulesRoot.ID.ToString()))
            {
                var method = GetMethod("GetTitleRules");
                var rules = method.Invoke(null, new object[] { db.Database });
                var fieldIds = GetRuleFieldIds(rules);

                Assert.Equal(new[] { fieldIdDefault, fieldIdSpecific }, fieldIds);
            }
        }

        [Fact]
        public void GetTitleRules_ReturnsEmpty_WhenSettingsPathIsBlank()
        {
            using (var db = new Db())
            using (new SettingsSwitcher(SettingsKey, " "))
            {
                var rules = GetMethod("GetTitleRules").Invoke(null, new object[] { db.Database });

                Assert.Empty(GetRuleFieldIds(rules));
            }
        }

        [Fact]
        public void GetTitleRules_ReturnsEmpty_WhenRulesRootDoesNotExist()
        {
            using (var db = new Db())
            using (new SettingsSwitcher(SettingsKey, "/sitecore/content/missing/rules"))
            {
                var rules = GetMethod("GetTitleRules").Invoke(null, new object[] { db.Database });

                Assert.Empty(GetRuleFieldIds(rules));
            }
        }

        [Fact]
        public void GetTitleRules_SkipsRulesWithInvalidFieldReferences()
        {
            var invalidRule = new DbItem("Invalid Rule")
            {
                new DbField("Templates") { Value = string.Empty },
                new DbField("Fields") { Value = "not-an-id" },
            };
            var rulesRoot = new DbItem("Version Name Rules")
            {
                invalidRule,
                new DbField("Rules") { Value = invalidRule.ID.ToString() },
            };

            using (var db = new Db { rulesRoot })
            using (new SettingsSwitcher(SettingsKey, rulesRoot.ID.ToString()))
            {
                var rules = GetMethod("GetTitleRules").Invoke(null, new object[] { db.Database });

                Assert.Empty(GetRuleFieldIds(rules));
            }
        }

        [Fact]
        public void ResolveTitleFieldIds_ReturnsFirstApplicableRule_EvenIfDefaultIsFirst()
        {
            var templateId = ID.NewID;
            var fieldIdSpecific = ID.NewID;
            var fieldIdDefault = ID.NewID;
            var rules = BuildRules(templateId, fieldIdSpecific, fieldIdDefault, defaultFirst: true);
            var method = GetMethod("ResolveTitleFieldIds");

            var result = (IReadOnlyList<ID>)method.Invoke(null, new object[] { templateId, rules });

            Assert.Equal(new[] { fieldIdDefault }, result);
        }

        [Fact]
        public void ResolveTitleFieldIds_ReturnsEmpty_WhenRulesNullOrEmpty()
        {
            var method = GetMethod("ResolveTitleFieldIds");

            var withNull = (IReadOnlyList<ID>)method.Invoke(null, new object[] { ID.NewID, null });
            var withEmpty = (IReadOnlyList<ID>)method.Invoke(
                null,
                new object[] { ID.NewID, new List<(HashSet<ID>, IReadOnlyList<ID>)>() });

            Assert.Empty(withNull);
            Assert.Empty(withEmpty);
        }

        [Fact]
        public void ResolveTitleFieldIds_ReturnsSpecificRule_WhenSpecificIsBeforeDefault()
        {
            var templateId = ID.NewID;
            var fieldIdSpecific = ID.NewID;
            var fieldIdDefault = ID.NewID;
            var rules = BuildRules(templateId, fieldIdSpecific, fieldIdDefault, defaultFirst: false);
            var method = GetMethod("ResolveTitleFieldIds");

            var result = (IReadOnlyList<ID>)method.Invoke(null, new object[] { templateId, rules });

            Assert.Equal(new[] { fieldIdSpecific }, result);
        }

        [Fact]
        public void ResolveTitleFieldIds_ReturnsDefault_WhenNoTemplateRuleMatches()
        {
            var matchedTemplateId = ID.NewID;
            var otherTemplateId = ID.NewID;
            var fieldIdSpecific = ID.NewID;
            var fieldIdDefault = ID.NewID;
            var rules = BuildRules(otherTemplateId, fieldIdSpecific, fieldIdDefault, defaultFirst: false);
            var method = GetMethod("ResolveTitleFieldIds");

            var result = (IReadOnlyList<ID>)method.Invoke(null, new object[] { matchedTemplateId, rules });

            Assert.Equal(new[] { fieldIdDefault }, result);
        }

        [Fact]
        public void ResolveTitleFieldIds_ReturnsEmpty_WhenNoRuleMatchesAndNoDefaultRuleExists()
        {
            var targetTemplateId = ID.NewID;
            var otherTemplateId = ID.NewID;
            var rules = new List<(HashSet<ID> TemplateIds, IReadOnlyList<ID> FieldIds)>
            {
                (new HashSet<ID> { otherTemplateId }, new List<ID> { ID.NewID }),
            };

            var result = (IReadOnlyList<ID>)GetMethod("ResolveTitleFieldIds").Invoke(null, new object[] { targetTemplateId, rules });

            Assert.Empty(result);
        }

        [Fact]
        public void GetTitleFromField_ReturnsNullForNullId_AndValueForValidId()
        {
            var fieldId = ID.NewID;
            var item = new DbItem("X")
            {
                new DbField(fieldId) { Value = "Expected title" },
            };
            var method = GetMethod("GetTitleFromField");

            using (var db = new Db { item })
            {
                var scItem = db.GetItem(item.ID);
                var nullResult = (string)method.Invoke(null, new object[] { scItem, ID.Null });
                var valueResult = (string)method.Invoke(null, new object[] { scItem, fieldId });

                Assert.Null(nullResult);
                Assert.Equal("Expected title", valueResult);
            }
        }

        [Fact]
        public void GetTitleFromField_ReturnsEmptyWhenFieldMissing_AndWhenFieldValueEmpty()
        {
            var missingFieldId = ID.NewID;
            var emptyFieldId = ID.NewID;
            var item = new DbItem("X")
            {
                new DbField(emptyFieldId) { Value = string.Empty },
            };

            using (var db = new Db { item })
            {
                var scItem = db.GetItem(item.ID);
                var method = GetMethod("GetTitleFromField");
                var missingResult = (string)method.Invoke(null, new object[] { scItem, missingFieldId });
                var emptyResult = (string)method.Invoke(null, new object[] { scItem, emptyFieldId });

                Assert.Equal(string.Empty, missingResult);
                Assert.Equal(string.Empty, emptyResult);
            }
        }

        [Fact]
        public void GetTitleFromField_ReturnsReferencedItemNames_ForTreeListExField()
        {
            var fieldId = ID.NewID;
            var referencedOne = new DbItem("referenced-one")
            {
                new DbField(Sitecore.FieldIDs.DisplayName) { Value = "Referenced One Display" },
            };
            var referencedTwo = new DbItem("referenced-two")
            {
                new DbField(Sitecore.FieldIDs.DisplayName) { Value = "Referenced Two Display" },
            };
            var item = new DbItem("Container")
            {
                new DbField(fieldId)
                {
                    Type = "TreeListEx",
                    Value = $"{referencedOne.ID}|{referencedTwo.ID}",
                },
            };

            using (var db = new Db { referencedOne, referencedTwo, item })
            {
                var scItem = db.GetItem(item.ID);
                var result = (string)GetMethod("GetTitleFromField").Invoke(null, new object[] { scItem, fieldId });

                Assert.Equal("referenced-one, referenced-two", result);
            }
        }

        [Fact]
        public void GetTitleFromField_ReturnsReferencedItemName_ForSingleReferenceField()
        {
            var fieldId = ID.NewID;
            var referenced = new DbItem("single-reference-name")
            {
                new DbField(Sitecore.FieldIDs.DisplayName) { Value = "Single Reference Display" },
            };
            var item = new DbItem("Container")
            {
                new DbField(fieldId)
                {
                    Type = "Droplink",
                    Value = referenced.ID.ToString(),
                },
            };

            using (var db = new Db { referenced, item })
            {
                var scItem = db.GetItem(item.ID);
                var result = (string)GetMethod("GetTitleFromField").Invoke(null, new object[] { scItem, fieldId });

                Assert.Equal("single-reference-name", result);
            }
        }

        [Fact]
        public void GetTitleFromField_ReturnsReferencedItemName_ForReferenceTypeFieldWithSingleId()
        {
            var fieldId = ID.NewID;
            var referenced = new DbItem("reference-type-name");
            var item = new DbItem("Container")
            {
                new DbField(fieldId)
                {
                    Type = "Reference",
                    Value = referenced.ID.ToString(),
                },
            };

            using (var db = new Db { referenced, item })
            {
                var scItem = db.GetItem(item.ID);
                var result = (string)GetMethod("GetTitleFromField").Invoke(null, new object[] { scItem, fieldId });

                Assert.Equal("reference-type-name", result);
            }
        }

        [Fact]
        public void GetTitleFromField_ReturnsRawFieldValue_WhenReferenceItemsCannotBeResolved()
        {
            var fieldId = ID.NewID;
            var unresolvedId = ID.NewID;
            var item = new DbItem("Container")
            {
                new DbField(fieldId)
                {
                    Type = "TreelistEx",
                    Value = unresolvedId.ToString(),
                },
            };

            using (var db = new Db { item })
            {
                var scItem = db.GetItem(item.ID);
                var result = (string)GetMethod("GetTitleFromField").Invoke(null, new object[] { scItem, fieldId });

                Assert.Equal(unresolvedId.ToString(), result);
            }
        }

        [Fact]
        public void ParseTemplateId_ReturnsNullId_WhenInputInvalid()
        {
            var method = GetMethod("ParseTemplateId");
            var result = (ID)method.Invoke(null, new object[] { "not-an-id" });

            Assert.Equal(ID.Null, result);
        }

        [Fact]
        public void ResolveTitle_ReturnsFirstNonEmptyFieldValue_OrNotSet()
        {
            var emptyFieldId = ID.NewID;
            var configuredFieldId = ID.NewID;
            var withConfiguredTitle = new DbItem("WithConfigured")
            {
                new DbField(emptyFieldId) { Value = " " },
                new DbField(configuredFieldId) { Value = "Configured title" },
            };
            var withNoTitle = new DbItem("WithNoTitle");

            using (var db = new Db { withConfiguredTitle, withNoTitle })
            {
                var method = GetMethod("ResolveTitle");
                var configuredItem = db.GetItem(withConfiguredTitle.ID);
                var noTitleItem = db.GetItem(withNoTitle.ID);

                var configured = (string)method.Invoke(null, new object[] { configuredItem, new List<ID> { emptyFieldId, configuredFieldId } });
                var fallback = (string)method.Invoke(null, new object[] { noTitleItem, new List<ID>() });

                Assert.Equal("Configured title", configured);
                Assert.Equal("[Not set]", fallback);
            }
        }

        [Theory]
        [InlineData(3, 2, "<div class=\"versionNum\">3.</div>")]
        [InlineData(3, 3, "<div class=\"versionNumSelected\">3.</div>")]
        public void BuildVersionText_ReturnsExpectedMarkup(int versionNumber, int currentVersionNumber, string expected)
        {
            var method = GetMethod("BuildVersionText");
            var result = (string)method.Invoke(null, new object[] { versionNumber, currentVersionNumber });

            Assert.Equal(expected, result);
        }

        [Fact]
        public void ResolveModifiedAt_ReturnsNotSet_WhenUpdatedDateMissing()
        {
            var item = new DbItem("Item")
            {
                new DbField(Sitecore.FieldIDs.Updated) { Value = Sitecore.DateUtil.ToIsoDate(DateTime.MinValue) },
            };

            using (var db = new Db { item })
            {
                var scItem = db.GetItem(item.ID);
                Assert.Equal(DateTime.MinValue, scItem.Statistics.Updated);
                var result = (string)GetMethod("ResolveModifiedAt").Invoke(null, new object[] { scItem, CultureInfo.InvariantCulture });

                Assert.Equal("[Not set]", result);
            }
        }

        [Fact]
        public void ResolveModifiedAt_ReturnsFormattedDate_WhenUpdatedDateExists()
        {
            var item = new DbItem("Item")
            {
                new DbField(Sitecore.FieldIDs.Updated) { Value = "20260408T110000Z" },
            };

            using (var db = new Db { item })
            {
                var scItem = db.GetItem(item.ID);
                var result = (string)GetMethod("ResolveModifiedAt").Invoke(null, new object[] { scItem, CultureInfo.InvariantCulture });

                Assert.NotEqual("[Not set]", result);
            }
        }

        [Fact]
        public void ResolveUpdatedBy_ReturnsDash_WhenUpdatedByMissing()
        {
            var item = new DbItem("Item")
            {
                new DbField(Sitecore.FieldIDs.UpdatedBy) { Value = " " },
            };

            using (var db = new Db { item })
            {
                var scItem = db.GetItem(item.ID);
                Assert.True(string.IsNullOrWhiteSpace(scItem.Statistics.UpdatedBy));
                var result = (string)GetMethod("ResolveUpdatedBy").Invoke(null, new object[] { scItem });

                Assert.Equal("-", result);
            }
        }

        [Fact]
        public void ResolveUpdatedBy_ReturnsStatisticsUpdatedBy_WhenSet()
        {
            const string expected = "editor.user";
            var item = new DbItem("Item")
            {
                new DbField(Sitecore.FieldIDs.UpdatedBy) { Value = expected },
            };

            using (var db = new Db { item })
            {
                var scItem = db.GetItem(item.ID);
                var result = (string)GetMethod("ResolveUpdatedBy").Invoke(null, new object[] { scItem });

                Assert.Equal(expected, result);
            }
        }

        [Fact]
        public void GetCurrentItem_ThrowsAssertion_WhenDatabaseCannotBeResolved()
        {
            var previousContext = HttpContext.Current;
            try
            {
                HttpContext.Current = new HttpContext(
                    new HttpRequest(string.Empty, "http://localhost/", $"db=definitely-missing&id={ID.NewID}&la=en&vs=1"),
                    new HttpResponse(new StringWriter()));

                var exception = Assert.Throws<TargetInvocationException>(() => GetMethod("GetCurrentItem").Invoke(null, null));
                Assert.NotNull(exception.InnerException);
            }
            finally
            {
                HttpContext.Current = previousContext;
            }
        }

        [Fact]
        public void GetCurrentItem_ReturnsItem_WhenDatabaseAndQueryParametersAreValid()
        {
            var dbItem = new DbItem("Home");
            using (var db = new Db { dbItem })
            {
                var existingItem = db.GetItem(dbItem.ID);
                Assert.NotNull(existingItem);

                var previousContext = HttpContext.Current;
                try
                {
                    HttpContext.Current = new HttpContext(
                        new HttpRequest(
                            string.Empty,
                            "http://localhost/",
                            $"db={db.Database.Name}&id={existingItem.Paths.FullPath}&la={existingItem.Language.Name}&vs={existingItem.Version.Number}"),
                        new HttpResponse(new StringWriter()));

                    var result = (Item)GetMethod("GetCurrentItem").Invoke(null, null);

                    Assert.NotNull(result);
                    Assert.Equal(existingItem.ID, result.ID);
                }
                finally
                {
                    HttpContext.Current = previousContext;
                }
            }
        }

        [Fact]
        public void BuildHeader_EncodesHtmlSensitiveValues()
        {
            var method = GetMethod("BuildHeader");
            var result = (string)method.Invoke(null, new object[] { "<b>Title</b>", "Today", "user<script>" });

            Assert.Contains("&lt;b&gt;Title&lt;/b&gt;", result);
            Assert.Contains("Today", result);
            Assert.Contains("user&lt;script&gt;", result);
        }

        private static object BuildRules(ID templateId, ID fieldIdSpecific, ID fieldIdDefault, bool defaultFirst)
        {
            var ruleSpecific = new DbItem("Rule Specific")
            {
                new DbField("Templates") { Value = templateId.ToString() },
                new DbField("Fields") { Value = fieldIdSpecific.ToString() },
            };
            var ruleDefault = new DbItem("Rule Default")
            {
                new DbField("Templates") { Value = string.Empty },
                new DbField("Fields") { Value = fieldIdDefault.ToString() },
            };
            var rulesValue = defaultFirst
                ? $"{ruleDefault.ID}|{ruleSpecific.ID}"
                : $"{ruleSpecific.ID}|{ruleDefault.ID}";
            var rulesRoot = new DbItem("Version Name Rules")
            {
                ruleSpecific,
                ruleDefault,
                new DbField("Rules") { Value = rulesValue },
            };

            using (var db = new Db { rulesRoot })
            using (new SettingsSwitcher(SettingsKey, rulesRoot.ID.ToString()))
            {
                return GetMethod("GetTitleRules").Invoke(null, new object[] { db.Database });
            }
        }

        private static MethodInfo GetMethod(string name)
        {
            return typeof(GalleryVersionNamesForm).GetMethod(name, BindingFlags.NonPublic | BindingFlags.Static);
        }

        private static List<ID> GetRuleFieldIds(object rulesResult)
        {
            var fieldIds = new List<ID>();
            foreach (var rule in (IEnumerable)rulesResult)
            {
                var fieldValues = rule.GetType().GetField("Item2").GetValue(rule) as IEnumerable;
                if (fieldValues == null)
                {
                    continue;
                }

                foreach (var fieldValue in fieldValues)
                {
                    fieldIds.Add((ID)fieldValue);
                    break;
                }
            }

            return fieldIds;
        }

        private sealed class TestableGalleryVersionNamesForm : GalleryVersionNamesForm
        {
            public bool IsClientPageEventValue { get; set; }

            public Item CurrentItem { get; set; }

            public bool InvokeGalleryCalled { get; private set; }

            public int GetCurrentItemFromRequestCallCount { get; private set; }

            public List<System.Web.UI.Control> AddedControls { get; } = new List<System.Web.UI.Control>();

            public void ExecuteLoadGalleryItems()
            {
                LoadGalleryItems();
            }

            protected override void InvokeGallery(Message message)
            {
                InvokeGalleryCalled = true;
            }

            protected override bool IsClientPageEvent()
            {
                return IsClientPageEventValue;
            }

            protected override Item GetCurrentItemFromRequest()
            {
                GetCurrentItemFromRequestCallCount++;
                return CurrentItem;
            }

            protected override XmlControl CreateVersionOptionControl()
            {
                return new XmlControl();
            }

            protected override CultureInfo GetUserCulture()
            {
                return CultureInfo.InvariantCulture;
            }

            protected override void AddControl(System.Web.UI.Control control)
            {
                AddedControls.Add(control);
            }
        }
    }
}
