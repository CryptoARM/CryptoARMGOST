import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";
import { deleteDssCertificate } from "../../AC/dssActions";
import { USER_NAME } from "../../constants";
import logger from "../../winstonLogger";

interface ICertificateDeleteProps {
  certificate: any;
  certificates: any[];
  deleteDssCertificate: (id: string, dssUserID: string) => void;
  onCancel?: () => void;
  reloadCertificates: () => void;
  reloadContainers: () => void;
  resetCertVerified: () => void;
}

interface ICertificateDeleteState {
  container: string;
  deleteContainer: boolean;
}

class CertificateDelete extends React.Component<ICertificateDeleteProps, ICertificateDeleteState> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  constructor(props: ICertificateDeleteProps) {
    super(props);

    this.state = ({
      container: "",
      deleteContainer: false,
    });
  }

  componentDidMount() {
    const { certificate } = this.props;

    if (certificate && !certificate.dssUserID) {
      const container = this.getContainerByCertificate(certificate);
      this.setState({ container });
    }
  }

  componentWillUnmount() {
    this.handelCancel();
  }

  render() {
    const { container, deleteContainer } = this.state;
    const { localize, locale } = this.context;

    const body = container ?
      (
        <div className="row">
          <div className="input-field col s12">
            <input
              name="groupDelCont"
              type="checkbox"
              id="delCont"
              className="checkbox-red"
              checked={deleteContainer}
              onClick={this.toggleDeleteContainer}
            />
            <label htmlFor="delCont">{localize("Containers.delete_container", locale)}</label>
          </div>
        </div>
      ) :
      (
        <div className="col s12">
          <span className="card-infos sub">
            {localize("Certificate.realy_delete_certificate", locale)}
          </span>
        </div>
      );

    return (
      <React.Fragment>
        <div className="row halftop">
          <div className="col s12">
            <div className="content-wrapper tbody border_group">
              {body}
            </div>
          </div>
        </div>

        <div className="row halfbottom" />

        <div className="row halfbottom">
          <div style={{ float: "right" }}>
            <div style={{ display: "inline-block", margin: "10px" }}>
              <a className="btn btn-text waves-effect waves-light modal-close" onClick={this.handelCancel}>{localize("Common.cancel", locale)}</a>
            </div>
            <div style={{ display: "inline-block", margin: "10px" }}>
              <a className="btn btn-outlined waves-effect waves-light modal-close" onClick={this.handleDeleteCertificateAndContainer}>{localize("Common.delete", locale)}</a>
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  }

  handelCancel = () => {
    const { onCancel } = this.props;

    if (onCancel) {
      onCancel();
    }
  }

  toggleDeleteContainer = () => {
    this.setState({ deleteContainer: !this.state.deleteContainer });
  }

  handleDeleteCertificateAndContainer = () => {
    // tslint:disable-next-line:no-shadowed-variable
    const { certificate, certificates, deleteDssCertificate, reloadCertificates, reloadContainers, resetCertVerified } = this.props;
    const { container, deleteContainer } = this.state;
    const { localize, locale } = this.context;

    if (!certificate) {
      return;
    }

    if (container && deleteContainer) {
      try {
        trusted.utils.Csp.deleteContainer(container, 75);

        $(".toast-container_delete_ok").remove();
        Materialize.toast(localize("Containers.container_delete_ok", locale), 2000, "toast-container_delete_ok");

        logger.log({
          certificate: "",
          level: "info",
          message: "",
          operation: "Удаление контейнера",
          operationObject: {
            in: container,
            out: "Null",
          },
          userName: USER_NAME,
        });

        reloadContainers();
      } catch (err) {
        $(".toast-container_delete_failed").remove();
        Materialize.toast(localize("Containers.container_delete_failed", locale), 2000, "toast-container_delete_failed");

        logger.log({
          certificate: "",
          level: "error",
          message: err.message ? err.message : err,
          operation: "Удаление контейнера",
          operationObject: {
            in: container,
            out: "Null",
          },
          userName: USER_NAME,
        });
        this.handelCancel();
      }
    }

    if (certificate.dssUserID) {
      deleteDssCertificate(certificate.id, certificate.dssUserID);

      logger.log({
        certificate: certificate.subjectName,
        level: "info",
        message: "",
        operation: "Удаление сертификата",
        operationObject: {
          in: "CN=" + certificate.subjectFriendlyName,
          out: "Null",
        },
        userName: USER_NAME,
      });
    } else if (!window.PKISTORE.deleteCertificate(certificate)) {
      $(".toast-cert_delete_failed").remove();
      Materialize.toast(localize("Certificate.cert_delete_failed", locale), 2000, "toast-cert_delete_failed");
      this.handelCancel();
      return;
    }
    resetCertVerified();
    reloadCertificates();
    $(".toast-cert_delete_ok").remove();
    Materialize.toast(localize("Certificate.cert_delete_ok", locale), 2000, "toast-cert_delete_ok");
  }

  getContainerByCertificate = (certificate: any) => {
    let container = "";

    if (certificate.category === "MY" && certificate.key) {
      try {
        const x509 = window.PKISTORE.getPkiObject(certificate);
        container = trusted.utils.Csp.getContainerNameByCertificate(x509);
      } catch (e) {
        // console.log("error get container by certificate", e);
      }
    }

    return container;
  }
}

export default connect((state) => ({
  certificates: state.certificates.entities,
}), { deleteDssCertificate })(CertificateDelete);
