using System;
using System.Collections.Specialized;
using System.IO;
using System.Linq;
using System.Security.Principal;
using System.Text;
using System.Web;
using System.Web.Mvc;
using System.Web.Routing;
using easyJet.Feature.Redirects.Controllers;
using easyJet.Feature.Redirects.Models;
using easyJet.Feature.Redirects.Services;
using FluentAssertions;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using NSubstitute;
using NSubstitute.Extensions;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Sitecore.Globalization;
using Sitecore.NSubstituteUtils;
using Sitecore.Security.Accounts;
using Xunit;

namespace easyJet.Feature.Redirects.Tests.Controllers
{
    [Collection("SitecoreSettings")]
    public class RedirectToolControllerTests
    {
        [Fact]
        public void List_ShouldReturnUnauthorized_WhenUserNotAuthenticated()
        {
            var repository = Substitute.For<IRedirectRuleRepository>();
            var managementService = Substitute.For<IRedirectRuleManagementService>();
            var matcher = Substitute.For<IRedirectRuleMatcher>();
            var controller = BuildController(repository, managementService, matcher);

            using (new UserSwitcher(CreateUnauthenticatedUser()))
            {
                var result = controller.List() as HttpStatusCodeResult;

                result.Should().NotBeNull();
                result.StatusCode.Should().Be(401);
            }
        }

        [Fact]
        public void ExportCsv_ShouldReturnUnauthorized_WhenUserNotAuthenticated()
        {
            var repository = Substitute.For<IRedirectRuleRepository>();
            var managementService = Substitute.For<IRedirectRuleManagementService>();
            var matcher = Substitute.For<IRedirectRuleMatcher>();
            var controller = BuildController(repository, managementService, matcher);

            using (new UserSwitcher(CreateUnauthenticatedUser()))
            {
                var result = controller.ExportCsv() as HttpStatusCodeResult;

                result.Should().NotBeNull();
                result.StatusCode.Should().Be(401);
            }
        }

        [Fact]
        public void ImportCsv_ShouldReturnUnauthorized_WhenUserNotAuthenticated()
        {
            var repository = Substitute.For<IRedirectRuleRepository>();
            var managementService = Substitute.For<IRedirectRuleManagementService>();
            var matcher = Substitute.For<IRedirectRuleMatcher>();
            var controller = BuildController(repository, managementService, matcher);

            using (new UserSwitcher(CreateUnauthenticatedUser()))
            {
                var result = controller.ImportCsv(Substitute.For<HttpPostedFileBase>()) as HttpStatusCodeResult;

                result.Should().NotBeNull();
                result.StatusCode.Should().Be(401);
            }
        }

        [Fact]
        public void Upsert_ShouldReturnUnauthorized_WhenUserNotAuthenticated()
        {
            var repository = Substitute.For<IRedirectRuleRepository>();
            var managementService = Substitute.For<IRedirectRuleManagementService>();
            var matcher = Substitute.For<IRedirectRuleMatcher>();
            var controller = BuildController(repository, managementService, matcher);

            using (new UserSwitcher(CreateUnauthenticatedUser()))
            {
                var result = controller.Upsert(new RedirectRuleInput()) as HttpStatusCodeResult;

                result.Should().NotBeNull();
                result.StatusCode.Should().Be(401);
            }
        }

        [Fact]
        public void Delete_ShouldReturnUnauthorized_WhenUserNotAuthenticated()
        {
            var repository = Substitute.For<IRedirectRuleRepository>();
            var managementService = Substitute.For<IRedirectRuleManagementService>();
            var matcher = Substitute.For<IRedirectRuleMatcher>();
            var controller = BuildController(repository, managementService, matcher);

            using (new UserSwitcher(CreateUnauthenticatedUser()))
            {
                var result = controller.Delete("id") as HttpStatusCodeResult;

                result.Should().NotBeNull();
                result.StatusCode.Should().Be(401);
            }
        }

