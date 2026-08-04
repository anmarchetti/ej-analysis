using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Helpers;
using System.Web.Mvc;
using easyJet.Feature.Redirects.Models;
using easyJet.Feature.Redirects.Services;
using easyJet.Foundation.SitecoreExtensions.Controllers;
using Newtonsoft.Json;
using Sitecore;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Data.Managers;
using Sitecore.Publishing;
using Convert = System.Convert;

namespace easyJet.Feature.Redirects.Controllers
{
    public class RedirectToolController : BaseServicesApiController
    {
        private readonly IRedirectRuleRepository repository;
        private readonly IRedirectRuleManagementService managementService;
        private readonly IRedirectRuleMatcher matcher;

        public RedirectToolController(
            IRedirectRuleRepository repository,
            IRedirectRuleManagementService managementService,
            IRedirectRuleMatcher matcher)
        {
            this.repository = repository;
            this.managementService = managementService;
            this.matcher = matcher;
        }

        [HttpGet]
        public ActionResult List()
        {
            if (!IsAuthenticatedUser())
            {
                return new HttpStatusCodeResult(401);
            }

            DisableResponseCache();
            var database = GetContentDatabase();
            var rules = repository.GetRules(database);
            var templateNameMap = BuildTemplateNameMap(database, rules);
            var response = new
            {
                total = rules.Count,
                generatedOn = DateTime.UtcNow.ToString("s"),
                items = rules.Select(rule =>
                    BuildRuleResponse(rule, ResolveTemplateNames(rule.FilterPageTypeIds, templateNameMap)))
            };

            return UnlimitedJson(response, JsonRequestBehavior.AllowGet);
        }

        [HttpGet]
        public ActionResult ExportCsv()
        {
            if (!IsAuthenticatedUser())
            {
                return new HttpStatusCodeResult(401);
            }

            var database = GetContentDatabase();
            var csvData = managementService.ExportCsv(database);
            var fileName = $"redirect-rules-{DateTime.UtcNow:yyyyMMdd-HHmm}.csv";
            return File(csvData, "text/csv", fileName);
        }

        [HttpPost]
        public ActionResult ImportCsv(HttpPostedFileBase file)
        {
            if (!IsAuthenticatedUser())
            {
                return new HttpStatusCodeResult(401);
            }

            if (file == null || file.ContentLength == 0)
            {
                return Json(new { error = "CSV file is required." });
            }

            var database = GetContentDatabase();
            var result = managementService.ImportCsv(file.InputStream, database);
            return Json(result);
        }

        [HttpPost]
        public ActionResult Upsert(RedirectRuleInput input)
        {
            if (!IsAuthenticatedUser())
            {
                return new HttpStatusCodeResult(401);
            }

            input = ResolveInput(input);
            var database = GetContentDatabase();
            var rule = managementService.UpsertRule(database, input, out var created, out var error);
            if (rule == null)
            {
                return Json(new { error });
            }

            return Json(new
            {
                created,
                rule = BuildRuleResponse(rule, ResolveTemplateNames(database, rule.FilterPageTypeIds))
            });
        }

        [HttpPost]
        public ActionResult Delete(string id)
        {
            if (!IsAuthenticatedUser())
            {
                return new HttpStatusCodeResult(401);
            }

            var database = GetContentDatabase();
            var success = managementService.DeleteRule(database, id, out var error);
            if (!success)
            {
                return Json(new { error });
            }

            return Json(new { deleted = true });
        }

        [HttpGet]
        public ActionResult TestUrl(string url)
        {
            if (!IsAuthenticatedUser())
            {
                return new HttpStatusCodeResult(401);
            }

            if (string.IsNullOrWhiteSpace(url))
            {
                return Json(new { error = "URL is required." }, JsonRequestBehavior.AllowGet);
            }

            var database = GetContentDatabase();
            var language = RedirectRuleHelper.ResolveLanguageFromUrl(url);
            var match = matcher.FindMatch(url, database, language: language);
            if (match == null)
            {
                return Json(new { matched = false }, JsonRequestBehavior.AllowGet);
            }

            return Json(
                new
                {
                    matched = true,
                    rule = new
                    {
                        id = match.Id.ToString(),
                        fromUrl = match.FromUrl,
                        toUrl = match.ToUrl,
                        redirectType = match.RedirectType,
                        isWildcard = match.IsWildcard
                    }
                }, JsonRequestBehavior.AllowGet);
        }

        [HttpPost]
        public ActionResult Publish()
        {
            if (!IsAuthenticatedUser())
            {
                return new HttpStatusCodeResult(401);
            }

            var master = GetContentDatabase();
            var web = Sitecore.Configuration.Factory.GetDatabase("web");
            var root = repository.GetRulesRoot(master);
            if (root == null)
            {
                return Json(new { error = "Redirect rules root item not found." });
            }

            var options = new PublishOptions(master, web, PublishMode.Smart, Context.Language, DateTime.UtcNow)
            {
                RootItem = root,
                Deep = true
            };

            var publisher = new Publisher(options);
            publisher.Publish();

            return Json(new { published = true });
        }

