import PropTypes from "prop-types";
import React from "react";
import { localizeAlgorithm } from "../../i18n/localize";
import NameInfo from "./NameInfo";

export interface IX509Certificate {
  format: string;
  type: string;
  category: string;
  provider: string;
  uri: string;
  version: string;
  hash: string;
  serial: string;
  serialNumber: string;
  notAfter: Date;
  notBefore: string;
  subjectName: string;
  issuerName: string;
  subjectFriendlyName: string;
  issuerFriendlyName: string;
  organizationName: string;
  status: boolean;
  signatureAlgorithm: string;
  signatureDigestAlgorithm: string;
  publicKeyAlgorithm: string;
  privateKey: boolean;
  active: boolean;
  key: string;
  object?: trusted.pki.Certificate;
}

interface ICertificateInfoProps {
  certificate: IX509Certificate;
}

export default class CertificateInfo extends React.Component<ICertificateInfoProps, any> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };
  constructor(props: any) {
    super(props);
    this.state = ({
      chain: [],
    });
  }

  componentDidMount() {
    const { certificate } = this.props;

    if (certificate) {
      const chain = this.buildChain(certificate);

      this.setState({ chain });
    }
  }

  componentDidUpdate(prevProps: ICertificateInfoProps) {
    if (this.props.certificate && prevProps.certificate && this.props.certificate.hash !== prevProps.certificate.hash) {
      const { certificate } = this.props;

      const chain = this.buildChain(certificate);

      this.setState({ chain });
    }
  }

  render() {
    const { localize, locale } = this.context;
    const { certificate } = this.props;
    const signatureAlgorithm = localize(`OIDs.${certificate.signatureAlgorithm}`, locale);
    const signatureDigestAlgorithm = localize(`OIDs.${certificate.signatureDigestAlgorithm}`, locale);
    const publicKeyAlgorithm = localize(`OIDs.${certificate.publicKeyAlgorithm}`, locale);

    if (!certificate) {
      return null;
    }

    const PRIV_KEY = certificate.key && certificate.key.length > 0 ? localize("Certificate.present", locale) : localize("Certificate.absent", locale);
    return (
      <div className="collection cert-info-list">
        <div className="collection-item certs-collection certificate-info">
          <div className="caption-text">{localize("Certificate.subject", locale)}</div>
          <NameInfo name={certificate.subjectName} />
        </div>
        <div className="collection-item certs-collection certificate-info">
          <div className="caption-text">{localize("Certificate.issuer_name", locale)}</div>
          <div className="collection-title selectable-text">{certificate.issuerFriendlyName}</div>
          {
            this.isMinsvyazRoot() ?
              <React.Fragment>               
                <div className="collection-title selectable-text valid">{localize("Certificate.accredited", locale)}</div>
              </React.Fragment>
            :null
          }
        </div>
        <div className="collection-item certs-collection certificate-info">
          <div className="caption-text">{localize("Certificate.cert_valid", locale)}</div>
          <div className="collection-title selectable-text">{(new Date(certificate.notAfter)).toLocaleDateString(locale, {
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            month: "long",
            year: "numeric",
          })}</div>
        </div>
        <div className="collection-item certs-collection certificate-info">
          <div className="caption-text">{localize("Certificate.serialNumber", locale)}</div>
          <div className="collection-title selectable-text">{certificate.serial ? certificate.serial : certificate.serialNumber}</div>
        </div>
        <div className="collection-item certs-collection certificate-info">
          <div className="caption-text">{localize("Sign.alg", locale)}</div>
          <div className="collection-title selectable-text">{signatureAlgorithm ? signatureAlgorithm : certificate.signatureAlgorithm}</div>
        </div>

        <div className="collection-item certs-collection certificate-info">
          <div className="caption-text">{localize("Certificate.public_key_algorithm", locale)}</div>
          <div className="collection-title selectable-text">{publicKeyAlgorithm ? publicKeyAlgorithm : certificate.publicKeyAlgorithm}</div>
        </div>
        <div className="collection-item certs-collection certificate-info">
          <div className="caption-text">{localize("Certificate.signature_digest_algorithm", locale)}</div>
          <div className="collection-title selectable-text">{signatureDigestAlgorithm ? signatureDigestAlgorithm : certificate.signatureDigestAlgorithm}</div>
        </div>
        <div className="collection-item certs-collection certificate-info">
          <div className="caption-text">{localize("Certificate.thumbprint", locale)}</div>
          <div className="collection-title selectable-text">{certificate.hash}</div>
        </div>
        {this.getKeyUsage()}
        <div className="collection-item certs-collection certificate-info">
          <div className="caption-text">{localize("Certificate.priv_key", locale)}</div>
          <div className="collection-title selectable-text">{PRIV_KEY}</div>
        </div>
      </div>
    );
  }
  isMinsvyazRoot = () => {
    const { chain } = this.state;

    if (chain && chain.length) {
      const rootCertInChain = chain.items(chain.length - 1);

      if (rootCertInChain && rootCertInChain.thumbprint.toLowerCase() === "4BC6DC14D97010C41A26E058AD851F81C842415A".toLowerCase()) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  buildChain = (certItem: any) => {
    let certificate = certItem.object ? certItem.object : null;
    if (certificate === null) {
      if (certItem.x509) {
        try {
          certificate = trusted.pki.Certificate.import(Buffer.from(certItem.x509), trusted.DataFormat.PEM);
        } catch (e) {
          return null;
        }
      } else {
        certificate = window.PKISTORE.getPkiObject(certItem);
      }
    }

    try {
      return trusted.utils.Csp.buildChain(certificate);
    } catch (e) {
      return null;
    }
  }

  getKeyUsage = () => {
    const { localize, locale } = this.context;
    const { certificate } = this.props;

    if (!certificate) {
      return null;
    }

    const x509: trusted.pki.Certificate = certificate.object &&
      certificate.object instanceof trusted.pki.Certificate ?
      certificate.object : window.PKISTORE.getPkiObject(certificate);

    if (x509) {
      const keyUsageString = x509.keyUsageString;

      if (keyUsageString && keyUsageString.length) {
        return (
          <div className="collection-item certs-collection certificate-info">
            <div className="caption-text">{localize("Certificate.key_usage", locale)}</div>
            <div className="collection-title selectable-text">{x509.keyUsageString.join(", ")}</div>
          </div>
        );
      } else {
        return null;
      }
    } else {
      return null;
    }
  }
}
