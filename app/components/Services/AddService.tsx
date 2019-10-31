import { Map } from "immutable";
import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";
import { getRegRequest, postRegRequest } from "../../AC/caActions";
import { addService } from "../../AC/servicesActions";
import { CA_SERVICE } from "../../constants";
import { uuid, validateInn, validateOgrn, validateOgrnip, validateSnils } from "../../utils";
import CryptoProCASettings from "../CA/CryptoProCASettings";
import DynamicRegistrationForm from "../CA/DynamicRegistrationForm";
import LoginForm from "../CA/LoginForm";
import { ICAServiceSettings, IService } from "./types";

const REQULAR_EXPRESSION = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;

interface IAddServiceState {
  activeSettingsTab: boolean;
  disableSecondStep: boolean;
  comment: string;
  description: string;
  email: string;
  formVerified: boolean;
  isUserattrLoading: boolean;
  keyPhrase: string;
  login: string;
  password: string;
  regNewUser: boolean;
  serviceName: string;
  serviceType: "CA_SERVICE";
  serviceSettings: ICAServiceSettings;
  RDNmodel: any;
}

const initialState = {
  activeSettingsTab: true,
  comment: "",
  description: "",
  disableSecondStep: false,
  email: "",
  formVerified: false,
  isUserattrLoading: false,
  keyPhrase: "",
  login: "",
  password: "",
  regNewUser: true,
  serviceName: "КриптоПро УЦ 2.0",
  serviceSettings: {
    url: "",
  },
  serviceType: CA_SERVICE,
  RDNmodel: null,
};

interface IAddServiceProps {
  addService: (service: IService) => void;
  mapServices: Map<any, any>;
  onCancel: (service?: IService) => void;
  getRegRequest: (url: string, login: string, password: string, service: IService) => void;
  postRegRequest: (url: string, comment: string, description: string, email: string, keyPhrase: string, oids: any, service: IService) => void;
}

class AddService extends React.Component<IAddServiceProps, IAddServiceState> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  constructor(props: IAddServiceProps) {
    super(props);

