using System;

namespace easyJet.Foundation.DependencyInjection.Attributes
{
    [AttributeUsage(AttributeTargets.Class, Inherited = false)]
    public class ServiceAttribute : Attribute
    {
        public ServiceAttribute()
        {
        }

        public ServiceAttribute(Type serviceType)
        {
            ServiceType = serviceType;
        }

        public Lifetime Lifetime { get; set; } = Lifetime.Transient;

        public Type ServiceType { get; set; }
    }
}