import PropTypes from "prop-types";
import React from "react";
import CertificateItem from "../CA/CertificateItem";

export interface IService {
  name: string;
  url: string;
  field: string;
  login: string;
  password: string;
  email: string;
  keyPhrase: string;
  comment: string;
}

interface IServiceInfoProps {
  certificate: any;
  service: IService;
}

interface IServiceInfoState {
  passwordIsMasked: boolean;
}

export default class ServiceInfo extends React.Component<IServiceInfoProps, IServiceInfoState> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  constructor(props: IServiceInfoProps) {
    super(props);

    this.state = {
      passwordIsMasked: true,
    };
  }

  render() {
    const { localize, locale } = this.context;
    const { service, certificate } = this.props;
    const { passwordIsMasked } = this.state;

    return (
      <React.Fragment>
        <div className="col s12">
          <div className="primary-text">{localize("Services.services_connection_options", locale)}</div>
          <hr />
        </div>

        <div className="col s12">
          <div className="collection cert-info-list">
            <div className="collection-item certs-collection certificate-info">
              <div className="caption-text">{localize("Services.name", locale)}</div>
              <div className={"collection-title selectable-text"}>{service.name}</div>
            </div>
            <div className="collection-item certs-collection certificate-info">
              <div className="caption-text">{localize("Services.adress", locale)}</div>
              <div className={"collection-title selectable-text"}>{service.settings.url}</div>
            </div>
          </div>
        </div>
        <div className="row" />

        <div className="col s12">
          <div className="primary-text">{localize("Services.services_login_option", locale)}</div>
          <hr />
        </div>

        <div className="col s12">
          <div className="collection cert-info-list">
            {
              certificate ?
                null :
                <React.Fragment>
                  <div className="collection-item certs-collection certificate-info">
                    <div className="caption-text">{localize("Services.login", locale)}</div>
                    <div className="collection-title selectable-text">{service.login}</div>
                  </div>

                  <div className="collection-item certs-collection certificate-info">
                    <div className="col s11" style={{ padding: 0 }}>
                      <div className="caption-text">{localize("Services.password", locale)}</div>
                      <div className={`collection-title selectable-text ${passwordIsMasked ? "text-security" : ""}`}>{service.password}</div>
                    </div>
                    <div className="col s1">
                      <i className="file-setting-item waves-effect material-icons secondary-content"
                        onClick={(event) => {
                          event.stopPropagation();
                          this.togglePasswordMask();
                        }}>visibility</i>
                    </div>
                  </div>
                </React.Fragment>
            }
            {
              certificate ?
                <div className="collection-item certs-collection certificate-info">
                  <div className="col s12" style={{ padding: 0 }}>
                    <div className="caption-text">{localize("Services.certificate", locale)}</div>
                    <CertificateItem certificate={certificate} style={{ padding: 0 }} />
                  </div>
                </div> :
                null
            }
          </div>
        </div>

        <div className="row" />

        <div className="col s12">
          <div className="primary-text">{localize("Services.services_user_profile_inf", locale)}</div>
          <hr />
        </div>

        <div className="col s12">
          <div className="collection cert-info-list">
            <div className="collection-item certs-collection certificate-info">
              <div className="caption-text">{localize("Services.email", locale)}</div>
              <div className="collection-title">{service.email}</div>
            </div>
            <div className="collection-item certs-collection certificate-info">
              <div className="caption-text">{localize("Services.key_information", locale)}</div>
              <div className="collection-title">{service.keyPhrase}</div>
            </div>
            <div className="collection-item certs-collection certificate-info">
              <div className="caption-text">{localize("Services.comment", locale)}</div>
              <div className="collection-title selectable-text">{service.comment}</div>
            </div>
          </div>
        </div>
        <div className="row" />
      </React.Fragment>
    );
  }

  togglePasswordMask = () => {
    this.setState({ passwordIsMasked: !this.state.passwordIsMasked });
  }
}