        [Fact]
        public void TestUrl_ShouldReturnUnauthorized_WhenUserNotAuthenticated()
        {
            var repository = Substitute.For<IRedirectRuleRepository>();
            var managementService = Substitute.For<IRedirectRuleManagementService>();
            var matcher = Substitute.For<IRedirectRuleMatcher>();
            var controller = BuildController(repository, managementService, matcher);

            using (new UserSwitcher(CreateUnauthenticatedUser()))
            {
                var result = controller.TestUrl("test") as HttpStatusCodeResult;

                result.Should().NotBeNull();
                result.StatusCode.Should().Be(401);
            }
        }

        [Fact]
        public void Languages_ShouldReturnUnauthorized_WhenUserNotAuthenticated()
        {
            var repository = Substitute.For<IRedirectRuleRepository>();
            var managementService = Substitute.For<IRedirectRuleManagementService>();
            var matcher = Substitute.For<IRedirectRuleMatcher>();
            var controller = BuildController(repository, managementService, matcher);

            using (new UserSwitcher(CreateUnauthenticatedUser()))
            {
                var result = controller.Languages() as HttpStatusCodeResult;

                result.Should().NotBeNull();
                result.StatusCode.Should().Be(401);
            }
        }

        [Fact]
        public void List_ShouldReturnItemsWithTemplateNames()
        {
            var repository = Substitute.For<IRedirectRuleRepository>();
            var managementService = Substitute.For<IRedirectRuleManagementService>();
            var matcher = Substitute.For<IRedirectRuleMatcher>();
            var controller = BuildController(repository, managementService, matcher);

            var templateId = ID.NewID;
            var rules = new[]
            {
                new RedirectRuleItem
                {
                    Id = ID.NewID,
                    FromUrl = "/from",
                    ToUrl = "/to",
                    RedirectType = 301,
                    FilterPageTypeIds = new System.Collections.Generic.HashSet<ID> { templateId }
                }
            };
            repository.GetRules(Arg.Any<Sitecore.Data.Database>()).Returns(rules);

            var database = FakeUtil.FakeDatabase();
            var templateItem = new FakeItem(templateId, database)
                .WithName("Page Template")
                .WithTemplate(Sitecore.TemplateIDs.Template)
                .WithField(Sitecore.FieldIDs.DisplayName, "__Display name", "Page Template");

            database.GetItem(templateId).Returns(templateItem.ToSitecoreItem());

            using (new UserSwitcher(CreateAuthenticatedUser()))
            {
                Sitecore.Context.ContentDatabase = database;

                var result = controller.List() as JsonResult;

                result.Should().NotBeNull();
                var payload = JObject.Parse(JsonConvert.SerializeObject(result.Data));
                payload["items"][0]["filterPageTypeNames"].Value<string>().Should().Be("Page Template");
            }
        }

        [Fact]
        public void Upsert_ShouldReturnError_WhenServiceFails()
        {
            var repository = Substitute.For<IRedirectRuleRepository>();
            var managementService = Substitute.For<IRedirectRuleManagementService>();
            var matcher = Substitute.For<IRedirectRuleMatcher>();
            var controller = BuildController(repository, managementService, matcher);

            managementService.UpsertRule(Arg.Any<Sitecore.Data.Database>(), Arg.Any<RedirectRuleInput>(), out Arg.Any<bool>(), out Arg.Any<string>())
                .Returns(callInfo =>
                {
                    callInfo[2] = false;
                    callInfo[3] = "error";
                    return null;
                });

            using (new UserSwitcher(CreateAuthenticatedUser()))
            {
                var result = controller.Upsert(new RedirectRuleInput()) as JsonResult;

                result.Should().NotBeNull();
                var payload = JObject.Parse(JsonConvert.SerializeObject(result.Data));
                payload["error"].Value<string>().Should().Be("error");
            }
        }

