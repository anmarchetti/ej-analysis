using System.Linq.Expressions;
using System.Reflection;

namespace easyJet.Holidays.Tests.Domain
{
    public static class TestExtensions
    {
        /// <summary>
        /// Set object property using relection
        /// </summary>
        /// <typeparam name="TSource">Source type</typeparam>
        /// <typeparam name="TProperty">Property type</typeparam>
        /// <param name="source">Source object</param>
        /// <param name="prop">Property expression to set value</param>
        /// <param name="value">New value</param>
        public static void SetProperty<TSource, TProperty>(
            this TSource source,
            Expression<Func<TSource, TProperty>> prop,
            TProperty value)
        {
            var propertyInfo = (PropertyInfo)((MemberExpression)prop.Body).Member;
            propertyInfo.SetValue(source, value);
        }

        /// <summary>
        /// Set private property value including inherited properties
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="obj"></param>
        /// <param name="propertyName"></param>
        /// <param name="value"></param>
        public static void SetPrivateProperty<T>(this T obj, string propertyName, object value)
        {
            var type = typeof(T);
            // Unfortunately I didn't find BindingFlags combination to cover all situations in our UnitTests.
            // That's why I use both methods which cover all our scenarios
            var prop = type.GetTypeInfo().GetProperty(propertyName);
            if (prop == null)
            {
                prop = type.GetTypeInfo().GetDeclaredProperty(propertyName);
            }

            prop?.SetValue(obj, value, null);
        }

        public static void SetPrivateField<T>(this T obj, string propertyName, object value)
        {
            FieldInfo GetFieldInfo(Type type) => type?.GetTypeInfo()
                .GetField(propertyName,
                    BindingFlags.NonPublic | BindingFlags.Instance);

            var objType = typeof(T);
            var fieldInfo = GetFieldInfo(objType);

            if (fieldInfo == null)
            {
                // support inheritance
                fieldInfo = GetFieldInfo(objType.BaseType);

                if (fieldInfo == null && objType.BaseType?.BaseType != null)
                {
                    // support double inheritance
                    fieldInfo = GetFieldInfo(objType.BaseType.BaseType);
                }
            }

            fieldInfo?.SetValue(obj, value);
        }
    }
}