    this.state = { ...initialState };
  }

  componentDidMount() {
    Materialize.updateTextFields();
  }

  componentDidUpdate() {
    Materialize.updateTextFields();
  }

  componentWillUnmount() {
    this.handelCancel();
  }

  render() {
    const { localize, locale } = this.context;
    const { activeSettingsTab, disableSecondStep, regNewUser, serviceType, serviceSettings } = this.state;

    const disabledSecondStep = disableSecondStep ? "disabled" : "";

    return (
      <div className="add_new_service_modal">
        <div className="row halftop">
          <div className="col s12">
            <div className="content-wrapper tbody  border_group" style={{
              boxshadow: "0 0 0 1px rgb(227, 227, 228)",
              height: "400px",
              overflow: "auto",
            }}>
              {
                activeSettingsTab ?
                  <div className="row">
                    <div className="row">
                      <div className="col s12">
                        <p className="label-csr">
                          {localize("Services.service_type", locale)}
                        </p>
                        <form action="#">
                          <p>
                            <input name="serviceType" type="radio"
                              checked={serviceType === CA_SERVICE}
                              id={CA_SERVICE}
                              onClick={() => this.handleChangeServiceType(CA_SERVICE)} />
                            <label htmlFor={CA_SERVICE}>
                              {localize("CA.cryptopro_ca", locale)}
                            </label>
                          </p>
                        </form>
                      </div>
                    </div>
                    <div className="row">
                      {this.getServiceSettings()}
                    </div>
                  </div>
                  :
                  <div className="row">
                    {
                      regNewUser ?
                        <DynamicRegistrationForm
                          caURL={serviceSettings.url}
                          formVerified={this.state.formVerified}
                          onCancel={this.handelCancel}
                          onRDNmodelChange={this.onRDNmodelChange}
                          toggleDisableSecondStep={this.toggleDisableSecondStep}
                        />
                        : <LoginForm login={this.state.login} password={this.state.password} loginChange={this.handleLoginChange} passwordChange={this.handlePasswordChange} />
                    }
                  </div>
              }
            </div>

            <div className="row halfbottom" />

            {
              activeSettingsTab ?
                <div className="row halfbottom">
                  <div style={{ float: "left" }}>
                    <div style={{ display: "inline-block", margin: "10px" }}>
                      <input
                        name="regNewUser"
                        type="checkbox"
                        id="regNewUser"
                        className="filled-in"
                        checked={regNewUser}
                        onClick={this.toggleRegNewUser}
                      />
                      <label htmlFor={"regNewUser"} className="truncate">
                        {localize("CA.reg_new_user", locale)}
                      </label>
                    </div>
                  </div>

                  <div style={{ float: "right" }}>
                    <div style={{ display: "inline-block", margin: "10px" }}>
                      <a className={"btn btn-text waves-effect waves-light modal-close "} onClick={this.handelCancel}>{localize("Common.cancel", locale)}</a>
                    </div>
                    <div style={{ display: "inline-block", margin: "10px" }}>
                      <a className={"btn btn-outlined waves-effect waves-light "} onClick={this.handleAdd}>{localize("Services.connect", locale)}</a>
                    </div>
                  </div>
                </div>
                :
                <div className="row halfbottom">
                  <div style={{ float: "right" }}>
                    <div style={{ display: "inline-block", margin: "10px" }}>
                      <a className={"btn btn-outlined waves-effect waves-light " + disabledSecondStep} onClick={this.handleCAUserRegrequest}>{localize("Services.connect", locale)}</a>
                    </div>
                  </div>
                </div>
            }
          </div>
        </div>
      </div>
    );
  }

  getServiceSettings = () => {
    const { regNewUser, serviceName, serviceType, serviceSettings } = this.state;

    switch (serviceType) {
      case CA_SERVICE:
        return (
          <React.Fragment>
            <CryptoProCASettings
              comment={this.state.comment}
              commentChange={this.handleCommentChange}
              description={this.state.description}
              descriptionChange={this.handleDescriptionChange}
              email={this.state.email}
              emailChange={this.handleEmailChange}
              keyPhrase={this.state.keyPhrase}
              keyPhraseChange={this.handleKeyPhraseChange}
              nameChange={this.handleServiceNameChange}
              urlChange={this.handleCAUrlChange}
              regNewUser={regNewUser}
              service={{ settings: serviceSettings, name: serviceName }}
            />
          </React.Fragment>
        );

      default:
        return null;
    }
  }

  toggleRegNewUser = () => {
    this.setState({ regNewUser: !this.state.regNewUser });
  }

  toggleDisableSecondStep = () => {
    this.setState({ disableSecondStep: !this.state.disableSecondStep });
  }

  handleServiceNameChange = (ev: any) => {
    this.setState({ serviceName: ev.target.value });
  }

  handleCommentChange = (ev: any) => {
    this.setState({ comment: ev.target.value });
  }

  handleDescriptionChange = (ev: any) => {
    this.setState({ description: ev.target.value });
  }

  handleEmailChange = (ev: any) => {
    this.setState({ email: ev.target.value });
  }

  handleKeyPhraseChange = (ev: any) => {
    this.setState({ keyPhrase: ev.target.value });
  }

  handleCAUrlChange = (ev: any) => {
    this.setState({ serviceSettings: { ...this.state.serviceSettings, url: ev.target.value } });
  }

  handleChangeServiceType = (type: "CA_SERVICE") => {
    this.setState({ serviceType: type });

    return;
  }

  handleLoginChange = (value: string) => {
    this.setState({ login: value });
  }

  handlePasswordChange = (value: any) => {
    this.setState({ password: value });
  }

  handleAdd = () => {
    const { serviceType } = this.state;

    if (serviceType === CA_SERVICE) {
      this.setState({ activeSettingsTab: false });
      return;
    }
  }

  handelCancel = () => {
    const { onCancel } = this.props;

    if (onCancel) {
      onCancel();
    }
  }

  onRDNmodelChange = (model: any) => {
    this.setState({ RDNmodel: { ...model } });
  }

  handleCAUserRegrequest = () => {
    const { localize, locale } = this.context;
    // tslint:disable-next-line:no-shadowed-variable
    const { addService, getRegRequest, onCancel, postRegRequest } = this.props;
    const { comment, description, email, keyPhrase, login, password, regNewUser, serviceName,
      serviceSettings, serviceType, RDNmodel } = this.state;

    const id = uuid();
    const service: IService = {
      id,
      name: serviceName,
      settings: serviceSettings,
      type: serviceType,
    };

    if (regNewUser) {
      if (!RDNmodel) {
        this.handelCancel();
      }

      if (!this.verifyProhibitEmptyFields()) {
        $(".toast-required_fields").remove();
        Materialize.toast(localize("Services.fill_required_fields", locale), 3000, "toast-required_fields");

        return;
      }

      const oids = Object.keys(RDNmodel).map(function (key) {
        return { [key]: RDNmodel[key].value };
      });

      postRegRequest(`${serviceSettings.url}`, comment, description, email, keyPhrase, oids, service);
      onCancel(service);
    } else {
      Materialize.toast("Отправлен запрос на проверку статуса регистрации в УЦ", 3000, "toast-ca_get_req_send");

      getRegRequest(`${serviceSettings.url}`, login, password, service);
      onCancel(service);
    }
  }

  verifyProhibitEmptyFields = () => {
    const { RDNmodel } = this.state;
    let result = true;

    Object.keys(RDNmodel).map((key) => {

      const field = RDNmodel[key];
      if (field) {
        if (field.ProhibitEmpty && !field.value) {
          result = false;
          return;
        }

        if (field.value && (key === "1.2.643.3.131.1.1")) {
          result = validateInn(field.value);
          return;
        } else if (field.value && (key === "1.2.643.100.1")) {
          result = validateOgrn(field.value);
          return;
        } else if (field.value && (key === "1.2.643.100.3")) {
          result = validateSnils(field.value);
          return;
        } else if (field.value && (key === "1.2.643.100.5")) {
          result = validateOgrnip(field.value);
          return;
        } else if (field.value && (key === "1.2.840.113549.1.9.1")) {
          result = REQULAR_EXPRESSION.test(field.value);
          return;
        }
      }
    });

    if (!this.state.formVerified) {
      this.setState({ formVerified: true });
    }

    return result;
  }
}

export default connect((state) => ({
  mapServices: state.services,
}), { addService, getRegRequest, postRegRequest })(AddService);
