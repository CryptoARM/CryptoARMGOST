import * as fs from "fs";
import * as path from "path";
import { DSS_ACTIONS, SIGNATURE_TYPE } from "../../constants";

/**
 * Вспомогательная функция создания объекта ITransaction для операции создания транзакции
 * @param {IDocumentContent[]} document путь до файла или массив объектов, содержащих информацию о документах
 * @param certificateId идентификатор сертификата подписи на Сервисе Подписи
 * @param isDetached флаг, определяющий отделённую/присоединённую подпись
 * @param operationCode код операции на Сервисе Подписи
 */
export function buildTransaction(Documents: IDocumentContent[], certificateId: string, isDetached: boolean,
                                 OperationCode: number, CmsSignatureType: "sign" | "cosign", OriginalDocument?: string, PinCode?: string) {

  let body: ITransaction;
  const isSignPackage = Documents.length > 1;
  let Document = "";
  if (!isSignPackage) {
    Document = Documents[0].Content;
  }
  body = {
    Document: isSignPackage ? "" : Document,
    Documents: isSignPackage ? Documents : [],
    OperationCode,
    Parameters:
      [
        { Name: "SignatureType", Value: "CMS" },
        { Name: "CertificateID", Value: `${certificateId}` },
        { Name: "IsDetached", Value: `${isDetached}` },
        { Name: "CmsSignatureType", Value: CmsSignatureType },
        { Name: "PinCode", Value: PinCode ? PinCode : "" },
      ],
  };

  if (!isSignPackage) {
    body.Parameters.push({ Name: "DocumentInfo", Value: Documents[0].Name });
    body.Parameters.push({ Name: "DocumentType", Value: path.extname(Documents[0].Name).replace(/\./g, "") });
  }

  if (isDetached && OriginalDocument && !isSignPackage) {
    body.Parameters.push({ Name: "OriginalDocument", Value: OriginalDocument });
  }
  return body;
}

/**
 * Вспомогательная функция создания объекта IDocumentDSS для операции подписи документов
 * @param pathDocument путь до файла
 * @param certificateId идентификатор сертификата подписи на Сервисе Подписи
 * @param isDetached флаг, определяющий отделённую/присоединённую подпись
 * @param cmsSignatureType тип подписи (sign, cosign)
 * @param originalDocumentContent содержимое исходного файла (необходимо для соподписи)
 */
export function buildDocumentDSS(pathDocument: string, CertificateId: number,
                                 IsDetached: boolean, CmsSignatureType: string, originalDocumentContent?: string, PinCode?: string) {

  const Content = fs.readFileSync(pathDocument, "base64");
  const OriginalDocument = originalDocumentContent ? originalDocumentContent : "";

  const body: IDocumentDSS = {
    Content,
    Name: path.basename(pathDocument),
    Signature: {
      CertificateId,
      Parameters: {
        CmsSignatureType,
        IsDetached,
        OriginalDocument,
      },
      PinCode: PinCode ? PinCode : "",
      Type: SIGNATURE_TYPE.CMS,
    },
  };
  return body;
}

/**
 * Вспомогательная функция создания объекта IDocumentPackageDSS для операции подписи пакета документов
 * @param documents массив объектов, содержащих информацию о документах
 * @param certificateId идентификатор сертификата подписи на Сервисе Подписи
 * @param isDetached флаг, определяющий отделённую/присоединённую подпись
 * @param cmsSignatureType тип подписи (Sign, Сosign)
 */
export function buildDocumentPackageDSS(documents: IDocumentContent[], certificateId: number,
                                        isDetached: boolean, cmsSignatureType?: string, PinCode?: string) {

  const body: IDocumentPackageDSS = {
    Documents: documents,
    Signature: {
      CertificateId: certificateId,
      Parameters: {
        CADESType: "BES",
        CmsSignatureType: cmsSignatureType ? cmsSignatureType : "Sign", // Cosign
        IsDetached: `${isDetached}`,
      },
      PinCode: PinCode ? PinCode : "",
      Type: SIGNATURE_TYPE.CMS,
    },
  };

  return body;
}