        [Fact]
        public void Upsert_ShouldUseFormValues_WhenInputIsNull()
        {
            var repository = Substitute.For<IRedirectRuleRepository>();
            var managementService = Substitute.For<IRedirectRuleManagementService>();
            var matcher = Substitute.For<IRedirectRuleMatcher>();
            var request = Substitute.For<HttpRequestBase>();
            var form = new NameValueCollection
            {
                { "fromUrl", "/from" },
                { "toUrl", "/to" },
                { "redirectType", "302" },
                { "priority", "3" },
                { "comments", "note" }
            };
            request.Form.Returns(form);
            request.InputStream.Returns(new MemoryStream(Encoding.UTF8.GetBytes(string.Empty)));

            var controller = BuildController(repository, managementService, matcher, request);

            RedirectRuleInput captured = null;
            var rule = new RedirectRuleItem
            {
                Id = ID.NewID,
                FromUrl = "/from",
                ToUrl = "/to",
                RedirectType = 302
            };
            managementService.UpsertRule(Arg.Any<Sitecore.Data.Database>(), Arg.Do<RedirectRuleInput>(input => captured = input), out Arg.Any<bool>(), out Arg.Any<string>())
                .Returns(callInfo =>
                {
                    callInfo[2] = true;
                    callInfo[3] = null;
                    return rule;
                });

            var database = FakeUtil.FakeDatabase();

            using (new UserSwitcher(CreateAuthenticatedUser()))
            {
                Sitecore.Context.ContentDatabase = database;
                var result = controller.Upsert(null) as JsonResult;

                result.Should().NotBeNull();
                captured.Should().NotBeNull();
                captured.FromUrl.Should().Be("/from");
                captured.ToUrl.Should().Be("/to");
                captured.RedirectType.Should().Be(302);
                captured.Priority.Should().Be(3);
                captured.Comments.Should().Be("note");
            }
        }

        [Fact]
        public void TemplateChildren_ShouldReturnTemplateItems()
        {
            var repository = Substitute.For<IRedirectRuleRepository>();
            var managementService = Substitute.For<IRedirectRuleManagementService>();
            var matcher = Substitute.For<IRedirectRuleMatcher>();
            var controller = BuildController(repository, managementService, matcher);

            var database = FakeUtil.FakeDatabase();

            var templateRootItem = new FakeItem(Sitecore.ItemIDs.TemplateRoot, database)
                .WithName("Templates")
                .WithDisplayName("Templates")
                .WithPath("/sitecore/templates");

            var featureFolderId = ID.NewID;
            var featureFolderItem = new FakeItem(featureFolderId, database)
                .WithName("Feature")
                .WithDisplayName("Feature")
                .WithTemplate(Sitecore.TemplateIDs.TemplateFolder)
                .WithParent(templateRootItem);

            var pageTemplateId = ID.NewID;
            var pageTemplateItem = new FakeItem(pageTemplateId, database)
                .WithName("PageTemplate")
                .WithDisplayName("PageTemplate")
                .WithTemplate(Sitecore.TemplateIDs.Template)
                .WithParent(templateRootItem);

            database.GetItem(Sitecore.ItemIDs.TemplateRoot).Returns(templateRootItem.ToSitecoreItem());

            using (new UserSwitcher(CreateAuthenticatedUser()))
            {
                Sitecore.Context.ContentDatabase = database;

                var result = controller.TemplateChildren(string.Empty) as JsonResult;

                result.Should().NotBeNull();
                var payload = JObject.Parse(JsonConvert.SerializeObject(result.Data));
                payload["items"].Should().NotBeNull();
                var names = payload["items"].Select(item => item["name"].Value<string>()).ToList();
                names.Should().Contain("Feature");
                names.Should().Contain("PageTemplate");
            }
        }

        [Fact]
        public void Languages_ShouldReturnSortedLanguageItems()
        {
            var repository = Substitute.For<IRedirectRuleRepository>();
            var managementService = Substitute.For<IRedirectRuleManagementService>();
            var matcher = Substitute.For<IRedirectRuleMatcher>();
            var controller = BuildController(repository, managementService, matcher);

            using (var db = new Db())
            using (new UserSwitcher(CreateAuthenticatedUser()))
            {
                Sitecore.Context.ContentDatabase = db.Database;
                var result = controller.Languages() as JsonResult;

                result.Should().NotBeNull();
                var payload = JObject.Parse(JsonConvert.SerializeObject(result.Data));
                var items = payload["items"].ToList();
                items.Should().NotBeEmpty();

                var names = items.Select(item => item["name"].Value<string>()).ToList();
                var expectedOrder = names.OrderBy(name => name, StringComparer.OrdinalIgnoreCase).ToList();

                names.Should().Equal(expectedOrder);
                items.Should().OnlyContain(item =>
                    string.Equals(
                        item["code"].Value<string>(),
                        item["name"].Value<string>(),
                        StringComparison.Ordinal));
            }
        }

