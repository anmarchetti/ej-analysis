using System.Text.RegularExpressions;

namespace easyJet.Holidays.Tests.Domain
{
    public class ObjectUtils
    {
        /// <summary>
        /// Merge dynamic objects
        /// </summary>
        /// <param name="item1"></param>
        /// <param name="item2"></param>
        /// <returns></returns>
        public static object Merge(object item1, object item2)
        {
            if (item1 == null || item2 == null)
            {
                return item1 ?? item2;
            }

            var result = new Dictionary<string, object>();
            foreach (System.Reflection.PropertyInfo fi in item1.GetType().GetProperties().Where(x => x.CanRead))
            {
                var value = fi.GetValue(item1, null);
                result[fi.Name] = value;
            }
            foreach (System.Reflection.PropertyInfo fi in item2.GetType().GetProperties().Where(x => x.CanRead))
            {
                var value = fi.GetValue(item2, null);
                result[fi.Name] = value;
            }

            return result;
        }

        public static string MinifyJson(string json)
        {
            var result = Regex.Replace(json, @"\s(?=([^""]*""[^""]*"")*[^""]*$)", string.Empty);
            return result;
        }
    }
}
