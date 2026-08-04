namespace easyJet.Holidays.External.Atcom.Models.Internal
{
    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("xsd", "4.7.3081.0")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    [System.Xml.Serialization.XmlTypeAttribute(AnonymousType = true, Namespace = "AtComRes/AgentValidationResponse")]
    [System.Xml.Serialization.XmlRootAttribute(Namespace = "AtComRes/AgentValidationResponse", IsNullable = false)]
    public partial class AgentValidationResponse : AtcomresBaseResponse
    {
        /// <remarks/>
        public bool ValidationSuccessful;

        /// <remarks/>
        public string Agent_Name;

        /// <remarks/>
        public AgentValidationResponseAgent_Tp Agent_Tp;

        /// <remarks/>
        public AgentValidationResponseAgent_Group Agent_Group;

        /// <remarks/>
        public AgentValidationResponseSales_Sts Sales_Sts;

        /// <remarks/>
        [System.Xml.Serialization.XmlIgnoreAttribute()]
        public bool Sales_StsSpecified;

        /// <remarks/>
        public AgentValidationResponseCredit_Sts Credit_Sts;

        /// <remarks/>
        [System.Xml.Serialization.XmlIgnoreAttribute()]
        public bool Credit_StsSpecified;

        /// <remarks/>
        public AgentValidationResponseAgent_Mth Agent_Mth;

        /// <remarks/>
        [System.Xml.Serialization.XmlIgnoreAttribute()]
        public bool Agent_MthSpecified;

        /// <remarks/>
        [System.Xml.Serialization.XmlArrayItemAttribute("Mkt_Cd", IsNullable = false)]
        public AgentValidationResponseMkt_Cd[] Mkt_List;

        /// <remarks/>
        [System.Xml.Serialization.XmlElementAttribute(DataType = "date")]
        public System.DateTime Lates_Dt;

        /// <remarks/>
        [System.Xml.Serialization.XmlIgnoreAttribute()]
        public bool Lates_DtSpecified;
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("xsd", "4.7.3081.0")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    [System.Xml.Serialization.XmlTypeAttribute(AnonymousType = true, Namespace = "AtComRes/AgentValidationResponse")]
    public partial class AgentValidationResponseAgent_Tp
    {
        /// <remarks/>
        [System.Xml.Serialization.XmlAttributeAttribute()]
        public string Code;

        /// <remarks/>
        [System.Xml.Serialization.XmlAttributeAttribute()]
        public string Name;

        /// <remarks/>
        [System.Xml.Serialization.XmlTextAttribute()]
        public string Value;
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("xsd", "4.7.3081.0")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    [System.Xml.Serialization.XmlTypeAttribute(AnonymousType = true, Namespace = "AtComRes/AgentValidationResponse")]
    public partial class AgentValidationResponseAgent_Group
    {
        /// <remarks/>
        [System.Xml.Serialization.XmlAttributeAttribute()]
        public string Code;

        /// <remarks/>
        [System.Xml.Serialization.XmlAttributeAttribute()]
        public string Name;

        /// <remarks/>
        [System.Xml.Serialization.XmlTextAttribute()]
        public string Value;
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("xsd", "4.7.3081.0")]
    [System.SerializableAttribute()]
    [System.Xml.Serialization.XmlTypeAttribute(AnonymousType = true, Namespace = "AtComRes/AgentValidationResponse")]
    public enum AgentValidationResponseSales_Sts
    {
        /// <remarks/>
        ON,

        /// <remarks/>
        OFF,

        /// <remarks/>
        [System.Xml.Serialization.XmlEnumAttribute("")]
        Item,
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("xsd", "4.7.3081.0")]
    [System.SerializableAttribute()]
    [System.Xml.Serialization.XmlTypeAttribute(AnonymousType = true, Namespace = "AtComRes/AgentValidationResponse")]
    public enum AgentValidationResponseCredit_Sts
    {
        /// <remarks/>
        CR,

        /// <remarks/>
        CA,

        /// <remarks/>
        [System.Xml.Serialization.XmlEnumAttribute("")]
        Item,
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("xsd", "4.7.3081.0")]
    [System.SerializableAttribute()]
    [System.Xml.Serialization.XmlTypeAttribute(AnonymousType = true, Namespace = "AtComRes/AgentValidationResponse")]
    public enum AgentValidationResponseAgent_Mth
    {
        /// <remarks/>
        STD,

        /// <remarks/>
        DIR,

        /// <remarks/>
        LOC,

        /// <remarks/>
        COL,

        /// <remarks/>
        [System.Xml.Serialization.XmlEnumAttribute("")]
        Item,
    }

    /// <remarks/>
    [System.CodeDom.Compiler.GeneratedCodeAttribute("xsd", "4.7.3081.0")]
    [System.SerializableAttribute()]
    [System.Diagnostics.DebuggerStepThroughAttribute()]
    [System.ComponentModel.DesignerCategoryAttribute("code")]
    [System.Xml.Serialization.XmlTypeAttribute(AnonymousType = true, Namespace = "AtComRes/AgentValidationResponse")]
    public partial class AgentValidationResponseMkt_Cd
    {
        /// <remarks/>
        [System.Xml.Serialization.XmlAttributeAttribute()]
        [System.ComponentModel.DefaultValueAttribute(false)]
        public bool Default;

        /// <remarks/>
        [System.Xml.Serialization.XmlTextAttribute()]
        public string Value;

        public AgentValidationResponseMkt_Cd()
        {
            this.Default = false;
        }
    }
}