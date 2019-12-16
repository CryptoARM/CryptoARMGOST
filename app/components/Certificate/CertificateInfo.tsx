import PropTypes from "prop-types";
import React from "react";
import { localizeAlgorithm } from "../../i18n/localize";

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
}

interface ICertificateInfoProps {
  certificate: IX509Certificate;
}

export default class CertificateInfo extends React.Component<ICertificateInfoProps, any> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  render() {
    const { localize, locale } = this.context;
    const { certificate } = this.props;
    const PRIV_KEY = certificate.key && certificate.key.length > 0 ? localize("Certificate.present", locale) : localize("Certificate.absent", locale);
    return (
      <div className="collection cert-info-list">
        <div className="collection-item certs-collection certificate-info">
          <div className="caption-text">{localize("Certificate.subject", locale)}</div>
          <div className="collection-title selectable-text">{certificate.subjectFriendlyName}</div>
        </div>
        <div className="collection-item certs-collection certificate-info">
          <div className="caption-text">{localize("Certificate.issuer_name", locale)}</div>
          <div className="collection-title selectable-text">{certificate.issuerFriendlyName}</div>
        </div>
        <div className="collection-item certs-collection certificate-info">
          <div className="caption-text">{localize("Certificate.organization", locale)}</div>
          <div className="collection-title selectable-text">{certificate.organizationName}</div>
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
          <div className="collection-title selectable-text">{localizeAlgorithm(certificate.signatureAlgorithm, locale)}</div>
        </div>
        <div className="collection-item certs-collection certificate-info">
          <div className="caption-text">{localize("Certificate.signature_digest_algorithm", locale)}</div>
          <div className="collection-title selectable-text">{localizeAlgorithm(certificate.signatureDigestAlgorithm, locale)}</div>
        </div>
        <div className="collection-item certs-collection certificate-info">
          <div className="caption-text">{localize("Certificate.public_key_algorithm", locale)}</div>
          <div className="collection-title selectable-text">{localizeAlgorithm(certificate.publicKeyAlgorithm, locale)}</div>
        </div>
        <div className="collection-item certs-collection certificate-info">
          <div className="caption-text">{localize("Certificate.thumbprint", locale)}</div>
          <div className="collection-title selectable-text">{certificate.hash}</div>
        </div>
        <div className="collection-item certs-collection certificate-info">
          <div className="caption-text">{localize("Certificate.priv_key", locale)}</div>
          <div className="collection-title selectable-text">{PRIV_KEY}</div>
        </div>
      </div>
    );
  }
}