        [Fact]
        public void ExportCsv_ShouldReturnFileResult()
        {
            var repository = Substitute.For<IRedirectRuleRepository>();
            var managementService = Substitute.For<IRedirectRuleManagementService>();
            var matcher = Substitute.For<IRedirectRuleMatcher>();
            var controller = BuildController(repository, managementService, matcher);
            managementService.ExportCsv(Arg.Any<Sitecore.Data.Database>())
                .Returns(new byte[] { 1, 2, 3 });

            var database = FakeUtil.FakeDatabase();

            using (new UserSwitcher(CreateAuthenticatedUser()))
            {
                Sitecore.Context.ContentDatabase = database;
                var result = controller.ExportCsv() as FileContentResult;

                result.Should().NotBeNull();
                result.ContentType.Should().Be("text/csv");
                result.FileContents.Should().BeEquivalentTo(new byte[] { 1, 2, 3 });
            }
        }

        [Fact]
        public void ImportCsv_ShouldReturnError_WhenFileMissing()
        {
            var repository = Substitute.For<IRedirectRuleRepository>();
            var managementService = Substitute.For<IRedirectRuleManagementService>();
            var matcher = Substitute.For<IRedirectRuleMatcher>();
            var controller = BuildController(repository, managementService, matcher);

            using (new UserSwitcher(CreateAuthenticatedUser()))
            {
                var result = controller.ImportCsv(null) as JsonResult;

                result.Should().NotBeNull();
                var payload = JObject.Parse(JsonConvert.SerializeObject(result.Data));
                payload["error"].Value<string>().Should().Be("CSV file is required.");
            }
        }

        [Fact]
        public void ImportCsv_ShouldReturnResult_WhenSuccessful()
        {
            var repository = Substitute.For<IRedirectRuleRepository>();
            var managementService = Substitute.For<IRedirectRuleManagementService>();
            var matcher = Substitute.For<IRedirectRuleMatcher>();
            var controller = BuildController(repository, managementService, matcher);
            var file = Substitute.For<HttpPostedFileBase>();
            file.ContentLength.Returns(10);
            file.InputStream.Returns(new MemoryStream(new byte[] { 1 }));

            var resultModel = new RedirectRuleImportResult
            {
                Added = 1,
                Updated = 2,
                Deleted = 3
            };
            managementService.ImportCsv(Arg.Any<Stream>(), Arg.Any<Sitecore.Data.Database>())
                .Returns(resultModel);

            var database = FakeUtil.FakeDatabase();

            using (new UserSwitcher(CreateAuthenticatedUser()))
            {
                Sitecore.Context.ContentDatabase = database;
                var result = controller.ImportCsv(file) as JsonResult;

                result.Should().NotBeNull();
                var payload = JObject.Parse(JsonConvert.SerializeObject(result.Data));
                payload["Added"].Value<int>().Should().Be(1);
                payload["Updated"].Value<int>().Should().Be(2);
                payload["Deleted"].Value<int>().Should().Be(3);
            }
        }

        [Fact]
        public void Delete_ShouldReturnDeleted_WhenServiceSucceeds()
        {
            var repository = Substitute.For<IRedirectRuleRepository>();
            var managementService = Substitute.For<IRedirectRuleManagementService>();
            var matcher = Substitute.For<IRedirectRuleMatcher>();
            var controller = BuildController(repository, managementService, matcher);
            managementService.DeleteRule(Arg.Any<Sitecore.Data.Database>(), Arg.Any<string>(), out Arg.Any<string>())
                .Returns(callInfo =>
                {
                    callInfo[2] = null;
                    return true;
                });

            using (new UserSwitcher(CreateAuthenticatedUser()))
            {
                var result = controller.Delete(ID.NewID.ToString()) as JsonResult;

                result.Should().NotBeNull();
                var payload = JObject.Parse(JsonConvert.SerializeObject(result.Data));
                payload["deleted"].Value<bool>().Should().BeTrue();
            }
        }

