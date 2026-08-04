using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using EasyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore.Abstractions;
using Sitecore.Security.Accounts;

namespace easyJet.Foundation.SitecoreExtensions.Services
{
    [Service(typeof(IUserCreationService), Lifetime = Lifetime.Singleton)]
    public class UserCreationService : IUserCreationService
    {
        private readonly BaseSettings baseSettings;
        private readonly IUserService userService;

        public UserCreationService(BaseSettings baseSettings, IUserService userService)
        {
            this.baseSettings = baseSettings;
            this.userService = userService;
        }

        public User GetOrCreateNonAnonymousUser(string username)
        {
            var contextUser = userService.GetContextUser();
            if (!contextUser.Name.Contains(Constants.UserName.Anonymous))
            {
                return contextUser;
            }

            username = $@"{baseSettings.GetSetting(Constants.EnvironmentHintEnvironmentNameSettingsName)}\{username}";

            if (!userService.UserExists(username))
            {
                userService.CreateUser(username, username.ToSha1Hash());
            }

            return userService.GetUser(username, true);
        }
    }
}
