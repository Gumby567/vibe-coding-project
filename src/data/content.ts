/** Fallback static bundle (used when Supabase is offline). Aligned with assignment default copy. */
export type SiteContent = {
  nav: { brand: string; links: { label: string; href: string }[]; cta: string };
  hero: { title: string; subtitle: string; cta: string };
  about: { title: string; paragraphs: string[] };
  offers: { title: string; items: string[] };
  contact: {
    title: string;
    subtitle: string;
    fields: {
      companyName: string;
      contactPerson: string;
      email: string;
      message: string;
      consent: string;
    };
    submit: string;
    success: string;
  };
  footer: { built: string };
};

export const content: Record<"en" | "et", SiteContent> = {
  en: {
    nav: {
      brand: "CoolGas Trading",
      links: [
        { label: "About", href: "#about" },
        { label: "Services", href: "#offers" },
        { label: "Contact", href: "#contact" },
      ],
      cta: "Contact Us",
    },
    hero: {
      title: "Reliable Refrigerant Gas Trading Partner",
      subtitle:
        "We supply high-quality refrigerant gases for HVAC, refrigeration, and industrial applications, working with partners across international markets.",
      cta: "Contact Us",
    },
    about: {
      title: "About Us",
      paragraphs: [
        "We provide refrigerant gases for HVAC, refrigeration, and industrial applications, supporting partners worldwide with dependable supply and consistent quality.",
        "Our team focuses on compliance, responsible sourcing, and reliable logistics so every order is delivered to specification—whether large or small.",
      ],
    },
    offers: {
      title: "What We Offer",
      items: [
        "Premium refrigerant gases for HVAC, refrigeration, and industrial systems",
        "Natural refrigerants and conventional blends with documented specifications",
        "Flexible packaging from cylinders to bulk shipments",
        "Regulatory and safety documentation support",
        "Competitive pricing and responsive logistics coordination",
        "Technical guidance for product selection and substitution",
        "Partnerships with international suppliers and distributors",
      ],
    },
    contact: {
      title: "Contact",
      subtitle:
        "Use the form below to send your inquiry. Fields marked as required must be completed before submission.",
      fields: {
        companyName: "Company name",
        contactPerson: "Contact person",
        email: "Email",
        message: "Message",
        consent: "I agree to the processing of my personal data in connection with this inquiry.",
      },
      submit: "Send Request",
      success: "Thank you for your message. We will contact you shortly.",
    },
    footer: {
      built:
        "Built in AI Web Session 2026, ClearContent CMS, Student: <STUDENT_NAME>, Team: <TEAM_SLUG>",
    },
  },
  et: {
    nav: {
      brand: "CoolGas Trading",
      links: [
        { label: "Meist", href: "#about" },
        { label: "Teenused", href: "#offers" },
        { label: "Kontakt", href: "#contact" },
      ],
      cta: "Võta ühendust",
    },
    hero: {
      title: "Usaldusväärne külmagaasi kaubanduspartner",
      subtitle:
        "Tarnime kvaliteetseid külmagaase HVAC-i, külmutuse ja tööstusrakenduste jaoks, tehes koostööd partneritega rahvusvahelistel turgudel.",
      cta: "Võta ühendust",
    },
    about: {
      title: "Meist",
      paragraphs: [
        "Pakume külmagaase HVAC-i, külmutuse ja tööstuslikuks kasutamiseks, toetades partnereid üle maailma usaldusväärse tarne ja ühtlase kvaliteediga.",
        "Meie meeskond keskendub vastavusele, vastutustundlikule hankimisele ja usaldusväärsele logistikale, et iga tellimus vastaks kirjeldusele — olgu suur või väike.",
      ],
    },
    offers: {
      title: "Mida pakume",
      items: [
        "Kvaliteetsed külmagaasid HVAC-i, külmutuse ja tööstussüsteemide jaoks",
        "Looduslikud külmaained ja segud dokumenteeritud spetsifikatsioonidega",
        "Paindlik pakendamine balloonidest hulgi saadetisteni",
        "Regulatiivse ja ohutusdokumentatsiooni tugi",
        "Konkurentsivõimelised hinnad ja reageeriv logistika",
        "Tehniline juhendamine tootevaliku ja asenduste osas",
        "Partnerlused rahvusvaheliste tarnijate ja jaotajatega",
      ],
    },
    contact: {
      title: "Kontakt",
      subtitle: "Kasutage allolevat vormi. Kohustuslikud väljad tuleb täita enne saatmist.",
      fields: {
        companyName: "Ettevõtte nimi",
        contactPerson: "Kontaktisik",
        email: "E-post",
        message: "Sõnum",
        consent: "Nõustun oma isikuandmete töötlemisega selle päringu raames.",
      },
      submit: "Saada päring",
      success: "Täname sõnumi eest. Võtame teiega peagi ühendust.",
    },
    footer: {
      built:
        "Built in AI Web Session 2026, ClearContent CMS, Student: <STUDENT_NAME>, Team: <TEAM_SLUG>",
    },
  },
};
