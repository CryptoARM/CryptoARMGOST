import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";
import { loadAllCertificates, removeAllCertificates } from "../../AC";
import { getCertRequest, getCertRequestAuthCert, getCertRequestStatus,
  getCertRequestStatusAuthCert, postCertRequestСonfirmation, postCertRequestСonfirmationAuthCert } from "../../AC/caActions";
import { MY, PROVIDER_CRYPTOPRO, REQUEST_STATUS } from "../../constants";
import { filteredRequestCASelector } from "../../selectors/requestCASelector";
import { ICertificateRequestCA, IRegRequest, IService } from "../Services/types";

interface IRequestCAInfoProps {
  requestCA: any;
  certrequest: ICertificateRequestCA;
  service: IService;
  regrequest: IRegRequest;
  getCertRequestStatus: (url: string, certRequest: ICertificateRequestCA, regRequest: IRegRequest) => void;
  getCertRequestStatusAuthCert: (url: string, certRequest: ICertificateRequestCA, regRequest: IRegRequest) => void;
  getCertRequest: (url: string, certRequest: ICertificateRequestCA, regRequest: IRegRequest) => void;
  getCertRequestAuthCert: (url: string, certRequest: ICertificateRequestCA, regRequest: IRegRequest) => void;
  postCertRequestСonfirmation: (url: string, certificateRequestCA: ICertificateRequestCA, regRequest: IRegRequest) => void;
  postCertRequestСonfirmationAuthCert: (url: string, certificateRequestCA: ICertificateRequestCA, regRequest: IRegRequest) => void;
  handleReloadCertificates: () => void;
}

class RequestCAInfo extends React.Component<IRequestCAInfoProps, any> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  componentDidMount() {
    // tslint:disable-next-line: no-shadowed-variable
    const { getCertRequestStatus, getCertRequestStatusAuthCert } = this.props;
    const { certrequest, service, regrequest } = this.props;

    if (!service || !service.settings || !service.settings.url) {
      return;
    }

    if (certrequest.status !== REQUEST_STATUS.K) {
      if (regrequest.certThumbprint) {
        getCertRequestStatusAuthCert(`${service.settings.url}`, certrequest, regrequest);
      } else {
        getCertRequestStatus(`${service.settings.url}`, certrequest, regrequest);
      }
    }
  }

  componentDidUpdate(prevProps: any) {
    // tslint:disable-next-line: no-shadowed-variable
    const { getCertRequest, getCertRequestAuthCert, postCertRequestСonfirmation, postCertRequestСonfirmationAuthCert } = this.props;
    const { certrequest, service, regrequest, handleReloadCertificates } = this.props;
    const { localize, locale } = this.context;

    if (!service || !service.settings || !service.settings.url) {
      return;
    }

    if ((certrequest.status !== prevProps.certrequest.status) && (certrequest.status === REQUEST_STATUS.C)) {
      if (regrequest.certThumbprint) {
        getCertRequestAuthCert(`${service.settings.url}`, certrequest, regrequest);
      } else {
        getCertRequest(`${service.settings.url}`, certrequest, regrequest);
      }
    }

    if ((certrequest.status === REQUEST_STATUS.C) &&
        (certrequest.certificate !== prevProps.certrequest.certificate) &&
        (certrequest.certificate)) {

      const cert = new trusted.pki.Certificate();
      cert.import(new Buffer(certrequest.certificate), trusted.DataFormat.PEM);
      const containerName = trusted.utils.Csp.getContainerNameByCertificate(cert);
      window.PKISTORE.importCertificate(cert, PROVIDER_CRYPTOPRO, (err: Error) => {
        if (err) {
          Materialize.toast(localize("Certificate.cert_import_failed", locale), 2000, "toast-cert_import_error");
        } else {
          Materialize.toast(localize("Certificate.cert_import_ok", locale), 2000, "toast-cert_imported");
        }
      }, MY, containerName);

      try {
        trusted.utils.Csp.installCertificateToContainer(cert, containerName, 75);
      } catch (e) {
        //
      }
      if (regrequest.certThumbprint) {
        postCertRequestСonfirmationAuthCert(`${service.settings.url}`, certrequest, regrequest);
      } else {
        postCertRequestСonfirmation(`${service.settings.url}`, certrequest, regrequest);
      }
      handleReloadCertificates();
    }
  }

  render() {
    const { localize, locale } = this.context;
    const { certrequest } = this.props;

    return (
      <React.Fragment>
        <div className="col s12">
          <div className="primary-text">{localize("CA.request_status", locale)}</div>
          <hr />
        </div>

        <div className="col s12">
          <div className="collection cert-info-list">
            <div className="collection-item certs-collection certificate-info">
              <div className="caption-text">{localize("CA.current_status", locale)}</div>
              <div className="collection-title selectable-text">{localize(`CARequestStatus.${certrequest.status}`, locale)}</div>
            </div>
          </div>
        </div>

        <div className="row" />

        <div className="col s12">
          <div className="primary-text">{localize("CA.request_info", locale)}</div>
          <hr />
        </div>

        <div className="col s12">
          <div className="collection cert-info-list">
            {this.getRequestInfo()}
          </div>
        </div>
      </React.Fragment>
    );
  }

  getRequestInfo = () => {
    const { certrequest } = this.props;
    const { localize, locale } = this.context;

    if (!certrequest || !certrequest.subject || !certrequest.subject.length) {
      return null;
    }

    return certrequest.subject.map((field: any) => {
      const type = localize(`OIDs.${field.type}`, locale);
      return (
        <div key={field.type} className="collection-item certs-collection certificate-info">
          <div className="caption-text">{type ? type : field.type}</div>
          <div className="collection-title selectable-text">{field.value ? field.value : "-"}</div>
        </div>
      );
    });
  }
}

export default connect((state, ownProps) => {
  const certrequests = filteredRequestCASelector(state);
  const certrequest = certrequests.find((obj: any) => obj.get("id") === ownProps.requestCA.id);
  const services = state.services.entities;
  const service = services.find((obj: any) => obj.get("id") === certrequest.serviceId);
  const regrequests = state.regrequests.entities;
  const regrequest = regrequests.find((obj: any) => obj.get("serviceId") === certrequest.serviceId);
  return {
    certificateLoading: state.certificates.loading,
    certrequest,
    certrequests,
    regrequest,
    regrequests,
    service,
    services,
  };
}, {
  getCertRequest, getCertRequestAuthCert, getCertRequestStatus, getCertRequestStatusAuthCert,
  loadAllCertificates, postCertRequestСonfirmation, postCertRequestСonfirmationAuthCert, removeAllCertificates,
})(RequestCAInfo);
