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
    DSS_CERTIFICATES_JSON: string,
    LICENSE_PATH: string;
    LICENSE_MNG: any;
    PLATFORM: string;
    SETTINGS_JSON: string;
    SERVICES_JSON: string;
    TRUSTED_CRYPTO_LOG: string;
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
