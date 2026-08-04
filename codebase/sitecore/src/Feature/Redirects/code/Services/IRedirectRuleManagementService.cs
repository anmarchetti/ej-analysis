using System.Collections.Generic;
using System.IO;
using easyJet.Feature.Redirects.Models;
using Sitecore.Data;

namespace easyJet.Feature.Redirects.Services
{
    public interface IRedirectRuleManagementService
    {
        RedirectRuleImportResult ImportCsv(Stream stream, Database database);

        byte[] ExportCsv(Database database);

        RedirectRuleItem UpsertRule(Database database, RedirectRuleInput input, out bool created, out string error);

        int ActivateReadyRules(Database database, out string error);

        bool DeleteRule(Database database, string id, out string error);
    }
}
