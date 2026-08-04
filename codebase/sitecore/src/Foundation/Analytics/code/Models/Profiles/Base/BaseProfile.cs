using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Xml.Linq;
using Sitecore.Data;

namespace easyJet.Foundation.Analytics.Models.Profiles.Base
{
    public abstract class BaseProfile
    {
        protected abstract string Name { get; }

        protected abstract ID Id { get; }

        public virtual string GetProfileName() => Name;

        public virtual XElement ToXElement()
        {
            var keys = GetPublicPropertiesInfo().Select(x => new XElement(Constants.Profile.Attributes.Key, new XAttribute(Constants.Profile.Attributes.Name, x.Name.ToLower()), new XAttribute(Constants.Profile.Attributes.Value, x.GetValue(this).ToString().ToLower()))).ToArray();
            var element = new XElement("profile", GetRootAttributes, keys);

            return element;
        }

        protected virtual IEnumerable<PropertyInfo> GetPublicPropertiesInfo() => GetType().GetProperties(BindingFlags.Public | BindingFlags.Instance);

        protected virtual IEnumerable<PropertyInfo> GetProtectedPropertiesInfo() => GetType().GetProperties(BindingFlags.NonPublic | BindingFlags.Instance);

        protected virtual XAttribute[] GetRootAttributes => new[]
        {
            new XAttribute(Constants.Profile.Attributes.Name, Name),
            new XAttribute(Constants.Profile.Attributes.Id, Id.ToString()),
        };
    }
}