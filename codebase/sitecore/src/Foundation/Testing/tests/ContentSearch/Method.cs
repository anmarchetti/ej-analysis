using System;
using System.Linq;
using System.Reflection;

namespace easyJet.Foundation.Testing.ContentSearch
{
    internal class Method
    {
        public MethodInfo MethodInfo { get; }

        public Method(Type type, string methodName, int overloadPosition = 0)
        {
            MethodInfo = GetMethod(type, methodName, overloadPosition);
        }

        private MethodInfo GetMethod(Type type, string methodName, int overloadPosition)
        {
            return type.GetMethods(BindingFlags.Static | BindingFlags.Public)
                .Where(method => method.Name == methodName)
                .ElementAt(overloadPosition);
        }
    }
}
