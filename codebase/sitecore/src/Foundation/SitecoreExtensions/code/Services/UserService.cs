using System.Diagnostics.CodeAnalysis;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using Sitecore.Security.Accounts;
using Sitecore.SecurityModel;

namespace easyJet.Foundation.SitecoreExtensions.Services
{
    [ExcludeFromCodeCoverage]
    [Service(typeof(IUserService), Lifetime = Lifetime.Singleton)]
    public class UserService : IUserService
    {
        public User GetContextUser() => Sitecore.Context.User;

        public User CreateUser(string username, string password)
        {
            using (new SecurityDisabler())
            {
                var user = User.Create(username, password);
                user.Profile.Save();
                return user;
            }
        }

        public bool UserExists(string username)
            => User.Exists(username);

        public User GetUser(string username, bool isAuthenticated)
            => User.FromName(username, true);
    }
}