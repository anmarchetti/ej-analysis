using System.Diagnostics.CodeAnalysis;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using Sitecore;

namespace easyJet.Foundation.SitecoreExtensions.Services
{
    [Service(typeof(IAdminService), Lifetime = Lifetime.Transient)]
    [SuppressMessage(
        "Minor Code Smell",
        "S2325",
        Justification = "Used by DI pattern and test mocking, therefore IsAdmin should not be static.")]
    public class AdminService : IAdminService
    {
        public bool IsAdmin()
        {
            return Context.User != null && Context.User.IsAdministrator;
        }
    }
}