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
        "We supply high-quality refrigerant gases to businesses across Europe. Trusted by industry leaders for consistent quality, competitive pricing, and dependable logistics.",
      cta: "Contact Us",
    },
    about: {
      title: "About Us",
      paragraphs: [
        "With over a decade of experience in the refrigerant gas market, we connect manufacturers with distributors and end-users across Europe.",
        "Our team of experts ensures regulatory compliance, optimal sourcing, and reliable delivery for every order — big or small.",
      ],
    },
    offers: {
      title: "What We Offer",
      items: [
        "R-410A, R-32, R-134a and other HFC refrigerants",
        "Natural refrigerants (CO₂, ammonia, propane)",
        "Bulk and cylinder packaging options",
        "EU F-Gas regulation compliance support",
        "Competitive pricing with volume discounts",
        "Pan-European logistics and warehousing",
        "Technical consultation and product selection guidance",
      ],
    },
    contact: {
      title: "Get in Touch",
      subtitle: "Fill out the form and our team will respond within 24 hours.",
      fields: {
        companyName: "Company Name",
        contactPerson: "Contact Person",
        email: "Email Address",
        message: "Message",
        consent: "I agree to the processing of my personal data",
      },
      submit: "Send Message",
      success: "Thank you! We will get back to you shortly.",
    },
    footer: {
      built:
        "Built in AI Web Session 2026, ClearContent CMS, Student: Diego Alvarez, Team: <TEAM_SLUG>",
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
      title: "Usaldusväärne külmagaasi kauplemise partner",
      subtitle:
        "Tarnime kvaliteetseid külmagaase ettevõtetele üle Euroopa. Usaldusväärne partner kvaliteedi, hinnastamise ja logistika osas.",
      cta: "Võta ühendust",
    },
    about: {
      title: "Meist",
      paragraphs: [
        "Üle kümne aasta kogemust külmagaasi turul — ühendame tootjad turustajate ja lõppkasutajatega üle Euroopa.",
        "Meie ekspertide meeskond tagab regulatiivse vastavuse, optimaalse hankimise ja usaldusväärse tarne iga tellimuse puhul.",
      ],
    },
    offers: {
      title: "Mida pakume",
      items: [
        "R-410A, R-32, R-134a ja muud HFC külmaained",
        "Looduslikud külmaained (CO₂, ammoniaak, propaan)",
        "Hulgi- ja balloonpakendid",
        "EL F-gaasi regulatsiooni nõuetele vastavuse tugi",
        "Konkurentsivõimelised hinnad mahusoodustustega",
        "Üleeuroopaline logistika ja laondus",
        "Tehniline konsultatsioon ja tootevaliku juhendamine",
      ],
    },
    contact: {
      title: "Võta ühendust",
      subtitle: "Täida vorm ja meie meeskond vastab 24 tunni jooksul.",
      fields: {
        companyName: "Ettevõtte nimi",
        contactPerson: "Kontaktisik",
        email: "E-posti aadress",
        message: "Sõnum",
        consent: "Nõustun oma isikuandmete töötlemisega",
      },
      submit: "Saada sõnum",
      success: "Aitäh! Võtame teiega peagi ühendust.",
    },
    footer: {
      built:
        "Built in AI Web Session 2026, ClearContent CMS, Student: <STUDENT_NAME>, Team: <TEAM_SLUG>",
    },
  },
};