        [HttpGet]
        public ActionResult TemplateChildren(string id)
        {
            if (!IsAuthenticatedUser())
            {
                return new HttpStatusCodeResult(401);
            }

            var database = GetContentDatabase();
            var parent = string.IsNullOrWhiteSpace(id)
                ? database?.GetItem("/sitecore/templates")
                : database?.GetItem(id);

            if (parent == null)
            {
                return UnlimitedJson(new { items = Array.Empty<object>() }, JsonRequestBehavior.AllowGet);
            }

            var children = parent.Children
                .Where(IsTemplateOrFolder)
                .Select(item => new
                {
                    id = item.ID.ToString(),
                    name = item.DisplayName,
                    isTemplate = item.TemplateID == TemplateIDs.Template,
                    hasChildren = HasTemplateChildren(item)
                })
                .ToList();

            return UnlimitedJson(new { items = children }, JsonRequestBehavior.AllowGet);
        }

        [HttpGet]
        public ActionResult Languages()
        {
            if (!IsAuthenticatedUser())
            {
                return new HttpStatusCodeResult(401);
            }

            var database = GetContentDatabase();
            var languages = LanguageManager.GetLanguages(database)
                .Select(language => language?.Name)
                .Where(name => !string.IsNullOrWhiteSpace(name))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .OrderBy(name => name, StringComparer.OrdinalIgnoreCase)
                .Select(name => new { code = name, name = name })
                .ToList();

            return UnlimitedJson(new { items = languages }, JsonRequestBehavior.AllowGet);
        }

        private static Database GetContentDatabase()
        {
            return Context.ContentDatabase ?? Sitecore.Configuration.Factory.GetDatabase("master");
        }

        private static bool IsAuthenticatedUser()
        {
            var user = Context.User;
            return user != null && user.IsAuthenticated;
        }

        private static Dictionary<ID, string> BuildTemplateNameMap(Database database, System.Collections.Generic.IEnumerable<RedirectRuleItem> rules)
        {
            var map = new Dictionary<ID, string>();
            if (database == null || rules == null)
            {
                return map;
            }

            var ids = rules.SelectMany(rule => rule.FilterPageTypeIds ?? new HashSet<ID>())
                .Distinct()
                .ToList();

            foreach (var id in ids)
            {
                var item = database.GetItem(id);
                if (item != null)
                {
                    map[id] = string.IsNullOrWhiteSpace(item.DisplayName) ? item.Name : item.DisplayName;
                }
            }

            return map;
        }

        private static string ResolveTemplateNames(Database database, System.Collections.Generic.IEnumerable<ID> ids)
        {
            if (database == null || ids == null)
            {
                return string.Empty;
            }

            var names = ids.Select(id =>
            {
                var item = database.GetItem(id);
                if (item == null)
                {
                    return id.ToString();
                }

                return string.IsNullOrWhiteSpace(item.DisplayName) ? item.Name : item.DisplayName;
            });

            return string.Join(" | ", names);
        }

        private static string ResolveTemplateNames(System.Collections.Generic.IEnumerable<ID> ids, Dictionary<ID, string> nameMap)
        {
            if (ids == null)
            {
                return string.Empty;
            }

            var names = ids.Select(id =>
            {
                if (nameMap != null && nameMap.TryGetValue(id, out var name))
                {
                    return name;
                }

                return id.ToString();
            });

            return string.Join(" | ", names);
        }

        private static bool IsTemplateOrFolder(Item item)
        {
            if (item == null)
            {
                return false;
            }

            return item.TemplateID == TemplateIDs.Template || item.TemplateID == TemplateIDs.TemplateFolder;
        }

        private static bool HasTemplateChildren(Item item)
        {
            if (item == null)
            {
                return false;
            }

            return item.Children.Any(IsTemplateOrFolder);
        }

        private static RedirectRuleInput BuildInputFromForm(System.Collections.Specialized.NameValueCollection form)
        {
            var input = new RedirectRuleInput
            {
                FromUrl = form["fromUrl"] ?? form["FromUrl"],
                ToUrl = form["toUrl"] ?? form["ToUrl"],
                Comments = form["comments"] ?? form["Comments"],
                FilterPageTypes = form["filterPageTypes"] ?? form["FilterPageTypes"],
                GroupName = form["groupName"] ?? form["GroupName"],
                Languages = form["languages"] ?? form["Languages"]
            };

            if (int.TryParse(form["redirectType"] ?? form["RedirectType"], out var type))
            {
                input.RedirectType = type;
            }

            if (int.TryParse(form["priority"] ?? form["Priority"], out var priority))
            {
                input.Priority = priority;
            }

            return input;
        }

