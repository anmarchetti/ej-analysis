using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Domain.Utils;
using Microsoft.Extensions.Options;
using System.ComponentModel.DataAnnotations;
using System.Reflection;

namespace easyJet.Holidays.External.DA.Cookies
{
    /// <summary>
	/// NOTE: Code copied from easyjet.com
	/// Serializes POCO objects with Display attributes into encrypted
	/// strings in the eJ2Session cookie format (hash separated + encrypted).
	/// </summary>
	public class EncryptedCookieSerializer : ICookieSerializer
    {
        private readonly DAIntegrationSettings _integrationSettings;

        public EncryptedCookieSerializer(
            IOptions<DAIntegrationSettings> integrationSettings)
        {
            _integrationSettings = integrationSettings.Value ?? throw new ArgumentNullException(nameof(integrationSettings));
        }

        public T Deserialize<T>(string cookieValue) where T : class
        {
            string value = EncryptionUtils.DecryptValue(cookieValue, _integrationSettings.EncryptionPassword, _integrationSettings.EncryptionSalt);

            string[] parts = value.Split('#');

            IOrderedEnumerable<PropertyInfo> properties = GetOrderedProperties<T>();

            int index = 0;
            T item = Activator.CreateInstance<T>();

            foreach (string part in parts)
            {
                PropertyInfo property = properties.ElementAt(index);

                property.SetValue(item, Convert.ChangeType(part, property.PropertyType), null);

                index++;
            }

            return item;
        }

        private IOrderedEnumerable<PropertyInfo> GetOrderedProperties<T>() where T : class
        {
            IOrderedEnumerable<PropertyInfo> properties = typeof(T)
                .GetProperties()
                .Where(p => p.GetCustomAttribute<DisplayAttribute>() != null)
                .OrderBy(p => p.GetCustomAttribute<DisplayAttribute>().Order);

            return properties;
        }

        public string Serialize<T>(T value) where T : class
        {
            IOrderedEnumerable<PropertyInfo> properties = GetOrderedProperties<T>();
            List<string> propertyValues = new List<string>();

            foreach (PropertyInfo property in properties)
            {
                object propertyValue = property.GetValue(value);

                if (propertyValue != null)
                {
                    propertyValues.Add(propertyValue.ToString());
                }
                /*
                Original easeJyet code has this block, but we don't want to include null values, because we support 2 formats: with and without expiratino date
                else
                {
                    propertyValues.Add("");
                }
                */
            }

            string decrypted = string.Join("#", propertyValues);

            if (value is string)
            {
                decrypted = value as string;
            }

            return EncryptionUtils.EncryptValue(decrypted, _integrationSettings.EncryptionPassword, _integrationSettings.EncryptionSalt);
        }
    }
}