        [Fact]
        public void Delete_ShouldReturnError_WhenServiceFails()
        {
            var repository = Substitute.For<IRedirectRuleRepository>();
            var managementService = Substitute.For<IRedirectRuleManagementService>();
            var matcher = Substitute.For<IRedirectRuleMatcher>();
            var controller = BuildController(repository, managementService, matcher);
            managementService.DeleteRule(Arg.Any<Sitecore.Data.Database>(), Arg.Any<string>(), out Arg.Any<string>())
                .Returns(callInfo =>
                {
                    callInfo[2] = "error";
                    return false;
                });

            using (new UserSwitcher(CreateAuthenticatedUser()))
            {
                var result = controller.Delete(ID.NewID.ToString()) as JsonResult;

                result.Should().NotBeNull();
                var payload = JObject.Parse(JsonConvert.SerializeObject(result.Data));
                payload["error"].Value<string>().Should().Be("error");
            }
        }

        [Fact]
        public void TestUrl_ShouldReturnMatch_WhenRuleFound()
        {
            var repository = Substitute.For<IRedirectRuleRepository>();
            var managementService = Substitute.For<IRedirectRuleManagementService>();
            var matcher = Substitute.For<IRedirectRuleMatcher>();
            var controller = BuildController(repository, managementService, matcher);
            matcher.FindMatch(Arg.Any<string>(), Arg.Any<Sitecore.Data.Database>())
                .Returns(new RedirectRuleMatchResult
                {
                    Id = ID.NewID,
                    FromUrl = "/from",
                    ToUrl = "/to",
                    RedirectType = 301,
                    IsWildcard = false
                });

            var database = FakeUtil.FakeDatabase();

            using (new UserSwitcher(CreateAuthenticatedUser()))
            {
                Sitecore.Context.ContentDatabase = database;
                var result = controller.TestUrl("/from") as JsonResult;

                result.Should().NotBeNull();
                var payload = JObject.Parse(JsonConvert.SerializeObject(result.Data));
                payload["matched"].Value<bool>().Should().BeTrue();
            }
        }

        [Fact]
        public void TestUrl_ShouldPassResolvedLanguageToMatcher()
        {
            var repository = Substitute.For<IRedirectRuleRepository>();
            var managementService = Substitute.For<IRedirectRuleManagementService>();
            var matcher = Substitute.For<IRedirectRuleMatcher>();
            var controller = BuildController(repository, managementService, matcher);
            var database = FakeUtil.FakeDatabase();
            matcher.FindMatch(Arg.Any<string>(), Arg.Any<Sitecore.Data.Database>(), Arg.Any<ID>(), Arg.Any<Language>())
                .Returns(new RedirectRuleMatchResult
                {
                    Id = ID.NewID,
                    FromUrl = "/de/page",
                    ToUrl = "/target",
                    RedirectType = 301
                });

            using (new UserSwitcher(CreateAuthenticatedUser()))
            {
                Sitecore.Context.ContentDatabase = database;
                var result = controller.TestUrl("/de/page") as JsonResult;

                result.Should().NotBeNull();
                matcher.Received(1).FindMatch(
                    "/de/page",
                    database,
                    Arg.Any<ID>(),
                    Arg.Is<Language>(language => language != null && language.Name == "de-DE"));
            }
        }

        [Fact]
        public void TestUrl_ShouldReturnError_WhenUrlMissing()
        {
            var repository = Substitute.For<IRedirectRuleRepository>();
            var managementService = Substitute.For<IRedirectRuleManagementService>();
            var matcher = Substitute.For<IRedirectRuleMatcher>();
            var controller = BuildController(repository, managementService, matcher);

            using (new UserSwitcher(CreateAuthenticatedUser()))
            {
                var result = controller.TestUrl(string.Empty) as JsonResult;

                result.Should().NotBeNull();
                var payload = JObject.Parse(JsonConvert.SerializeObject(result.Data));
                payload["error"].Value<string>().Should().Be("URL is required.");
            }
        }

