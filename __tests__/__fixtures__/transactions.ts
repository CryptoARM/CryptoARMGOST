const TRANSACTION = {
  OperationCode: 2,
  Parameters:
    [
      { Name: "SignatureType", Value: "CMS" },
      { Name: "CertificateID", Value: "13" },
      { Name: "DocumentInfo", Value: "testPdf.pdf" },
      { Name: "DocumentType", Value: "pdf" },
      { Name: "IsDetached", Value: "false" },
      { Name: "CADESType", Value: "BES" },
    ],
  Document: "JVBERi0xLjUNCiW1tbW14Kfu",
};

export default TRANSACTION;
export const TRANSACTION_ID = "1";
