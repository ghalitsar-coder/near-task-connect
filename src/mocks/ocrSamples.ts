export const ocrSamples = [
  {
    label: "Clean (high confidence)",
    confidence: 0.97,
    extracted: {
      nik: "3471010101900012",
      name: "AGUS PRATAMA",
      birthDate: "12-05-1990",
      address: "JL KALIURANG KM 5 NO 23",
    },
    mismatchFields: [],
  },
  {
    label: "Low confidence",
    confidence: 0.68,
    extracted: {
      nik: "3471010101870034",
      name: "SITI WULANDARI",
      birthDate: "03-11-1987",
      address: "JL GODEAN KM 3",
    },
    mismatchFields: [],
  },
  {
    label: "Mismatch address",
    confidence: 0.84,
    extracted: {
      nik: "3471010101830045",
      name: "BAMBANG SAPUTRA",
      birthDate: "21-07-1983",
      address: "JL MAGELANG KM 7 NO 88",
    },
    mismatchFields: ["address"],
  },
];