        [Fact]
        public void TestUrl_ShouldReturnNotMatched_WhenNoRuleFound()
        {
            var repository = Substitute.For<IRedirectRuleRepository>();
            var managementService = Substitute.For<IRedirectRuleManagementService>();
            var matcher = Substitute.For<IRedirectRuleMatcher>();
            var controller = BuildController(repository, managementService, matcher);
            matcher.FindMatch(Arg.Any<string>(), Arg.Any<Sitecore.Data.Database>())
                .Returns((RedirectRuleMatchResult)null);

            var database = FakeUtil.FakeDatabase();

            using (new UserSwitcher(CreateAuthenticatedUser()))
            {
                Sitecore.Context.ContentDatabase = database;
                var result = controller.TestUrl("/from") as JsonResult;

                result.Should().NotBeNull();
                var payload = JObject.Parse(JsonConvert.SerializeObject(result.Data));
                payload["matched"].Value<bool>().Should().BeFalse();
            }
        }

        [Fact]
        public void Publish_ShouldReturnError_WhenRootMissing()
        {
            var repository = Substitute.For<IRedirectRuleRepository>();
            var managementService = Substitute.For<IRedirectRuleManagementService>();
            var matcher = Substitute.For<IRedirectRuleMatcher>();
            var controller = BuildController(repository, managementService, matcher);
            repository.GetRulesRoot(Arg.Any<Sitecore.Data.Database>()).Returns((Item)null);

            var database = FakeUtil.FakeDatabase();

            using (new UserSwitcher(CreateAuthenticatedUser()))
            {
                Sitecore.Context.ContentDatabase = database;
                var result = controller.Publish() as JsonResult;

                result.Should().NotBeNull();
                var payload = JObject.Parse(JsonConvert.SerializeObject(result.Data));
                payload["error"].Value<string>().Should().Be("Redirect rules root item not found.");
            }
        }

        [Fact]
        public void Upsert_ShouldReturnRule_WhenServiceSucceeds()
        {
            var repository = Substitute.For<IRedirectRuleRepository>();
            var managementService = Substitute.For<IRedirectRuleManagementService>();
            var matcher = Substitute.For<IRedirectRuleMatcher>();
            var controller = BuildController(repository, managementService, matcher);
            var rule = new RedirectRuleItem
            {
                Id = ID.NewID,
                FromUrl = "/from",
                ToUrl = "/to",
                RedirectType = 301,
                FilterPageTypeIds = new System.Collections.Generic.HashSet<ID>()
            };
            managementService.UpsertRule(Arg.Any<Sitecore.Data.Database>(), Arg.Any<RedirectRuleInput>(), out Arg.Any<bool>(), out Arg.Any<string>())
                .Returns(callInfo =>
                {
                    callInfo[2] = true;
                    callInfo[3] = null;
                    return rule;
                });

            var database = FakeUtil.FakeDatabase();

            using (new UserSwitcher(CreateAuthenticatedUser()))
            {
                Sitecore.Context.ContentDatabase = database;
                var result = controller.Upsert(new RedirectRuleInput { FromUrl = "/from", ToUrl = "/to", RedirectType = 301 }) as JsonResult;

                result.Should().NotBeNull();
                var payload = JObject.Parse(JsonConvert.SerializeObject(result.Data));
                payload["created"].Value<bool>().Should().BeTrue();
            }
        }

        [Fact]
        public void Upsert_ShouldUseJsonBody_WhenFormIsEmpty()
        {
            var repository = Substitute.For<IRedirectRuleRepository>();
            var managementService = Substitute.For<IRedirectRuleManagementService>();
            var matcher = Substitute.For<IRedirectRuleMatcher>();
            var request = Substitute.For<HttpRequestBase>();
            request.Form.Returns(new NameValueCollection());
            var json = "{\"fromUrl\":\"/from\",\"toUrl\":\"/to\",\"redirectType\":301,\"priority\":2}";
            request.InputStream.Returns(new MemoryStream(Encoding.UTF8.GetBytes(json)));

            var controller = BuildController(repository, managementService, matcher, request);
            RedirectRuleInput captured = null;
            managementService.UpsertRule(Arg.Any<Sitecore.Data.Database>(), Arg.Do<RedirectRuleInput>(input => captured = input), out Arg.Any<bool>(), out Arg.Any<string>())
                .Returns(callInfo =>
                {
                    callInfo[2] = true;
                    callInfo[3] = null;
                    return new RedirectRuleItem
                    {
                        Id = ID.NewID,
                        FromUrl = "/from",
                        ToUrl = "/to",
                        RedirectType = 301
                    };
                });

            var database = FakeUtil.FakeDatabase();

            using (new UserSwitcher(CreateAuthenticatedUser()))
            {
                Sitecore.Context.ContentDatabase = database;
                var result = controller.Upsert(null) as JsonResult;

                result.Should().NotBeNull();
                captured.Should().NotBeNull();
                captured.FromUrl.Should().Be("/from");
                captured.ToUrl.Should().Be("/to");
                captured.RedirectType.Should().Be(301);
                captured.Priority.Should().Be(2);
            }
        }