        private static RedirectRuleInput BuildInputFromJson(string payload)
        {
            try
            {
                dynamic data = JsonConvert.DeserializeObject(payload);
                if (data == null)
                {
                    return new RedirectRuleInput();
                }

                var input = new RedirectRuleInput
                {
                    FromUrl = data.fromUrl ?? data.FromUrl,
                    ToUrl = data.toUrl ?? data.ToUrl,
                    Comments = data.comments ?? data.Comments,
                    FilterPageTypes = data.filterPageTypes ?? data.FilterPageTypes,
                    GroupName = data.groupName ?? data.GroupName,
                    Languages = data.languages ?? data.Languages,
                };

                if (int.TryParse(Convert.ToString(data.redirectType ?? data.RedirectType), out int type))
                {
                    input.RedirectType = type;
                }

                if (int.TryParse(Convert.ToString(data.priority ?? data.Priority), out int priority))
                {
                    input.Priority = priority;
                }

                return input;
            }
            catch
            {
                return new RedirectRuleInput();
            }
        }

        private static void MergeInput(RedirectRuleInput resolved, RedirectRuleInput fallback)
        {
            if (resolved == null || fallback == null)
            {
                return;
            }

            if (string.IsNullOrWhiteSpace(resolved.FromUrl))
            {
                resolved.FromUrl = fallback.FromUrl;
            }

            if (string.IsNullOrWhiteSpace(resolved.ToUrl))
            {
                resolved.ToUrl = fallback.ToUrl;
            }

            if (string.IsNullOrWhiteSpace(resolved.Comments))
            {
                resolved.Comments = fallback.Comments;
            }

            if (string.IsNullOrWhiteSpace(resolved.FilterPageTypes))
            {
                resolved.FilterPageTypes = fallback.FilterPageTypes;
            }

            if (string.IsNullOrWhiteSpace(resolved.GroupName))
            {
                resolved.GroupName = fallback.GroupName;
            }

            if (string.IsNullOrWhiteSpace(resolved.Languages))
            {
                resolved.Languages = fallback.Languages;
            }

            if (resolved.RedirectType == 0 && fallback.RedirectType != 0)
            {
                resolved.RedirectType = fallback.RedirectType;
            }

            if (resolved.Priority == 0 && fallback.Priority != 0)
            {
                resolved.Priority = fallback.Priority;
            }
        }

        private static object BuildRuleResponse(RedirectRuleItem rule, string filterPageTypeNames)
        {
            if (rule == null)
            {
                return null;
            }

            return new
            {
                id = rule.Id.ToString(),
                fromUrl = rule.FromUrl,
                toUrl = rule.ToUrl,
                redirectType = rule.RedirectType,
                comments = rule.Comments,
                priority = rule.Priority,
                filterPageTypes = rule.FilterPageTypes,
                filterPageTypeNames = filterPageTypeNames,
                languages = rule.Languages,
                groupName = rule.GroupName,
                setupDate = rule.Created.ToString("yyyy-MM-dd HH:mm:ss"),
                sitecoreUser = rule.CreatedBy,
                isWildcard = rule.IsWildcard,
                isRegex = rule.IsRegex,
                sortOrder = rule.SortOrder
            };
        }

        private RedirectRuleInput ResolveInput(RedirectRuleInput input)
        {
            var resolved = input ?? new RedirectRuleInput();
            var fallback = BuildFallbackInput();
            MergeInput(resolved, fallback);
            return resolved;
        }

        private RedirectRuleInput BuildFallbackInput()
        {
            var form = Request?.Form;
            if (form != null && form.Count > 0)
            {
                return BuildInputFromForm(form);
            }

            var payload = ReadRequestBody();
            return string.IsNullOrWhiteSpace(payload) ? new RedirectRuleInput() : BuildInputFromJson(payload);
        }

        private string ReadRequestBody()
        {
            if (Request?.InputStream == null)
            {
                return string.Empty;
            }

            if (Request.InputStream.CanSeek)
            {
                Request.InputStream.Position = 0;
            }

            using (var reader = new System.IO.StreamReader(Request.InputStream))
            {
                return reader.ReadToEnd();
            }
        }

        private void DisableResponseCache()
        {
            if (Response?.Cache == null)
            {
                return;
            }

            Response.Cache.SetCacheability(HttpCacheability.NoCache);
            Response.Cache.SetNoStore();
            Response.Cache.SetExpires(DateTime.UtcNow.AddMinutes(-1));
            Response.Cache.SetRevalidation(HttpCacheRevalidation.AllCaches);
        }
    }
}
