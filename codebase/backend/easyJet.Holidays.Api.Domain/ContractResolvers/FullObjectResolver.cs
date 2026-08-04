using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using System.Collections;
using System.Reflection;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.ContractResolvers;

public class FullObjectResolver : DefaultContractResolver
{
    public FullObjectResolver()
    {
        IgnoreSerializableInterface = true;
    }

    protected override JsonContract CreateContract(Type objectType)
    {
        if (typeof(IDictionary).IsAssignableFrom(objectType))
        {
            return CreateDictionaryContract(objectType);
        }
        return base.CreateContract(objectType);
    }

    protected override JsonProperty CreateProperty(MemberInfo member, MemberSerialization memberSerialization)
    {
        var property = base.CreateProperty(member, MemberSerialization.OptOut);

        property.Ignored = false;

        return property;
    }
}