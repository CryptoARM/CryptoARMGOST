interface ITransactionParameter {
  Name: string;
  Value: string;
}

interface IDocumentContent {
  Name: string;
  Content: string;
  OriginalContent?: string;
}

interface ITransaction {
  OperationCode: number;
  Document: string;
  Parameters: ITransactionParameter[];
  Documents: IDocumentContent[];
}

interface IDocumentSignature {
  Type: number;
  Parameters: Object;
  CertificateId: number;
  PinCode: string;
}

interface IDocumentDSS {
  Content: string;
  Name: string;
  Signature: IDocumentSignature;
}

interface IDocumentPackageDSS {
  Documents: IDocumentContent[];
  Signature: IDocumentSignature;
}

interface IUserDSS {
  id: string;
  user: string;
  password: string;
  authUrl: string;
  dssUrl: string;
  confApiVersion: string;
}

interface Window {
    APP_LOG_FILE: string;
    APP_ERRORS_LOG_FILE: string;
    USER_NAME: string;
    mainWindow: any;
    electron: any;
    framework_NW: boolean;
    TRUSTEDCERTIFICATECOLLECTION: trusted.pki.CertificateCollection;
    PKIITEMS: Array<trusted.pkistore.PkiItem>;
    PKISTORE: any;
    RESOURCES_PATH: string;
    DEFAULT_PATH: string;
    TEMPLATES_PATH: string;
    HOME_DIR: string;
    TMP_DIR: string;
    DEFAULT_CERTSTORE_PATH: string;
    DEFAULT_DOCUMENTS_PATH: string;
    DEFAULT_CSR_PATH: string;
    CA_REGREGUESTS_JSON: string;
    CA_CERTREGUESTS_JSON: string;
    CA_CERTTEMPLATE_JSON: string;
    CA_CSR_JSON: string;
    DSS_TOKENS_JSON: string;
    DSS_USERS_JSON: string;
    CERTIFICATES_DSS_JSON: string,
    POLICY_DSS_JSON: string,
    LICENSE_PATH: string;
    LICENSE_REGISTRY_PATH: string;
    LICENSE_MNG: any;
    PLATFORM: string;
    SETTINGS_JSON: string;
    SERVICES_JSON: string;
    TRUSTED_CRYPTO_LOG: string;
    TSP_OCSP_ENABLED: boolean;
    fs: any;
    os: any;
    archiver: any;
    async: any;
    path: any;
    sudo: any;
    locale: string;
    logger: trusted.utils.Logger;
}

declare var window: Window;