        [Fact]
        public void Upsert_ShouldHandleInvalidJson()
        {
            var repository = Substitute.For<IRedirectRuleRepository>();
            var managementService = Substitute.For<IRedirectRuleManagementService>();
            var matcher = Substitute.For<IRedirectRuleMatcher>();
            var request = Substitute.For<HttpRequestBase>();
            request.Form.Returns(new NameValueCollection());
            request.InputStream.Returns(new MemoryStream(Encoding.UTF8.GetBytes("{invalid")));

            var controller = BuildController(repository, managementService, matcher, request);
            RedirectRuleInput captured = null;
            managementService.UpsertRule(Arg.Any<Sitecore.Data.Database>(), Arg.Do<RedirectRuleInput>(input => captured = input), out Arg.Any<bool>(), out Arg.Any<string>())
                .Returns(callInfo =>
                {
                    callInfo[2] = true;
                    callInfo[3] = null;
                    return new RedirectRuleItem
                    {
                        Id = ID.NewID,
                        FromUrl = "/from",
                        ToUrl = "/to",
                        RedirectType = 301
                    };
                });

            var database = FakeUtil.FakeDatabase();

            using (new UserSwitcher(CreateAuthenticatedUser()))
            {
                Sitecore.Context.ContentDatabase = database;
                var result = controller.Upsert(null) as JsonResult;

                result.Should().NotBeNull();
                captured.Should().NotBeNull();
                captured.FromUrl.Should().BeNull();
            }
        }

        [Fact]
        public void TemplateChildren_ShouldReturnEmpty_WhenParentMissing()
        {
            var repository = Substitute.For<IRedirectRuleRepository>();
            var managementService = Substitute.For<IRedirectRuleManagementService>();
            var matcher = Substitute.For<IRedirectRuleMatcher>();
            var controller = BuildController(repository, managementService, matcher);

            var database = FakeUtil.FakeDatabase();
            var missingId = ID.NewID;
            database.GetItem(missingId).Returns((Item)null);

            using (new UserSwitcher(CreateAuthenticatedUser()))
            {
                Sitecore.Context.ContentDatabase = database;
                var result = controller.TemplateChildren(missingId.ToString()) as JsonResult;

                result.Should().NotBeNull();
                var payload = JObject.Parse(JsonConvert.SerializeObject(result.Data));
                payload["items"].Should().NotBeNull();
                payload["items"].Count().Should().Be(0);
            }
        }

        private static RedirectToolController BuildController(
            IRedirectRuleRepository repository,
            IRedirectRuleManagementService managementService,
            IRedirectRuleMatcher matcher,
            HttpRequestBase request = null)
        {
            var controller = new RedirectToolController(repository, managementService, matcher);
            var httpContext = Substitute.For<HttpContextBase>();
            var response = Substitute.For<HttpResponseBase>();
            response.Cache.Returns((HttpCachePolicyBase)null);
            httpContext.Response.Returns(response);
            httpContext.Request.Returns(request ?? Substitute.For<HttpRequestBase>());
            controller.ControllerContext = new ControllerContext(httpContext, new RouteData(), controller);
            return controller;
        }

        private static User CreateAuthenticatedUser()
        {
            var principal = Substitute.For<IPrincipal>();
            principal.Identity.Name.Returns("sitecore\\test");
            var user = Substitute.ForPartsOf<User>(principal);
            user.ReturnsForAll(true);
            return user;
        }

        private static User CreateUnauthenticatedUser()
        {
            var principal = Substitute.For<IPrincipal>();
            principal.Identity.Name.Returns("extranet\\Anonymous");
            var user = Substitute.ForPartsOf<User>(principal);
            user.ReturnsForAll(false);
            return user;
        }
    }
}
