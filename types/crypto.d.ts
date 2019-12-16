/// <reference types="node" />
declare namespace trusted {
    /**
     *
     * @export
     * @enum {number}
     */
    enum DataFormat {
        DER = 0,
        PEM = 1
    }
}
declare namespace native {
    namespace PKI {
        class OID {
            constructor(value?: string);
            getLongName(): string;
            getShortName(): string;
            getValue(): string;
        }
        class Extension {
            constructor(oid?: OID, value?: string);
            getTypeId(): OID;
            setTypeId(oid: OID): void;
            getCritical(): boolean;
            setCritical(critical: boolean): void;
        }
        class ExtensionCollection {
            items(index: number): Extension;
            length(): number;
            push(ext: Extension): void;
            pop(): void;
            removeAt(index: number): void;
        }
        class CRL {
            getVersion(): number;
            getIssuerName(): string;
            getIssuerFriendlyName(): string;
            getLastUpdate(): string;
            getNextUpdate(): string;
            getThumbprint(): Buffer;
            getSignatureAlgorithm(): string;
            getSignatureDigestAlgorithm(): string;
            getAuthorityKeyid(): Buffer;
            getCrlNumber(): number;
            load(filename: string, dataFormat?: trusted.DataFormat): void;
            import(raw: Buffer, dataFormat: trusted.DataFormat): void;
            save(filename: string, dataFormat: trusted.DataFormat): void;
            export(dataFormat: trusted.DataFormat): Buffer;
            compare(crl: CRL): number;
            equals(crl: CRL): boolean;
            duplicate(): CRL;
            hash(digestName: string): Buffer;
        }
        class CrlCollection {
            items(index: number): CRL;
            length(): number;
            push(crl: CRL): void;
            pop(): void;
            removeAt(index: number): void;
        }
        class Certificate {
            constructor(param?: PKI.Certificate | PKI.CertificationRequest);
            getSubjectFriendlyName(): string;
            getSubjectName(): string;
            getIssuerFriendlyName(): string;
            getIssuerName(): string;
            getNotAfter(): string;
            setNotAfter(offsetSec?: number): void;
            getNotBefore(): string;
            setNotBefore(offsetSec?: number): void;
            getSerialNumber(): Buffer;
            setSerialNumber(serial: string): void;
            getThumbprint(): Buffer;
            getVersion(): number;
            getType(): number;
            getKeyUsage(): number;
            getSignatureAlgorithm(): string;
            getSignatureDigestAlgorithm(): string;
            getPublicKeyAlgorithm(): string;
            getOrganizationName(): string;
            getOCSPUrls(): string[];
            getCAIssuersUrls(): string[];
            isSelfSigned(): boolean;
            isCA(): boolean;
            sign(): void;
            load(filename: string, dataFormat?: trusted.DataFormat): void;
            import(raw: Buffer, dataFormat: trusted.DataFormat): void;
            save(filename: string, dataFormat: trusted.DataFormat): void;
            export(dataFormat: trusted.DataFormat): Buffer;
            compare(cert: Certificate): number;
            equals(cert: Certificate): boolean;
            duplicate(): Certificate;
            hash(digestName: string): Buffer;
        }
        class CertificateCollection {
            items(index: number): Certificate;
            length(): number;
            push(cer: Certificate): void;
            pop(): void;
            removeAt(index: number): void;
        }
        class Cipher {
            constructor();
            setProvAlgorithm(name: string): void;
            encrypt(filenameSource: string, filenameEnc: string, format: trusted.DataFormat): void;
            decrypt(filenameEnc: string, filenameDec: string, format: trusted.DataFormat): void;
            addRecipientsCerts(certs: CertificateCollection): void;
        }
        interface INameField {
            /**
             * longName | shortName | nid
             *
             * @type {string}
             * @memberof INameField
             */
            type: string;
            value: string;
        }
        class CertificationRequest {
            constructor();
            save(filename: string, dataFormat?: trusted.DataFormat): void;
            setSubject(x509name: string | INameField[]): void;
            getVersion(): number;
            setVersion(version: number): void;
            setExtensions(exts: ExtensionCollection): void;
            setContainerName(x509name: string): void;
            getContainerName(): string;
            setPubKeyAlgorithm(PubKeyAlgorithm: string): void;
            getPubKeyAlgorithm(): string;
            setExportableFlag(ExportableFlag: boolean): void;
            getExportableFlag(): boolean;
            setNewKeysetFlag(newKeysetFlag: boolean): void;
            getNewKeysetFlag(): boolean;
        }
        class OCSP {
            constructor(inData: Certificate | Buffer, connSettings?: native.UTILS.ConnectionSettings);
            Export(): Buffer;
            Verify(): number;
            VerifyCertificate(cert: PKI.Certificate): number;
            RespStatus(): number;
            SignatureAlgorithmOid(): string;
            Certificates(): CertificateCollection;
            ProducedAt(): string;
            RespNumber(): number;
            RespIndexByCert(cert: PKI.Certificate, issuer?: PKI.Certificate): number;
            OcspCert(): PKI.Certificate;
            Status(respIdx?: number): number;
            RevTime(respIdx?: number): string;
            RevReason(respIdx?: number): number;
            ThisUpdate(respIdx?: number): string;
            NextUpdate(respIdx?: number): string;
        }
        class TSPRequest {
            constructor(hashAlgOid: string, dataFileName?: string);
            AddData(data: Buffer): void;
            GetCertReq(): boolean;
            SetCertReq(certReq: boolean): void;
            GetNonce(): boolean;
            SetNonce(certReq: boolean): void;
            GetPolicyId(): string;
            SetPolicyId(policyId: string): void;
            GetHashAlgOid(): string;
            SetHashAlgOid(policyId: string): void;
            GetDataHash(): Buffer;
            SetDataHash(dataHash: Buffer): void;
        }
        class TSP {
            constructor(inData: TSPRequest | Buffer, connSettings?: native.UTILS.ConnectionSettings);
            Export(): Buffer;
            Certificates(): CertificateCollection;
            TSACertificate(): Certificate;
            Verify(): number;
            VerifyCertificate(cert: PKI.Certificate): number;
            FailInfo(): number;
            Status(): number;
            StatusString(): string;
            DataHashAlgOID(): string;
            DataHash(): Buffer;
            PolicyID(): string;
            SerialNumber(): Buffer;
            Time(): string;
            Accuracy(): number;
            Ordering(): boolean;
            HasNonce(): boolean;
            TsaName(): string;
            TsaNameBlob(): Buffer;
        }
        class PKCS12 {
            load(filename: string): void;
            save(filename: string): void;
        }
    }
    namespace UTILS {
        interface IContainerName {
            container: string;
            unique: string;
            fqcnA: string;
            fqcnW: string;
        }
        class Csp {
            isGost2001CSPAvailable(): boolean;
            isGost2012_256CSPAvailable(): boolean;
            isGost2012_512CSPAvailable(): boolean;
            checkCPCSPLicense(): boolean;
            getCPCSPLicense(): string;
            getCPCSPVersion(): string;
            getCPCSPVersionPKZI(): string;
            getCPCSPVersionSKZI(): string;
            getCPCSPSecurityLvl(): string;
            enumProviders(): object[];
            enumContainers(type?: number, provName?: string): IContainerName[];
            getCertificateFromContainer(contName: string, provType: number, provName?: string): PKI.Certificate;
            getContainerNameByCertificate(cert: PKI.Certificate, category: string): string;
            installCertificateFromContainer(contName: string, provType: number, provName?: string): void;
            installCertificateToContainer(cert: PKI.Certificate, contName: string, provType: number, provName?: string): void;
            deleteContainer(contName: string, provType: number, provName?: string): void;
            hasPrivateKey(cert: PKI.Certificate): boolean;
            buildChain(cert: PKI.Certificate): PKI.CertificateCollection;
            verifyCertificateChain(cert: PKI.Certificate): boolean;
            isHaveExportablePrivateKey(cert: PKI.Certificate): boolean;
            certToPkcs12(cert: PKI.Certificate, exportPrivateKey: boolean, password?: string): PKI.PKCS12;
            importPkcs12(p12: PKI.PKCS12, password?: string): void;
        }
        class ModuleInfo {
            getModuleVersion(): string;
            getModuleName(): string;
        }
        class Tools {
            stringFromBase64(instr: string, flag?: number): string;
            stringToBase64(instr: string, flag?: number): string;
        }
        class License_Mng {
            addLicense(lic: string): number;
            addLicenseFromFile(filename: string): number;
            deleteLicense(lic: string): boolean;
            deleteLicenseOfIndex(index: number): boolean;
            getCountLicense(): number;
            getLicense(index: number): string;
            checkLicense(lic: string): string;
            checkLicenseOfIndex(index: number): string;
            generateTrial(): string;
            checkTrialLicense(): string;
            accessOperations(): boolean;
        }
        class Jwt {
            createHeader(alg: string): string;
            createPayload(aud: string, sub: string, core: number, nbf: number, iss: string, exp: number, iat: number, jti: string, desc: string): string;
            createJWTToken(header: string, payload: string, privateKey: string): string;
            verifyJWTToken(jwtToken: string, publicKey: string): string;
        }
        class Dlv {
            licenseValidateFormat(lic: string): boolean;
            checkLicense(lic: string): string;
        }
        class ConnectionSettings {
            AuthType: number;
            Address: string;
            UserName: string;
            Password: string;
            ClientCertificate: PKI.Certificate;
            ProxyAuthType: number;
            ProxyAddress: string;
            ProxyUserName: string;
            ProxyPassword: string;
        }
    }
    namespace COMMON {
        class Logger {
            start(filename: string, level: trusted.LoggerLevel): void;
            stop(): void;
            clear(): void;
        }
    }
    namespace CMS {
        class TimestampParams {
            getStampType(): number;
            setStampType(stmp: number): void;
            getConnSettings(): native.UTILS.ConnectionSettings;
            setConnSettings(connSett: native.UTILS.ConnectionSettings): void;
            getTspHashAlg(): String;
            setTspHashAlg(hashAlg: String): void;
        }
        class CadesParams {
            getCadesType(): number;
            setCadesType(signType: number): void;
            getConnSettings(): native.UTILS.ConnectionSettings;
            setConnSettings(connSett: native.UTILS.ConnectionSettings): void;
            getTspHashAlg(): String;
            setTspHashAlg(hashAlg: String): void;
            getOcspSettings(): native.UTILS.ConnectionSettings;
            setOcspSettings(connSett: native.UTILS.ConnectionSettings): void;
        }
        class SignedData {
            constructor();
            getContent(): Buffer;
            setContent(v: Buffer): void;
            freeContent(): void;
            getFlags(): number;
            setFlags(v: number): void;
            load(filename: string, dataFormat?: trusted.DataFormat): void;
            import(raw: Buffer, dataFormat: trusted.DataFormat): void;
            save(filename: string, dataFormat: trusted.DataFormat): void;
            export(dataFormat?: trusted.DataFormat): Buffer;
            getCertificates(): PKI.CertificateCollection;
            getSigners(): SignerCollection;
            isDetached(): boolean;
            verify(signer?: CMS.Signer): boolean;
            getSignParams(): CMS.TimestampParams | CMS.CadesParams;
            setSignParams(params: CMS.TimestampParams | CMS.CadesParams): void;
            sign(certs: PKI.Certificate): void;
        }
        class SignerCollection {
            items(index: number): Signer;
            length(): number;
        }
        class Signer {
            constructor(nativeHandle?: native.CMS.Signer);
            setCertificate(cert: PKI.Certificate): void;
            getCertificate(): PKI.Certificate;
            setIndex(ind: number): void;
            getIndex(): number;
            getIssuerName(): string;
            getSerialNumber(): string;
            getSignatureAlgorithm(): string;
            getDigestAlgorithm(): string;
            getSigningTime(): string;
            timestamp(tspType: number): native.PKI.TSP;
            verifyTimestamp(tspType: number): boolean;
        }
    }
    namespace PKISTORE {
        interface IPkiItem extends IPkiCrl, IPkiCertificate, IPkiRequest, IPkiKey {
            /**
             * DER | PEM
             */
            format: string;
            /**
             * CRL | CERTIFICATE | KEY | REQUEST
             */
            type: string;
            uri: string;
            provider: string;
            category: string;
            hash: string;
        }
        interface IPkiKey {
            encrypted?: boolean;
        }
        interface IPkiCrl {
            authorityKeyid?: string;
            crlNumber?: string;
            issuerName?: string;
            issuerFriendlyName?: string;
            lastUpdate?: string;
            nextUpdate?: string;
        }
        interface IPkiRequest {
            subjectName?: string;
            subjectFriendlyName?: string;
            key?: string;
        }
        interface IPkiCertificate {
            subjectName?: string;
            subjectFriendlyName?: string;
            issuerName?: string;
            issuerFriendlyName?: string;
            notAfter?: string;
            notBefore?: string;
            serial?: string;
            key?: string;
            organizationName?: string;
            signatureAlgorithm?: string;
            signatureDigestAlgorithm?: string;
            publicKeyAlgorithm?: string;
        }
        interface IFilter {
            /**
             * PkiItem
             * CRL | CERTIFICATE | KEY | REQUEST
             */
            type?: string[];
            /**
             * Provider
             * SYSTEM, MICROSOFT, CRYPTOPRO, TSL, PKCS11, TRUSTEDNET
             */
            provider?: string[];
            /**
             * MY, OTHERS, TRUST, CRL
             */
            category?: string[];
            hash?: string;
            subjectName?: string;
            subjectFriendlyName?: string;
            issuerName?: string;
            issuerFriendlyName?: string;
            isValid?: boolean;
            serial?: string;
        }
        abstract class Provider {
            type: string;
        }
        class ProviderMicrosoft extends Provider {
            constructor();
        }
        class ProviderCryptopro extends Provider {
            constructor();
            hasPrivateKey(cert: PKI.Certificate): boolean;
        }
        class PkiStore {
            constructor(json: string);
            getCash(): CashJson;
            find(filter?: Filter): IPkiItem[];
            findKey(filter: Filter): IPkiItem;
            /**
             * Возвращает объект из структуры
             */
            getItem(item: PkiItem): any;
            getCerts(): PKI.CertificateCollection;
            addProvider(provider: Provider): void;
            addCert(provider: Provider, category: string, cert: PKI.Certificate, contName?: string, provType?: number): string;
            addCrl(provider: Provider, category: string, crl: PKI.CRL): string;
            deleteCert(provider: Provider, category: string, cert: PKI.Certificate): void;
            deleteCrl(provider: Provider, category: string, crl: PKI.CRL): void;
        }
        class CashJson {
            filenName: string;
            constructor(fileName: string);
            save(fileName: string): any;
            load(fileName: string): any;
            export(): IPkiItem[];
            import(items: IPkiItem[] | PkiItem): any;
        }
        class Filter {
            constructor();
            setType(type: string): void;
            setProvider(provider: string): void;
            setCategory(category: string): void;
            setHash(hash: string): void;
            setSubjectName(subjectName: string): void;
            setSubjectFriendlyName(subjectFriendlyName: string): void;
            setIssuerName(issuerName: string): void;
            setIssuerFriendlyName(issuerFriendlyName: string): void;
            setIsValid(valid: boolean): void;
            setSerial(serial: string): void;
        }
        class PkiItem {
            constructor();
            setFormat(type: string): void;
            setType(type: string): void;
            setProvider(provider: string): void;
            setCategory(category: string): void;
            setURI(category: string): void;
            setHash(hash: string): void;
            setSubjectName(subjectName: string): void;
            setSubjectFriendlyName(subjectFriendlyName: string): void;
            setIssuerName(issuerName: string): void;
            setIssuerFriendlyName(issuerFriendlyName: string): void;
            setSerial(serial: string): void;
            setNotBefore(before: string): void;
            setNotAfter(after: string): void;
            setLastUpdate(lastUpdate: string): void;
            setNextUpdate(nextUpdate: string): void;
            setAuthorityKeyid(authorityKeyid: string): void;
            setCrlNumber(crlNumber: string): void;
            setKey(key: string): void;
            setKeyEncrypted(enc: boolean): void;
            setOrganizationName(organizationName: string): void;
            setSignatureAlgorithm(signatureAlgorithm: string): void;
            setSignatureAlgorithm(signatureAlgorithm: string): void;
            setSignatureDigestAlgorithm(signatureDigestAlgorithm: string): void;
            setPublicKeyAlgorithm(publicKeyAlgorithm: string): void;
        }
    }
}
declare namespace trusted {
    interface IBaseObject {
        handle: any;
    }
    class BaseObject<T> implements IBaseObject {
        static wrap<TIn, TOut extends IBaseObject>(obj: TIn): TOut;
        handle: T;
    }
}
declare namespace trusted.core {
    interface ICollection {
        /**
         * Collection length
         *
         * @type {number}
         * @memberOf ICollection
         */
        length: number;
        /**
         * Return element by index from collection
         *
         * @param {number} index value of [0..n]
         * @returns {*}
         *
         * @memberOf ICollection
         */
        items(index: number): any;
    }
    interface ICollectionWrite extends ICollection {
        /**
         * Add new element to collection
         *
         * @param {*} item
         *
         * @memberOf ICollectionWrite
         */
        push(item: any): void;
        /**
         * Remove last element from collection
         *
         *
         * @memberOf ICollectionWrite
         */
        pop(): void;
        /**
         * Remove element by index from collection
         *
         * @param {number} index
         *
         * @memberOf ICollectionWrite
         */
        removeAt(index: number): void;
    }
}
declare namespace trusted.cms {
    /**
     * Wrap CMS_SignerInfo
     *
     * @export
     * @class Signer
     * @extends {BaseObject<native.CMS.Signer>}
     */
    class Signer extends BaseObject<native.CMS.Signer> {
        /**
         * Creates an instance of Signer.
         *
         * @param {native.CMS.Signer} handle
         *
         * @memberOf Signer
         */
        constructor(nativeHandle?: native.CMS.Signer);
        /**
         * Return signer certificate
         *
         * @type {Certificate}
         * @memberOf Signer
         */
        /**
        * Set signer certificate
        * Error if cert no signer
        *
        * @param cert Certificate
        *
        * @memberOf Signer
        */
        certificate: pki.Certificate;
        /**
         * Return Index
         *
         * @readonly
         * @type {number}
         * @memberOf Signer
         */
        /**
        * Set index certificate
        *
        * @param ind string
        *
        * @memberOf Signer
        */
        index: number;
        /**
         * Return signing time from signed attributes
         *
         * @readonly
         * @type {Date}
         * @memberof Signer
         */
        readonly signingTime: Date;
        /**
        * Return signature algorithm
        *
        * @readonly
        * @type {string}
        * @memberOf Signer
        */
        readonly signatureAlgorithm: string;
        /**
         * Return signature digest algorithm
         *
         * @readonly
         * @type {string}
         * @memberOf Signer
         */
        readonly signatureDigestAlgorithm: string;
        /**
         * Return issuer name
         *
         * @readonly
         * @type {string}
         * @memberOf Signer
         */
        readonly issuerName: string;
        /**
         * Return serial number of certificate
         *
         * @readonly
         * @type {string}
         * @memberOf Signer
         */
        readonly serialNumber: string;
        /**
         * Return time stamp of specified type
         *
         * @type {TSP}
         * @memberOf Signer
         */
        timestamp(tspType: number): pki.TSP;
        /**
         * Verifyes time stamp of specified type from signer
         *
         * @type {boolean}
         * @memberOf Signer
         */
        verifyTimestamp(tspType: number): boolean;
    }
}
declare namespace trusted.cms {
    /**
     * Collection of Signer
     *
     * @export
     * @class SignerCollection
     * @extends {BaseObject<native.CMS.SignerCollection>}
     * @implements {Collection.ICollection}
     */
    class SignerCollection extends BaseObject<native.CMS.SignerCollection> implements core.ICollection {
        /**
         * Creates an instance of SignerCollection.
         *
         * @param {native.CMS.SignerCollection} nativeHandle
         *
         * @memberOf SignerCollection
         */
        constructor(nativeHandle: native.CMS.SignerCollection);
        /**
         * Return element by index from collection
         *
         * @param {number} index
         * @returns {Signer}
         *
         * @memberOf SignerCollection
         */
        items(index: number): Signer;
        /**
         * Return collection length
         *
         * @readonly
         * @type {number}
         * @memberOf SignerCollection
         */
        readonly length: number;
    }
}
declare namespace trusted.cms {
    enum SignedDataContentType {
        url = 0,
        buffer = 1
    }
    interface ISignedDataContent {
        type: SignedDataContentType;
        data: string | Buffer;
    }
    enum StampType {
        stContent = 1,
        stSignature = 2,
        stEscStamp = 4
    }
    class TimestampParams extends BaseObject<native.CMS.TimestampParams> {
        /**
         * Creates an instance of TimestampParams.
         *
         *
         * @memberOf TimestampParams
         */
        constructor();
        /**
         * Return time stamp type
         *
         * @type {StampType}
         * @memberOf TimestampParams
         */
        /**
        * Set time stamp type
        *
        *
        * @memberOf TimestampParams
        */
        stampType: number;
        /**
         * Return connection settings for time stamp service
         *
         * @type {trusted.utils.ConnectionSettings}
         * @memberOf TimestampParams
         */
        /**
        * Set connection settings for time stamp service
        *
        *
        * @memberOf TimestampParams
        */
        connSettings: trusted.utils.ConnectionSettings;
        /**
         * Return time stamp hash algorithm OID
         *
         * @type {String}
         * @memberOf TimestampParams
         */
        /**
        * Set time stamp hash algorithm OID
        *
        *
        * @memberOf TimestampParams
        */
        tspHashAlg: String;
    }
    /**
    * Supported CAdES types
    *
    * @enum {number}
    */
    enum CadesType {
        ctCadesXLT1 = 1
    }
    class CadesParams extends BaseObject<native.CMS.CadesParams> {
        /**
         * Creates an instance of TimestampParams.
         *
         *
         * @memberOf CadesParams
         */
        constructor();
        /**
         * Return time stamp type
         *
         * @type {CadesType}
         * @memberOf CadesParams
         */
        /**
        * Set time stamp type
        *
        *
        * @memberOf CadesParams
        */
        cadesType: number;
        /**
         * Return connection settings for time stamp service
         *
         * @type {trusted.utils.ConnectionSettings}
         * @memberOf CadesParams
         */
        /**
        * Set connection settings for time stamp service
        *
        *
        * @memberOf CadesParams
        */
        connSettings: trusted.utils.ConnectionSettings;
        /**
         * Return time stamp hash algorithm OID
         *
         * @type {String}
         * @memberOf CadesParams
         */
        /**
        * Set time stamp hash algorithm OID
        *
        *
        * @memberOf CadesParams
        */
        tspHashAlg: String;
        /**
         * Return connection settings for OCSP service
         *
         * @type {trusted.utils.ConnectionSettings}
         * @memberOf CadesParams
         */
        /**
        * Set connection settings for time stamp service
        *
        *
        * @memberOf CadesParams
        */
        ocspSettings: trusted.utils.ConnectionSettings;
    }
    /**
     * Wrap CMS_ContentInfo
     *
     * @export
     * @class SignedData
     * @extends {BaseObject<native.CMS.SignedData>}
     */
    class SignedData extends BaseObject<native.CMS.SignedData> {
        /**
         * Load signed data from file location
         *
         * @static
         * @param {string} filename File location
         * @param {DataFormat} [format] PEM | DER
         * @returns {SignedData}
         *
         * @memberOf SignedData
         */
        static load(filename: string, format?: DataFormat): SignedData;
        /**
         * Load signed data from memory
         *
         * @static
         * @param {Buffer} buffer
         * @param {DataFormat} [format=DEFAULT_DATA_FORMAT]
         * @returns {SignedData}
         *
         * @memberOf SignedData
         */
        static import(buffer: Buffer, format?: DataFormat): SignedData;
        private prContent;
        /**
         * Creates an instance of SignedData.
         *
         *
         * @memberOf SignedData
         */
        constructor();
        /**
         * Return content of signed data
         *
         * @type {ISignedDataContent}
         * @memberOf SignedData
         */
        /**
        * Set content v to signed data
        *
        *
        * @memberOf SignedData
        */
        content: ISignedDataContent;
        /**
        * Return sign policys
        *
        * @type {Array<string>}
        * @memberOf SignedData
        */
        /**
        * Set sign policies
        *
        *
        * @memberOf SignedData
        */
        policies: string[];
        /**
         *  Free signed content
         *
         * @returns {void}
         * @memberof SignedData
         */
        freeContent(): void;
        /**
         * Return true if sign detached
         *
         * @returns {boolean}
         *
         * @memberOf SignedData
         */
        isDetached(): boolean;
        /**
         * Return certificates collection or certificate by index (if request)
         *
         * @param {number} [index]
         * @returns {*}
         *
         * @memberOf SignedData
         */
        certificates(index?: number): any;
        /**
        * Return signer by index
        *
        * @param {number} index
        * @returns {Signer}
        *
        * @memberOf SignedData
        */
        signers(index: number): Signer;
        /**
        * Return signers collection
        *
        * @returns {SignerCollection}
        *
        * @memberOf SignedData
        */
        signers(): SignerCollection;
        /**
         * Load sign from file location
         *
         * @param {string} filename File location
         * @param {DataFormat} [format] PEM | DER
         *
         * @memberOf SignedData
         */
        load(filename: string, format?: DataFormat): void;
        /**
         * Load sign from memory
         *
         * @param {Buffer} buffer
         * @param {DataFormat} [format=DEFAULT_DATA_FORMAT] PEM | DER (default)
         *
         * @memberOf SignedData
         */
        import(buffer: Buffer, format?: DataFormat): void;
        /**
         * Save sign to memory
         *
         * @param {DataFormat} [format=DEFAULT_DATA_FORMAT] PEM | DER (default)
         * @returns {Buffer}
         *
         * @memberOf SignedData
         */
        export(format?: DataFormat): Buffer;
        /**
         * Write sign to file
         *
         * @param {string} filename File location
         * @param {DataFormat} [format=DEFAULT_DATA_FORMAT] PEM | DER (default)
         *
         * @memberOf SignedData
         */
        save(filename: string, format: DataFormat): void;
        /**
         * Verify signature
         *
         * @param {Signer} [signer] Certificate
         * @returns {boolean}
         *
         * @memberOf SignedData
         */
        verify(signer?: cms.Signer): boolean;
        /**
         * Return signature creation parameters
         *
         * @type {TimestampParams | CadesParams}
         * @memberOf SignedData
         */
        /**
        * Set signature creation parameters
        *
        *
        * @memberOf SignedData
        */
        signParams: TimestampParams | CadesParams;
        /**
         * Create sign
         *
         * @param {Certificate} [certs] Certificate
         *
         * @memberOf SignedData
         */
        sign(cert: pki.Certificate): void;
    }
}
declare namespace trusted.utils {
    /**
     * cryptographic service provider (CSP) helper
     * Uses on WIN32 or with CPROCSP
     *
     * @export
     * @class Csp
     * @extends {BaseObject<native.UTILS.Csp>}
     */
    class Csp extends BaseObject<native.UTILS.Csp> {
        /**
         * Check available provaider for GOST 2001
         *
         * @static
         * @returns {boolean}
         * @memberof Csp
         */
        static isGost2001CSPAvailable(): boolean;
        /**
         * Check available provaider for GOST 2012-256
         *
         * @static
         * @returns {boolean}
         * @memberof Csp
         */
        static isGost2012_256CSPAvailable(): boolean;
        /**
         * Check available provaider for GOST 2012-512
         *
         * @static
         * @returns {boolean}
         * @memberof Csp
         */
        static isGost2012_512CSPAvailable(): boolean;
        /**
         * Verify license for CryptoPro CSP
         * Throw exception if provaider not available
         *
         * @static
         * @returns {boolean}
         * @memberof Csp
         */
        static checkCPCSPLicense(): boolean;
        /**
         * Return instaled correct license for CryptoPro CSP
         * Throw exception if provaider not available
         *
         * @static
         * @returns {boolean}
         * @memberof Csp
         */
        static getCPCSPLicense(): string;
        /**
         * Return instaled correct version for CryptoPro CSP
         * Throw exception if provaider not available
         *
         * @static
         * @returns {boolean}
         * @memberof Csp
         */
        static getCPCSPVersion(): string;
        static getCPCSPVersionPKZI(): string;
        static getCPCSPVersionSKZI(): string;
        static getCPCSPSecurityLvl(): string;
        /**
                * Enumerate available CSP
                *
                * @static
                * @returns {object[]} {type: nuber, name: string}
                * @memberof Csp
                */
        static enumProviders(): object[];
        /**
         * Enumerate conainers
         *
         * @static
         * @param {number} [type]
         * @returns {string[]} Fully Qualified Container Name
         * @memberof Csp
         */
        static enumContainers(type: null, provName?: string): native.UTILS.IContainerName[];
        /**
         * Get certificate by container and provider props
         *
         * @static
         * @param {string} contName
         * @param {number} provType
         * @param {string} [provName=""]
         * @returns {pki.Certificate}
         * @memberof Csp
         */
        static getCertificateFromContainer(contName: string, provType: number, provName?: string): pki.Certificate;
        static installCertificateFromContainer(contName: string, provType: number, provName?: string): void;
        static installCertificateToContainer(cert: pki.Certificate, contName: string, provType: number, provName?: string): void;
        static deleteContainer(contName: string, provType: number, provName?: string): void;
        /**
         * Get container name by certificate
         *
         * @static
         * @param {pki.Certificate} cert
         * @param {string} [category="MY"]
         * @returns {string}
         * @memberof Csp
         */
        static getContainerNameByCertificate(cert: pki.Certificate, category?: string): string;
        /**
         * Ensure that the certificate's private key is available
         *
         * @static
         * @param {Certificate} cert
         * @returns {boolean}
         * @memberOf Csp
         */
        hasPrivateKey(cert: pki.Certificate): boolean;
        static buildChain(cert: pki.Certificate): pki.CertificateCollection;
        static verifyCertificateChain(cert: pki.Certificate): boolean;
        /**
         * Find certificate in MY store and check that private key exportable
         *
         * @static
         * @param {pki.Certificate} cert
         * @returns {boolean}
         * @memberof Csp
         */
        static isHaveExportablePrivateKey(cert: pki.Certificate): boolean;
        /**
         * Create Pkcs by cert
         * NOTE:  only for certificates with exportable key. Check it by isHaveExportablePrivateKey
         *
         * @static
         * @param {pki.Certificate} cert
         * @param {boolean} exportPrivateKey
         * @param {string} [password]
         * @returns {pki.PKCS12}
         * @memberof Csp
         */
        static certToPkcs12(cert: pki.Certificate, exportPrivateKey: boolean, password?: string): pki.PKCS12;
        /**
         * Import PFX to store
         *
         * @static
         * @param {pki.PKCS12} p12
         * @param {string} [password]
         * @returns {void}
         * @memberof Csp
         */
        static importPkcs12(p12: pki.PKCS12, password?: string): void;
        /**
         * Creates an instance of Csp.
         *
         *
         * @memberOf Csp
         */
        constructor();
    }
}
declare namespace trusted.utils {
    /**
     * ModuleInfo class
     *
     * @export
     * @class ModuleInfo
     * @extends {BaseObject<native.UTILS.ModuleInfo>}
     */
    class ModuleInfo extends BaseObject<native.UTILS.ModuleInfo> {
        /**
         * Return module version
         *
         * @readonly
         * @type {string}
         * @memberOf ModuleInfo
         */
        readonly version: string;
        /**
         * Return module name
         *
         * @readonly
         * @type {string}
         * @memberOf ModuleInfo
         */
        readonly name: string;
        /**
         * Creates an instance of ModuleInfo.
         *
         *
         * @memberOf ModuleInfo
         */
        constructor();
    }
}
declare namespace trusted.utils {
    /**
     * Tools class
     *
     * @export
     * @class Tools
     * @extends {BaseObject<native.UTILS.Tools>}
     */
    class Tools extends BaseObject<native.UTILS.Tools> {
        constructor();
        stringFromBase64(instr: string, flag: number): string;
        stringToBase64(instr: string, flag: number): string;
    }
}
declare namespace trusted.utils {
    /**
     * Download file
     *
     * @param {string} url Url to remote file
     * @param {string} path Path for save in local system
     * @param {Function} done callback function
     */
    function download(url: string, path: string, done: (err: Error, url?: string, path?: string) => void): void;
}
declare namespace trusted.utils {
    /**
     * JSON Web Token (JWT)
     * Uses only with CTGOSTCP
     *
     * @export
     * @class Jwt
     * @extends {BaseObject<native.JWT.Jwt>}
     */
    class Jwt extends BaseObject<native.UTILS.Jwt> {
        /**
         * Creates an instance of Jwt.
         *
         *
         * @memberOf Jwt
         */
        constructor();
        /**
         * Create Header JWT
         * Return 0 if license correct
         *
         * @returns {number}
         *
         * @memberOf Jwt
         */
        createHeader(alg: string): string;
        /**
         * Create Payload JWT
         * Return 0 if license correct
         *
         * @returns {number}
         *
         * @memberOf Jwt
         */
        createPayload(aud: string, sub: string, core: number, nbf: number, iss: string, exp: number, iat: number, jti: string, desc: string): string;
        /**
         * Create JWT Token
         *
         * @returns {number}
         *
         * @memberOf Jwt
         */
        createJWTToken(header: string, payload: string, privateKey: string): string;
        /**
         * Verify JWT Token
         *
         * @returns {number}
         *
         * @memberOf Jwt
         */
        verifyJWTToken(jwtToken: string, publicKey: string): string;
    }
}
declare namespace trusted.utils {
    /**
     * JSON Web Token (DLV)
     * Uses only with CTGOSTCP
     *
     * @export
     * @class Dlv
     * @extends {BaseObject<native.DLV.DLV>}
     */
    class Dlv extends BaseObject<native.UTILS.Dlv> {
        /**
         * Add dlv license to store
         * License must be correct
         *
         * @static
         * @param {string} license license token in DLV format
         * @returns {boolean}
         * @memberof Dlv
         */
        constructor();
        /**
         * Verify dlv license file
         * Return 0 if license correct
         *
         * @returns {number}
         *
         * @memberOf Dlv
         */
        licenseValidateFormat(lic: string): boolean;
        /**
         * Verify dlv license file
         * Return 0 if license correct
         *
         * @returns {number}
         *
         * @memberOf Dlv
         */
        checkLicense(lic: string): string;
    }
}
declare namespace trusted.utils {
    /**
     * JSON Web Token (LICENSE_MNG)
     * Uses only with CTGOSTCP
     *
     * @export
     * @class License_Mng
     * @extends {BaseObject<native.LICENSE_MNG.License_Mng>}
     */
    class License_Mng extends BaseObject<native.UTILS.License_Mng> {
        /**
          * Creates an instance of License_Mng.
          *
          *
          * @memberOf License_Mng
          */
        constructor();
        /**
          * Add license_mng license to store
          * License must be correct
          *
          * @static
          * @param {string} license license token in LICENSE_MNG format
          * @returns {boolean}
          * @memberof License_Mng
          */
        addLicense(lic: string): number;
        /**
          * Add license_mng license to store
          * License must be correct
          *
          * @static
          * @param {string} license license token in LICENSE_MNG format
          * @returns {boolean}
          * @memberof License_Mng
          */
        addLicenseFromFile(lic: string): number;
        /**
         * Delete license_mng license from store
         *
         * @static
         * @param {string} license license token
         * @returns {boolean}
         * @memberof License_Mng
         */
        deleteLicense(lic: string): boolean;
        /**
         * Delete license_mng license from store
         *
         * @static
         * @param {string} license license token
         * @returns {boolean}
         * @memberof License_Mng
         */
        deleteLicenseOfIndex(index: number): boolean;
        /**
         * Delete license_mng license from store
         *
         * @static
         * @param {string} license license token
         * @returns {boolean}
         * @memberof License_Mng
         */
        getCountLicense(): number;
        /**
        * Delete license_mng license from store
        *
        * @static
        * @param {string} license license token
        * @returns {boolean}
        * @memberof License_Mng
        */
        getLicense(index: number): string;
        /**
         * Delete license_mng license from store
         *
         * @static
         * @param {string} license license token
         * @returns {boolean}
         * @memberof License_Mng
         */
        checkLicense(lic: string): string;
        checkLicenseOfIndex(index: number): string;
        accessOperations(): boolean;
        generateTrial(): string;
        checkTrialLicense(): string;
    }
}
declare namespace trusted.utils {
    /**
     * Connection settings for TSP and OCSP
     *
     * @export
     * @class ConnectionSettings
     * @extends {BaseObject<native.UTILS.ConnectionSettings>}
     */
    class ConnectionSettings extends BaseObject<native.UTILS.ConnectionSettings> {
        /**
         * Service authentication type getter
         *
         *
         * @type {number}
         * @memberof ConnectionSettings
         */
        /**
        * Service authentication type setter
        *
        *
        * @type {number}
        * @memberof ConnectionSettings
        */
        AuthType: number;
        /**
         * Service address getter
         *
         *
         * @type {string}
         * @memberof ConnectionSettings
         */
        /**
        * Service address setter
        *
        *
        * @type {string}
        * @memberof ConnectionSettings
        */
        Address: string;
        /**
         * Service user name getter
         *
         *
         * @type {string}
         * @memberof ConnectionSettings
         */
        /**
        * Service user name setter
        *
        *
        * @type {string}
        * @memberof ConnectionSettings
        */
        UserName: string;
        /**
         * Service password getter
         *
         *
         * @type {string}
         * @memberof ConnectionSettings
         */
        /**
        * Service password setter
        *
        *
        * @type {string}
        * @memberof ConnectionSettings
        */
        Password: string;
        /**
         * Client certificate getter
         *
         *
         * @type {pki.Certificate}
         * @memberof ConnectionSettings
         */
        /**
        * Client certificate setter
        *
        *
        * @type {pki.Certificate}
        * @memberof ConnectionSettings
        */
        ClientCertificate: pki.Certificate;
        /**
         * Proxy authentication type getter
         *
         *
         * @type {number}
         * @memberof ConnectionSettings
         */
        /**
        * Proxy authentication type setter
        *
        *
        * @type {number}
        * @memberof ConnectionSettings
        */
        ProxyAuthType: number;
        /**
         * Proxy address getter
         *
         *
         * @type {string}
         * @memberof ConnectionSettings
         */
        /**
        * Proxy address setter
        *
        *
        * @type {string}
        * @memberof ConnectionSettings
        */
        ProxyAddress: string;
        /**
         * Proxy user name getter
         *
         *
         * @type {string}
         * @memberof ConnectionSettings
         */
        /**
        * Proxy user name setter
        *
        *
        * @type {string}
        * @memberof ConnectionSettings
        */
        ProxyUserName: string;
        /**
         * Proxy password getter
         *
         *
         * @type {string}
         * @memberof ConnectionSettings
         */
        /**
        * Proxy password setter
        *
        *
        * @type {string}
        * @memberof ConnectionSettings
        */
        ProxyPassword: string;
        /**
         * Creates an instance of ConnectionSettings.
         *
         *
         * @memberOf ConnectionSettings
         */
        constructor();
    }
}
declare namespace trusted.pki {
    /**
     * Wrap ASN1_OBJECT
     *
     * @export
     * @class Oid
     * @extends {BaseObject<native.PKI.OID>}
     */
    class Oid extends BaseObject<native.PKI.OID> {
        /**
         * Creates an instance of Oid.
         * @param {(native.PKI.OID | string)} param
         *
         * @memberOf Oid
         */
        constructor(param: native.PKI.OID | string);
        /**
         * Return text value for OID
         *
         * @readonly
         * @type {string}
         * @memberOf Oid
         */
        readonly value: string;
        /**
         * Return OID long name
         *
         * @readonly
         * @type {string}
         * @memberOf Oid
         */
        readonly longName: string;
        /**
         * Return OID short name
         *
         * @readonly
         * @type {string}
         * @memberOf Oid
         */
        readonly shortName: string;
    }
}
declare namespace trusted.pki {
    /**
     * Wrap X509_EXTENSION
     *
     * @export
     * @class Extension
     * @extends {BaseObject<native.PKI.Extension>}
     */
    class Extension extends BaseObject<native.PKI.Extension> {
        /**
         * Creates an instance of Extension.
         * @param {native.PKI.OID} [oid]
         * @param {string} [value]
         * @memberof Extension
         */
        constructor(oid?: pki.Oid, value?: string);
        /**
         * Return extension oid
         *
         * @readonly
         * @type {Oid}
         * @memberof Extension
         */
        /**
        * Set extension oid
        *
        * @memberof Extension
        */
        typeId: Oid;
        /**
         * Get critical
         *
         * @type {boolean}
         * @memberof Extension
         */
        /**
        * Set critical
        *
        * @memberof Extension
        */
        critical: boolean;
    }
}
declare namespace trusted.pki {
    /**
     * Collection of Extension
     *
     * @export
     * @class ExtensionCollection
     * @extends {BaseObject<native.PKI.ExtensionCollection>}
     * @implements {core.ICollectionWrite}
     */
    class ExtensionCollection extends BaseObject<native.PKI.ExtensionCollection> implements core.ICollectionWrite {
        /**
         * Creates an instance of ExtensionCollection.
         * @param {native.PKI.ExtensionCollection} [param]
         * @memberof ExtensionCollection
         */
        constructor(param?: native.PKI.ExtensionCollection);
        /**
         * Return element by index from collection
         *
         * @param {number} index
         * @returns {Extension}
         * @memberof ExtensionCollection
         */
        items(index: number): Extension;
        /**
         * Return collection length
         *
         * @readonly
         * @type {number}
         * @memberof ExtensionCollection
         */
        readonly length: number;
        /**
         * Add new element to collection
         *
         * @param {Extension} ext
         * @memberof ExtensionCollection
         */
        push(ext: Extension): void;
        /**
         * Remove last element from collection
         *
         * @memberof ExtensionCollection
         */
        pop(): void;
        /**
         * Remove element by index from collection
         *
         * @param {number} index
         * @memberof ExtensionCollection
         */
        removeAt(index: number): void;
    }
}
declare namespace trusted.pki {
    /**
     * Wrap X509
     *
     * @export
     * @class Certificate
     * @extends {BaseObject<native.PKI.Certificate>}
     */
    class Certificate extends BaseObject<native.PKI.Certificate> {
        /**
         * Load certificate from file
         *
         * @static
         * @param {string} filename File location
         * @param {DataFormat} [format] PEM | DER
         * @returns {Certificate}
         *
         * @memberOf Certificate
         */
        static load(filename: string, format?: DataFormat): Certificate;
        /**
         * Load certificate from memory
         *
         * @static
         * @param {Buffer} buffer
         * @param {DataFormat} [format=DEFAULT_DATA_FORMAT] PEM | DER (default)
         * @returns {Certificate}
         *
         * @memberOf Certificate
         */
        static import(buffer: Buffer, format?: DataFormat): Certificate;
        /**
         * Download certificate
         *
         * @static
         * @param {string[]} urls
         * @param {string} pathForSave File path
         * @param {Function} done callback
         *
         * @memberOf Certificate
         */
        static download(urls: string[], pathForSave: string, done: (err: Error, certificate: Certificate) => void): void;
        /**
         * Creates an instance of Certificate.
         * @param {native.PKI.Certificate | native.PKI.CertificationRequest} [param]
         *
         * @memberOf Certificate
         */
        constructor(param?: native.PKI.Certificate | native.PKI.CertificationRequest);
        /**
         * Return version of certificate
         *
         * @readonly
         * @type {number}
         * @memberOf Certificate
         */
        readonly version: number;
        /**
         * Return serial number of certificate
         *
         * @readonly
         * @type {string}
         * @memberOf Certificate
         */
        /**
        * Return serial number of certificate
        *
        * @readonly
        * @type {string}
        * @memberOf Certificate
        */
        serialNumber: string;
        /**
         * Return type of certificate
         *
         * @readonly
         * @type {number}
         * @memberOf Certificate
         */
        readonly type: number;
        /**
         * Return KeyUsageFlags collection
         *
         * @readonly
         * @type {number}
         * @memberOf Certificate
         */
        readonly keyUsage: number;
        /**
         * Return CN from issuer name
         *
         * @readonly
         * @type {string}
         * @memberOf Certificate
         */
        readonly issuerFriendlyName: string;
        /**
         * Return issuer name
         *
         * @readonly
         * @type {string}
         * @memberOf Certificate
         */
        readonly issuerName: string;
        /**
         * Return CN from subject name
         *
         * @readonly
         * @type {string}
         * @memberOf Certificate
         */
        readonly subjectFriendlyName: string;
        /**
         * Return subject name
         *
         * @readonly
         * @type {string}
         * @memberOf Certificate
         */
        readonly subjectName: string;
        /**
         * Return Not Before date
         *
         * @readonly
         * @type {Date}
         * @memberOf Certificate
         */
        /**
        * Set not before. Use offset in sec
        *
        * @memberof Certificate
        */
        notBefore: Date;
        /**
         * Return Not After date
         *
         * @readonly
         * @type {Date}
         * @memberOf Certificate
         */
        /**
        * Set not after. Use offset in sec
        *
        * @memberof Certificate
        */
        notAfter: Date;
        /**
         * Return SHA-1 thumbprint
         *
         * @readonly
         * @type {string}
         * @memberOf Certificate
         */
        readonly thumbprint: string;
        /**
         * Return signature algorithm
         *
         * @readonly
         * @type {string}
         * @memberOf Certificate
         */
        readonly signatureAlgorithm: string;
        /**
         * Return signature digest algorithm
         *
         * @readonly
         * @type {string}
         * @memberOf Certificate
         */
        readonly signatureDigestAlgorithm: string;
        /**
         * Return public key algorithm
         *
         * @readonly
         * @type {string}
         * @memberOf Certificate
         */
        readonly publicKeyAlgorithm: string;
        /**
         * Return organization name
         *
         * @readonly
         * @type {string}
         * @memberOf Certificate
         */
        readonly organizationName: string;
        /**
         * Return array of OCSP urls
         *
         * @readonly
         * @type {string[]}
         * @memberof Certificate
         */
        readonly OCSPUrls: string[];
        /**
         * Return array of CA issuers urls
         *
         * @readonly
         * @type {string[]}
         * @memberof Certificate
         */
        readonly CAIssuersUrls: string[];
        /**
         * Return true is a certificate is self signed
         *
         * @readonly
         * @type {boolean}
         * @memberof Certificate
         */
        readonly isSelfSigned: boolean;
        /**
         * Return true if it CA certificate (can be used to sign other certificates)
         *
         * @readonly
         * @type {boolean}
         * @memberOf Certificate
         */
        readonly isCA: boolean;
        /**
         * Signs certificate using the given private key
         *
         * @memberof Certificate
         */
        sign(): void;
        /**
         * Compare certificates
         *
         * @param {Certificate} cert Certificate for compare
         * @returns {number}
         *
         * @memberOf Certificate
         */
        compare(cert: Certificate): number;
        /**
         * Compare certificates
         *
         * @param {Certificate} cert Certificate for compare
         * @returns {boolean}
         *
         * @memberOf Certificate
         */
        equals(cert: Certificate): boolean;
        /**
         * Return certificate hash
         *
         * @param {string} [algorithm="sha1"]
         * @returns {String}
         *
         * @memberOf Certificate
         */
        hash(algorithm?: string): string;
        /**
         * Return certificate duplicat
         *
         * @returns {Certificate}
         *
         * @memberOf Certificate
         */
        duplicate(): Certificate;
        /**
         * Load certificate from file location
         *
         * @param {string} filename File location
         * @param {DataFormat} [format]
         *
         * @memberOf Certificate
         */
        load(filename: string, format?: DataFormat): void;
        /**
         * Load certificate from memory
         *
         * @param {Buffer} buffer
         * @param {DataFormat} [format=DEFAULT_DATA_FORMAT]
         *
         * @memberOf Certificate
         */
        import(buffer: Buffer, format?: DataFormat): void;
        /**
         * Save certificate to memory
         *
         * @param {DataFormat} [format=DEFAULT_DATA_FORMAT]
         * @returns {Buffer}
         *
         * @memberOf Certificate
         */
        export(format?: DataFormat): Buffer;
        /**
         * Write certificate to file
         *
         * @param {string} filename File location
         * @param {DataFormat} [format=DEFAULT_DATA_FORMAT] PEM | DER (default)
         *
         * @memberOf Certificate
         */
        save(filename: string, format?: DataFormat): void;
    }
}
declare namespace trusted.pki {
    /**
     * Collection of Certificate
     *
     * @export
     * @class CertificateCollection
     * @extends {BaseObject<native.PKI.CertificateCollection>}
     * @implements {core.ICollectionWrite}
     */
    class CertificateCollection extends BaseObject<native.PKI.CertificateCollection> implements core.ICollectionWrite {
        /**
         * Creates an instance of CertificateCollection.
         * @param {native.PKI.CertificateCollection} [param]
         *
         * @memberOf CertificateCollection
         */
        constructor(param?: native.PKI.CertificateCollection);
        /**
         * Return element by index from collection
         *
         * @param {number} index
         * @returns {Certificate}
         *
         * @memberOf CertificateCollection
         */
        items(index: number): Certificate;
        /**
         * Return collection length
         *
         * @readonly
         * @type {number}
         * @memberOf CertificateCollection
         */
        readonly length: number;
        /**
         * Add new element to collection
         *
         * @param {Certificate} cert
         *
         * @memberOf CertificateCollection
         */
        push(cert: Certificate): void;
        /**
         * Remove last element from collection
         *
         *
         * @memberOf CertificateCollection
         */
        pop(): void;
        /**
         * Remove element by index from collection
         *
         * @param {number} index
         *
         * @memberOf CertificateCollection
         */
        removeAt(index: number): void;
    }
}
declare namespace trusted.pki {
    /**
     * Wrap X509_REQ
     *
     * @export
     * @class CertificationRequest
     * @extends {BaseObject<native.PKI.CertificationRequest>}
     */
    class CertificationRequest extends BaseObject<native.PKI.CertificationRequest> {
        /**
         * Creates an instance of CertificationRequest.
         * @param {native.PKI.CertificationRequest} [param]
         *
         * @memberOf CertificationRequest
         */
        constructor();
        /**
         * Write request to file
         *
         * @param {string} filename File path
         * @param {DataFormat} [dataFormat=DEFAULT_DATA_FORMAT]
         *
         * @memberOf CertificationRequest
         */
        save(filename: string, dataFormat?: DataFormat): void;
        /**
         * Sets the subject of this certification request.
         *
         * @param {string | native.PKI.INameField[]} x509name Example "/C=US/O=Test/CN=example.com"
         *
         * @memberOf CertificationRequest
         */
        subject: string | native.PKI.INameField[];
        /**
         * Rerutn version
         *
         * @readonly
         * @type {number}
         * @memberof CertificationRequest
         */
        /**
        * Set version certificate
        *
        * @param {number} version
        *
        * @memberOf CertificationRequest
        */
        version: number;
        /**
         * Set extensions
         *
         * @param {ExtensionCollection} exts
         *
         * @memberOf CertificationRequest
         */
        extensions: pki.ExtensionCollection;
        /**
         * Rerutn containerName
         *
         * @readonly
         * @type {string}
         * @memberof CertificationRequest
         */
        /**
        * Set containerName
        *
        * @readonly
        * @type {string}
        * @memberof CertificationRequest
        */
        containerName: string;
        /**
         * Rerutn PubKeyAlgorithm
         *
         * @readonly
         * @type {string}
         * @memberof CertificationRequest
         */
        /**
        * Set PubKeyAlgorithm
        *
        * @readonly
        * @type {string}
        * @memberof CertificationRequest
        */
        pubKeyAlgorithm: string;
        /**
         * Rerutn exportableFlag
         *
         * @readonly
         * @type {boolean}
         * @memberof CertificationRequest
         */
        /**
        * Set exportableFlag
        *
        * @readonly
        * @type {boolean}
        * @memberof CertificationRequest
        */
        exportableFlag: boolean;
        /**
         * Rerutn newKeysetFlag
         *
         * @readonly
         * @type {boolean}
         * @memberof CertificationRequest
         */
        /**
        * Set newKeysetFlag
        *
        * @readonly
        * @type {boolean}
        * @memberof CertificationRequest
        */
        newKeysetFlag: boolean;
    }
}
declare namespace trusted.pki {
    /**
     * Wrap CRL
     *
     * @export
     * @class CRL
     * @extends {BaseObject<native.PKI.CRL>}
     */
    class CRL extends BaseObject<native.PKI.CRL> {
        /**
         * Load CRL from file
         *
         * @static
         * @param {string} filename File location
         * @param {DataFormat} [format] PEM | DER
         * @returns {CRL}
         *
         * @memberOf CRL
         */
        static load(filename: string, format?: DataFormat): CRL;
        /**
         * Load CRL from memory
         *
         * @static
         * @param {Buffer} buffer
         * @param {DataFormat} [format=DEFAULT_DATA_FORMAT] PEM | DER (default)
         * @returns {CRL}
         *
         * @memberOf CRL
         */
        static import(buffer: Buffer, format?: DataFormat): CRL;
        /**
         * Creates an instance of CRL.
         * @param {native.PKI.CRL} [param]
         *
         * @memberOf Certificate
         */
        constructor(param?: native.PKI.CRL);
        /**
         * Return version of CRL
         *
         * @readonly
         * @type {number}
         * @memberOf Certificate
         */
        readonly version: number;
        /**
        * Return issuer name
        *
        * @readonly
        * @type {string}
        * @memberOf CRL
        */
        readonly issuerName: string;
        /**
         * Return CN from issuer name
         *
         * @readonly
         * @type {string}
         * @memberOf CRL
         */
        readonly issuerFriendlyName: string;
        /**
         * Return last update date
         *
         * @readonly
         * @type {Date}
         * @memberOf CRL
         */
        readonly lastUpdate: Date;
        /**
         * Return next update date
         *
         * @readonly
         * @type {Date}
         * @memberOf CRL
         */
        readonly nextUpdate: Date;
        /**
         * Return SHA-1 thumbprint
         *
         * @readonly
         * @type {string}
         * @memberOf CRL
         */
        readonly thumbprint: string;
        /**
         * Return signature algorithm
         *
         * @readonly
         * @type {string}
         * @memberOf CRL
         */
        readonly signatureAlgorithm: string;
        /**
         * Return signature digest algorithm
         *
         * @readonly
         * @type {string}
         * @memberOf CRL
         */
        readonly signatureDigestAlgorithm: string;
        /**
         * Return authority keyid
         *
         * @readonly
         * @type {string}
         * @memberOf CRL
         */
        readonly authorityKeyid: string;
        /**
         * Return CRL number
         *
         * @readonly
         * @type {number}
         * @memberOf CRL
         */
        readonly crlNumber: number;
        /**
         * Load CRL from file
         *
         * @param {string} filename File location
         * @param {DataFormat} [format=DEFAULT_DATA_FORMAT] PEM | DER (default)
         *
         * @memberOf CRL
         */
        load(filename: string, format?: DataFormat): void;
        /**
         * Load CRL from memory
         *
         * @param {Buffer} buffer
         * @param {DataFormat} [format=DEFAULT_DATA_FORMAT]
         *
         * @memberOf CRL
         */
        import(buffer: Buffer, format?: DataFormat): void;
        /**
         * Save CRL to memory
         *
         * @param {DataFormat} [format=DEFAULT_DATA_FORMAT]
         * @returns {Buffer}
         *
         * @memberOf CRL
         */
        export(format?: DataFormat): Buffer;
        /**
         * Write CRL to file
         *
         * @param {string} filename File location
         * @param {DataFormat} [dataFormat=DEFAULT_DATA_FORMAT]
         *
         * @memberOf CRL
         */
        save(filename: string, dataFormat?: DataFormat): void;
        /**
         * Compare CRLs
         *
         * @param {CRL} crl CRL for compare
         * @returns {number}
         *
         * @memberOf CRL
         */
        compare(crl: CRL): number;
        /**
         * Compare CRLs
         *
         * @param {CRL} crl CRL for compare
         * @returns {boolean}
         *
         * @memberOf CRL
         */
        equals(crl: CRL): boolean;
        /**
         * Return CRL hash
         *
         * @param {string} [algorithm="sha1"]
         * @returns {String}
         *
         * @memberOf CRL
         */
        hash(algorithm?: string): string;
        /**
         * Return CRL duplicat
         *
         * @returns {CRL}
         *
         * @memberOf CRL
         */
        duplicate(): CRL;
    }
}
declare namespace trusted.pki {
    /**
     * Collection of CRL
     *
     * @export
     * @class CrlCollection
     * @extends {BaseObject<native.PKI.CrlCollection>}
     * @implements {core.ICollectionWrite}
     */
    class CrlCollection extends BaseObject<native.PKI.CrlCollection> implements core.ICollectionWrite {
        /**
         * Creates an instance of CrlCollection.
         * @param {native.PKI.CrlCollection} [param]
         *
         * @memberOf CrlCollection
         */
        constructor(param?: native.PKI.CrlCollection);
        /**
         * Return element by index from collection
         *
         * @param {number} index
         * @returns {CRL}
         *
         * @memberOf CrlCollection
         */
        items(index: number): CRL;
        /**
         * Return collection length
         *
         * @readonly
         * @type {number}
         * @memberOf CrlCollection
         */
        readonly length: number;
        /**
         * Add new element to collection
         *
         * @param {CRL} cert
         *
         * @memberOf CrlCollection
         */
        push(crl: CRL): void;
        /**
         * Remove last element from collection
         *
         *
         * @memberOf CrlCollection
         */
        pop(): void;
        /**
         * Remove element by index from collection
         *
         * @param {number} index
         *
         * @memberOf CrlCollection
         */
        removeAt(index: number): void;
    }
}
declare namespace trusted.pki {
    /**
     * Encrypt and decrypt operations
     *
     * @export
     * @class Cipher
     * @extends {BaseObject<native.PKI.Cipher>}
     */
    class Cipher extends BaseObject<native.PKI.Cipher> {
        /**
         * Creates an instance of Cipher.
         *
         *
         * @memberOf Cipher
         */
        constructor();
        /**
         * Set provider algorithm(GOST)
         *
         * @param method gost2001, gost2012_256 or gost2012_512
         *
         * @memberOf Cipher
         */
        ProvAlgorithm: string;
        /**
         * Encrypt data
         *
         * @param {string} filenameSource This file will encrypted
         * @param {string} filenameEnc File path for save encrypted data
         * @param {DataFormat} [format]
         *
         * @memberOf Cipher
         */
        encrypt(filenameSource: string, filenameEnc: string, format: DataFormat): void;
        /**
         * Decrypt data
         *
         * @param {string} filenameEnc This file will decrypt
         * @param {string} filenameDec File path for save decrypted data
         * @param {DataFormat} [format]
         *
         * @memberOf Cipher
         */
        decrypt(filenameEnc: string, filenameDec: string, format?: DataFormat): void;
        /**
         * Add recipients certificates
         *
         * @param {CertificateCollection} certs
         *
         * @memberOf Cipher
         */
        recipientsCerts: CertificateCollection;
    }
}
declare namespace trusted.pki {
    /**
     * Wrap PKCS12
     *
     * @export
     * @class PKCS12
     * @extends {BaseObject<native.PKI.PKCS12>}
     */
    class PKCS12 extends BaseObject<native.PKI.PKCS12> {
        /**
         * Load PKCS12 from file
         *
         * @static
         * @param {string} filename File location
         * @returns {PKCS12}
         *
         * @memberOf PKCS12
         */
        static load(filename: string): PKCS12;
        /**
         * Creates an instance of PKCS12.
         * @param {native.PKI.PKCS12} [param]
         *
         * @memberOf Certificate
         */
        constructor(param?: native.PKI.PKCS12);
        /**
         * Load PKCS12 from file
         *
         * @param {string} filename File location
         *
         * @memberOf PKCS12
         */
        load(filename: string): void;
        /**
         * Write PKCS12 to file
         *
         * @param {string} filename File location
         *
         * @memberOf PKCS12
         */
        save(filename: string): void;
    }
}
declare namespace trusted.pki {
    enum CPRespStatus {
        successful = 0,
        malformedRequest = 1,
        internalError = 2,
        tryLater = 3,
        sigRequired = 5,
        unauthorized = 6,
        badCRL = 8
    }
    enum CPCertStatus {
        Good = 0,
        Revoked = 1,
        Unknown = 2
    }
    enum CPCrlReason {
        CRLREASON_UNSPECIFIED = 0,
        CRLREASON_KEYCOMPROMISE = 1,
        CRLREASON_CACOMPROMISE = 2,
        CRLREASON_AFFILIATIONCHANGED = 3,
        CRLREASON_SUPERSEDED = 4,
        CRLREASON_CESSATIONOFOPERATION = 5,
        CRLREASON_CERTIFICATEHOLD = 6,
        CRLREASON_REMOVEFROMCRL = 8,
        CRLREASON_PRIVILEDGEWITHDRAWN = 9,
        CRLREASON_AACOMPROMISE = 10
    }
    /**
     * Wrap OCSP Response and request sending
     *
     * @export
     * @class OCSP
     * @extends {BaseObject<native.PKI.OCSP>}
     */
    class OCSP extends BaseObject<native.PKI.OCSP> {
        /**
         * Creates an instance of Ocsp.
         * @param {native.PKI.Certificate | Buffer, native.UTILS.ConnectionSettings?} [param]
         *
         * @memberOf Certificate
         */
        constructor(inData: Certificate | Buffer, connSettings?: trusted.utils.ConnectionSettings);
        Export(): Buffer;
        Verify(): number;
        VerifyCertificate(cert: Certificate): number;
        readonly RespStatus: CPRespStatus;
        readonly SignatureAlgorithmOid: string;
        readonly Certificates: CertificateCollection;
        readonly ProducedAt: string;
        readonly RespNumber: number;
        RespIndexByCert(cert: pki.Certificate, issuer?: pki.Certificate): number;
        readonly OcspCert: pki.Certificate;
        Status(respIdx?: number): CPCertStatus;
        RevTime(respIdx?: number): string;
        RevReason(respIdx?: number): CPCrlReason;
        ThisUpdate(respIdx?: number): string;
        NextUpdate(respIdx?: number): string;
    }
}
declare namespace trusted.pki {
    /**
     * Wrap TSPRequest utility object for hashing data before request sending
     *
     * @export
     * @class TSPRequest
     * @extends {BaseObject<native.PKI.TSPRequest>}
     */
    class TSPRequest extends BaseObject<native.PKI.TSPRequest> {
        /**
         * Creates an instance of Tsp Request.
         * @param {hashAlgOid: string, dataFileName?: string} [param]
         *
         * @memberOf TSPRequest
         */
        constructor(hashAlgOid: string, dataFileName?: string);
        AddData(data: Buffer): void;
        CertReq: boolean;
        Nonce: boolean;
        PolicyId: string;
        HashAlgOid: string;
        DataHash: Buffer;
    }
    /**
     * Wrap TSP timestamp object and request sending
     *
     * @export
     * @class TSP
     * @extends {BaseObject<native.PKI.TSP>}
     */
    class TSP extends BaseObject<native.PKI.TSP> {
        /**
         * Creates an instance of Tsp.
         * @param {Buffer, native.UTILS.ConnectionSettings?} [param]
         *
         * @memberOf TSP
         */
        constructor(inData: trusted.pki.TSPRequest | Buffer | native.PKI.TSP, connSettings?: trusted.utils.ConnectionSettings);
        Export(): Buffer;
        readonly Certificates: CertificateCollection;
        readonly TSACertificate: Certificate;
        Verify(): number;
        VerifyCertificate(cert: Certificate): number;
        readonly FailInfo: number;
        readonly Status: number;
        readonly StatusString: string;
        readonly DataHashAlgOID: string;
        readonly DataHash: Buffer;
        readonly PolicyID: string;
        readonly SerialNumber: Buffer;
        readonly Time: string;
        readonly Accuracy: number;
        readonly Ordering: boolean;
        readonly HasNonce: boolean;
        readonly TsaName: string;
        readonly TsaNameBlob: Buffer;
    }
}
declare namespace trusted.pkistore {
    /**
     * Work with json files
     *
     * @export
     * @class CashJson
     * @extends {BaseObject<native.PKISTORE.CashJson>}
     */
    class CashJson extends BaseObject<native.PKISTORE.CashJson> {
        /**
         * Creates an instance of CashJson.
         *
         * @param {string} fileName File path
         *
         * @memberOf CashJson
         */
        constructor(fileName: string);
        /**
         * Return PkiItems from json
         *
         * @returns {native.PKISTORE.IPkiItem[]}
         *
         * @memberOf CashJson
         */
        export(): native.PKISTORE.IPkiItem[];
        /**
         * Import PkiItems to json
         *
         * @param {native.PKISTORE.IPkiItem[]} items
         *
         * @memberOf CashJson
         */
        import(items: native.PKISTORE.IPkiItem[]): void;
    }
}
declare namespace trusted.pkistore {
    /**
     * Support CryptoPro provider
     *
     * @export
     * @class ProviderCryptopro
     * @extends {BaseObject<native.PKISTORE.ProviderCryptopro>}
     */
    class ProviderCryptopro extends BaseObject<native.PKISTORE.ProviderCryptopro> {
        constructor();
        /**
        * Ensure that the certificate's private key is available
        *
        * @static
        * @param {Certificate} cert
        * @returns {boolean}
        * @memberOf ProviderCryptopro
        */
        hasPrivateKey(cert: pki.Certificate): boolean;
    }
}
declare namespace trusted.pkistore {
    /**
     * Filter for search objects
     *
     * @export
     * @class Filter
     * @extends {BaseObject<native.PKISTORE.Filter>}
     * @implements {native.PKISTORE.IFilter}
     */
    class Filter extends BaseObject<native.PKISTORE.Filter> implements native.PKISTORE.IFilter {
        constructor();
        types: string;
        providers: string;
        categorys: string;
        hash: string;
        subjectName: string;
        subjectFriendlyName: string;
        issuerName: string;
        issuerFriendlyName: string;
        serial: string;
    }
    /**
     * Wrap pki objects (certificate, key, crl, csr)
     *
     * @export
     * @class PkiItem
     * @extends {BaseObject<native.PKISTORE.PkiItem>}
     * @implements {native.PKISTORE.IPkiItem}
     */
    class PkiItem extends BaseObject<native.PKISTORE.PkiItem> implements native.PKISTORE.IPkiItem {
        /**
         * Creates an instance of PkiItem.
         *
         *
         * @memberOf PkiItem
         */
        constructor();
        format: string;
        type: string;
        provider: string;
        category: string;
        uri: string;
        hash: string;
        subjectName: string;
        subjectFriendlyName: string;
        issuerName: string;
        issuerFriendlyName: string;
        serial: string;
        notBefore: string;
        notAfter: string;
        lastUpdate: string;
        nextUpdate: string;
        authorityKeyid: string;
        crlNumber: string;
        key: string;
        keyEnc: boolean;
        organizationName: string;
        signatureAlgorithm: string;
        signatureDigestAlgorithm: string;
        publicKeyAlgorithm: string;
    }
    class PkiStore extends BaseObject<native.PKISTORE.PkiStore> {
        private cashJson;
        /**
         * Creates an instance of PkiStore.
         * @param {(native.PKISTORE.PkiStore | string)} param
         *
         * @memberOf PkiStore
         */
        constructor(param: native.PKISTORE.PkiStore | string);
        /**
         * Return cash json
         *
         * @readonly
         * @type {CashJson}
         * @memberOf PkiStore
         */
        readonly cash: CashJson;
        /**
         * Add provider (system, microsoft | cryptopro)
         *
         * @param {native.PKISTORE.Provider} provider
         *
         * @memberOf PkiStore
         */
        addProvider(provider: native.PKISTORE.Provider): void;
        /**
         * Find items in local store
         *
         * @param {native.PKISTORE.IFilter} [ifilter]
         * @returns {native.PKISTORE.IPkiItem[]}
         *
         * @memberOf PkiStore
         */
        find(ifilter?: native.PKISTORE.IFilter): native.PKISTORE.IPkiItem[];
        /**
         * Find key in local store
         *
         * @param {native.PKISTORE.IFilter} ifilter
         * @returns {native.PKISTORE.IPkiItem}
         *
         * @memberOf PkiStore
         */
        findKey(ifilter: native.PKISTORE.IFilter): native.PKISTORE.IPkiItem;
        /**
         * Return pki object (certificate, crl, request, key) by PkiItem
         *
         * @param {native.PKISTORE.IPkiItem} item
         * @returns {*}
         *
         * @memberOf PkiStore
         */
        getItem(item: native.PKISTORE.IPkiItem): any;
        readonly certs: pki.CertificateCollection;
        /**
        * Import certificste to local store
        *
        * @param {native.PKISTORE.Provider} provider SYSTEM, MICROSOFT, CRYPTOPRO
        * @param {string} category MY, OTHERS, TRUST, CRL
        * @param {Certificate} cert Certificate
        * @param {string} [contName] optional set container name
        * @param {number} [provType]
        * @returns {string}
        *
        * @memberOf PkiStore
        */
        addCert(provider: native.PKISTORE.Provider, category: string, cert: pki.Certificate, contName?: string, provType?: number): string;
        /**
        * Import CRL to local store
        *
        * @param {native.PKISTORE.Provider} provider SYSTEM, MICROSOFT, CRYPTOPRO
        * @param {string} category MY, OTHERS, TRUST, CRL
        * @param {CRL} crl CRL
        * @returns {string}
        *
        * @memberOf PkiStore
        */
        addCrl(provider: native.PKISTORE.Provider, category: string, crl: pki.CRL): string;
        /**
        * Delete certificste from store
        *
        * @param {native.PKISTORE.Provider} provider SYSTEM, MICROSOFT, CRYPTOPRO
        * @param {string} category MY, OTHERS, TRUST, CRL
        * @param {Certificate} cert Certificate
        * @returns
        *
        * @memberOf PkiStore
        */
        deleteCert(provider: native.PKISTORE.Provider, category: string, cert: pki.Certificate): void;
        /**
        * Delete CRL from store
        *
        * @param {native.PKISTORE.Provider} provider
        * @param {string} category
        * @param {pki.Crl} crl
        * @returns {void}
        * @memberof PkiStore
        */
        deleteCrl(provider: native.PKISTORE.Provider, category: string, crl: pki.CRL): void;
    }
}
declare namespace trusted {
    /**
     *
     * @export
     * @enum {number}
     */
    enum LoggerLevel {
        NULL = 0,
        ERROR = 1,
        WARNING = 2,
        INFO = 4,
        DEBUG = 8,
        TRACE = 16,
        CryptoPro = 32,
        ALL = 63
    }
}
declare namespace trusted.common {
    /**
     * Wrap logger class
     *
     * @export
     * @class Logger
     * @extends {BaseObject<native.COMMON.Logger>}
     */
    class Logger extends BaseObject<native.COMMON.Logger> {
        /**
         * Start write log to a file
         *
         * @static
         * @param {string} filename
         * @param {LoggerLevel} [level=DEFAULT_LOGGER_LEVEL]
         * @returns {Logger}
         *
         * @memberOf Logger
         */
        static start(filename: string, level?: LoggerLevel): Logger;
        /**
         * Creates an instance of Logger.
         *
         * @memberOf Logger
         */
        constructor();
        /**
         * Start write log to a file
         *
         * @param {string} filename
         * @param {LoggerLevel} [level=DEFAULT_LOGGER_LEVEL]
         * @returns {void}
         *
         * @memberOf Logger
         */
        start(filename: string, level?: LoggerLevel): void;
        /**
         * Stop write log file
         *
         * @returns {void}
         *
         * @memberOf Logger
         */
        stop(): void;
        /**
         * Clean exsisting log file
         *
         * @returns {void}
         *
         * @memberOf Logger
         */
        clear(): void;
    }
}
declare module "trusted-crypto" {
    export = trusted;
}
