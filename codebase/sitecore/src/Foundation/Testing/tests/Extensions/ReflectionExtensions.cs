using System;
using System.Reflection;

namespace easyJet.Foundation.Testing.Extensions
{
    public static class ReflectionExtensions
    {
        public static void ForceSetFieldValue<T, TValue>(this T instance, string fieldName, TValue value)
            where T : class
            => GetFieldFromTypeOrBaseTypes(fieldName, instance.GetType()).SetValue(instance, value);

        private static FieldInfo GetFieldFromTypeOrBaseTypes(string fieldName, Type type)
        {
            FieldInfo field = null;
            var currentType = type;
            while (currentType != null && field == null)
            {
                field = currentType.GetField(fieldName, BindingFlags.Instance | BindingFlags.NonPublic | BindingFlags.Public);
                currentType = currentType.BaseType;
            }

            if (field == null)
            {
                throw new ArgumentException($"The Field:'{fieldName}' was not found on any instance of class or its base classes ending with:'{type.FullName}'");
            }

            return field;
        }
    }
}
