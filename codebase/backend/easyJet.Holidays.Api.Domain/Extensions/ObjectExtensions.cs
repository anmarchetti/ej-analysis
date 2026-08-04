using System.Reflection;
using System.Runtime.Serialization;
using System.Web;

namespace easyJet.Holidays.Api.Domain.Extensions
{
    public class QueryStringOptions
    {
        public bool UseBooleanString { get; set; }

        public bool UseDeepArrayParse { get; set; }

        /// <summary>
        /// Function to encode a URL string. By default is <see cref="HttpUtility.UrlEncode(string?)" />
        /// </summary>
        public Func<string, string> QueryEncodeFunc { get; set; } = HttpUtility.UrlEncode;
    }

    public static class ObjectExtensions
    {
        /// <summary>
        /// Convert object fields to query string format. Includes only fields:
        /// - annotated with [DataMember]
        /// - Value is not null
        /// 
        /// Converts bool fields to Y/N
        /// </summary>
        /// <param name="obj"></param>
        /// <returns></returns>
        public static string GetQueryString(this object obj, QueryStringOptions options = null)
        {
            return ConvertObjectQuery(obj, options);
        }

        /// <summary>
        /// Convert array value to query parameters.
        /// 1. name=str1,str2,str3
        /// 2. name[0]=str1&name[1]=str2&name[2]=str3
        /// 3. name[0][prop1]=1&name[0][prop2]=2&name[1][prop1]=3&name[1][prop2]=4
        /// </summary>
        /// <param name="parent">The name of the parent property before entering the recursion. Needed to combine property names</param>
        /// <param name="value">Value to parse></param>
        /// <param name="options">Query options settings</param>
        private static string ConverArrayQuery(string parent, object[] value, QueryStringOptions options = null, bool deepArrayConvert = false)
        {
            if (value is string[] && options?.UseDeepArrayParse != true)
            {
                // for the string array should do specifc parsing
                return ConvertStringArrayQuery(parent, (string[])value, options);
            }
            var props = value.ToList().Select((prop, index) =>
            {
                if (prop.GetType().IsPrimitive || prop is string)
                {
                    // Parse primitiva values and strings
                    return ConvertPrimitiveQuery($"{parent}[{index}]", prop, options);
                }
                // Recursivly parse objects in aaray. Pass initial property name.
                return ConvertObjectQuery(prop, options, $"{parent}[{index}]");
            });
            return string.Join("&", props.ToArray());
        }

        /// <summary>
        /// Parse array of strings. If UseDeepArrayParse=true then use deep array parsing, for other case will do usually strings join.
        /// 1. name=str1,str2,str3
        /// 2. name[0]=str1&name[1]=str2&name[2]=str3
        /// </summary>
        /// <param name="name">Query parameter name</param>
        /// <param name="val">Value to parse></param>
        /// <param name="options">Query options settings</param>
        private static string ConvertStringArrayQuery(string name, string[] val, QueryStringOptions options = null)
        {
            var value = options?.QueryEncodeFunc != null
                ? string.Join(",", val.Select(s => options.QueryEncodeFunc(s)))
                : string.Join(",", val.Select(HttpUtility.UrlEncode));

            return $"{name}={value}";
        }

        /// <summary>
        /// Will return parsed string for primitive values.
        /// For boolean values can be two cases(depends on UseBooleanString property)
        /// 1. name=Y
        /// 2. name=True
        /// </summary>
        /// <param name="name">Property name</param>
        /// <param name="val">Value to parse></param>
        /// <param name="options">Query options settings</param>
        private static string ConvertPrimitiveQuery(string name, object val, QueryStringOptions options = null)
        {
            if (val is bool)
            {
                if (options?.UseBooleanString == true)
                {
                    // Return 'true' not 'True'
                    val = val.ToString().ToLower();
                }
                else
                {
                    val = (bool)val ? "Y" : "N";
                }
            }

            return options?.QueryEncodeFunc != null
                ? $"{name}={options.QueryEncodeFunc(val.ToString())}"
                : $"{name}={HttpUtility.UrlEncode(val.ToString())}";
        }

        /// <summary>
        /// Parse objects to query parameters string.
        /// </summary>
        /// <param name="obj">Object to parse</param>
        /// <param name="options">Query options settings</param>
        /// <param name="parent">The name of the parent property before entering the recursion. Needed to combine property names</param>
        private static string ConvertObjectQuery(object obj, QueryStringOptions options = null, string parent = null)
        {
            try
            {
                var props = obj.GetType().GetProperties().ToList().Select(property =>
                {
                    DataMemberAttribute attr = property.GetCustomAttributes(typeof(DataMemberAttribute), true).FirstOrDefault() as DataMemberAttribute;

                    if (attr == null)
                    {
                        return null;
                    }

                    var name = string.IsNullOrEmpty(attr.Name) ? property.Name : attr.Name;
                    name = parent != null ? $"{parent}[{name}]" : name;

                    var val = property.GetValue(obj, null);
                    if (val == null)
                    {
                        return null;
                    }

                    var valType = val.GetType();
                    if (valType.IsPrimitive || val is string)
                    {
                        // Parse primitive values and strings
                        return ConvertPrimitiveQuery(name, val, options);
                    }
                    if (valType.IsArray)
                    {
                        // Parse array values
                        return ConverArrayQuery(name, (object[])val, options);
                    }
                    if (valType.IsEnum && valType.GetCustomAttributes(typeof(FlagsAttribute), false).Length > 0)
                    {

                        // it's Flags enum value. Convert to int
                        return ConvertPrimitiveQuery(name, (int)val, options);
                    }

                    if (valType.IsEnum && !string.IsNullOrEmpty(valType.GetMember(val.ToString()).FirstOrDefault()?.GetCustomAttribute<EnumMemberAttribute>(false)?.Value))
                    {
                        // it's EnumMember attribute. Convert attribute value to string
                        return ConvertPrimitiveQuery(name, valType.GetMember(val.ToString()).FirstOrDefault()?.GetCustomAttribute<EnumMemberAttribute>(false)?.Value, options);
                    }

                    // Other cases
                    return ConvertObjectQuery(val, options, name);

                }).Where(x => x != null);

                return string.Join("&", props.ToArray());
            }
            catch (Exception e)
            {
                return "";
            }
        }
    }
}
