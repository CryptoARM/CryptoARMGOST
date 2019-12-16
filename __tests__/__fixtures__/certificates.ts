const CERTIFICATES = [{
  CertificateType: "ServerSide",
  ID: 14,
  DName: "CN=idonly",
  CertificateBase64: "MIIDCDCCA ... ugFV8td4DaneG2/gno7T6Alohp6CF/yOu",
  Status: {
    Value: "ACTIVE",
    RevocationInfo: null,
    PinCode: null,
    ActiveCertId: 0,
  },
  IsDefault: false,
  CertificateAuthorityID: 11,
  CspID: "e8e67f9e-7eed-4116-ad98-20582e4d766e",
  HashAlgorithms: ["GOST R 34.11-94"],
  ProviderName: null,
  ProviderType: 0,
  PrivateKeyNotBefore: null,
  PrivateKeyNotAfter: null,
  HasPin: false,
  FriendlyName: "",
}, {
  CertificateType: "ServerSide",
  ID: 15,
  DName: "CN=idonly, C=RU",
  CertificateBase64: "MIIG+TCCBq ... dJkhC/rkJrBYhT574WAMgGdxGQb1lQ==",
  Status: {
    Value: "ACTIVE",
    RevocationInfo: null,
    PinCode: null,
    ActiveCertId: 0,
  },
  IsDefault: false,
  CertificateAuthorityID: 6,
  CspID: "e8e67f9e-7eed-4116-ad98-20582e4d766e",
  HashAlgorithms: ["GOST R 34.11-94"],
  ProviderName: null,
  ProviderType: 0,
  PrivateKeyNotBefore: null,
  PrivateKeyNotAfter: null,
  HasPin: false,
  FriendlyName: "",
},
];

const hcertificates: any[] = [];
for (const certificate of CERTIFICATES) {
  hcertificates.push({ id: certificate.ID, ...certificate });
}

export const certificateMap = hcertificates;

export default CERTIFICATES;
