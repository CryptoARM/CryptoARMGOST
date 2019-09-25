import PropTypes from "prop-types";
import React from "react";
import ReactDOM from "react-dom";
import ProgressBars from "../ProgressBars";

export interface IRDNObject {
  /**
   * Значение OIDэлемента учетной записи пользователя
   */
  Oid: string;
  /**
   * Наименование OIDэлемента учетной записи пользователя
   */
  Name: string;
  /**
   * Локализованное наименование OIDэлемента учетной записи пользователя
   */
  LocalizedName: string;
  /**
   * Список возможных значений элемента учетной записи пользователя
   */
  SettingsValues: string[];
  /**
   * Значение по умолчанию элемента учетной записи пользователя из списка SettingValues
   */
  DefaultValue: string;
  /**
   * Флаг указывающий, что значение элемента учетной записи входит в список значений SettingsValues
   */
  ProhibitAnyValue: boolean;
  /**
   * Флаг указывающий, что элемент учетной записи не может быть изменен
   */
  ProhibitChange: boolean;
  /**
   * Флаг указывающий, что элемент учетной записи должен быть непустым
   */
  ProhibitEmpty: boolean;
}

interface IDynamicRegistrationFormProps {
  /**
   * URL вида  https://{веб сервер УЦ}/ui/api/{folder}
   *
   * @type {string}
   * @memberof IDynamicRegistrationFormProps
   */
  caURL: string;
  onCancel?: () => void;
  onRDNmodelChange: (model: any) => void;
}

interface IDynamicRegistrationFormState {
  error: string;
  isUserattrLoading: boolean;
  isUserattrLoaded: boolean;
  model: any;
  /**
   * Значения элементов учетных записей пользователейорганизованных в папке УЦ
   *
   * @type {IRDNObject[]}
   * @memberof IDynamicRegistrationFormProps
   */
  RDN: IRDNObject[];
}

export async function requestApi(url: string) {
  return new Promise((resolve, reject) => {
    console.log("url", url);

    const curl = new window.Curl();

    curl.setOpt("URL", url);
    curl.setOpt("FOLLOWLOCATION", true);

    curl.on("end", function (statusCode: number, response: { toString: () => string; }) {
      let data;

      try {

        if (statusCode !== 200) {
          throw new Error(`Unexpected response, status code ${statusCode}, url is ${url}`);
        }

        data = JSON.parse(response.toString());

      } catch (error) {
        reject(`Cannot load data, error: ${error.message}`);
        return;
      } finally {
        curl.close.bind(curl);
      }

      resolve(data);
    });

    curl.on("error", (error: { message: any; }) => {
      console.log("error: ", error);

      curl.close.bind(curl);
      reject(new Error(`Cannot load data by url ${url}, error: ${error.message}`));
    });

    curl.perform();
  });
}

class DynamicRegistrationForm extends React.Component<IDynamicRegistrationFormProps, IDynamicRegistrationFormState> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  constructor(props: any) {
    super(props);
    this.state = {
      RDN: [],
      error: "",
      isUserattrLoaded: false,
      isUserattrLoading: false,
      model: {},
    };
  }

  componentDidMount() {
    const self = this;

    $(document).ready(() => {
      $("select").material_select();

      $("select").on("change", self.handleInputChange);
    });

    Materialize.updateTextFields();

    this.geCAtuserattr();
  }

  componentDidUpdate() {
    Materialize.updateTextFields();
  }

  render() {
    const { localize, locale } = this.context;
    const { isUserattrLoading, isUserattrLoaded, RDN } = this.state;

    if (isUserattrLoading) {
      return <ProgressBars />;
    }

    if (isUserattrLoading === false && isUserattrLoaded === true && (!RDN || !RDN.length)) {
      Materialize.toast("Ошибка получения свойств учетной записи", 3000, "toast-ca_empty_rdn");
      Materialize.toast(this.state.error, 4000, "toast-ca_error");
      this.handelCancel();
    }

    return (
      <div className="row">
        {
          RDN.map((field: IRDNObject) => {
            if (field.SettingsValues && field.SettingsValues.length) {
              return (
                <div className="row">
                  <div className="input-field input-field-csr col s12">
                    <select
                      disabled={field.ProhibitChange}
                      id={field.Oid}
                      className="select"
                      name={field.Oid}
                      value={field.DefaultValue}
                      onChange={this.handleInputChange}
                    >
                      {
                        field.SettingsValues.map((settingsValue) =>
                          <option value={settingsValue}>
                            {settingsValue}
                          </option>)
                      }
                    </select>

                    <label htmlFor={field.Oid}>{field.LocalizedName} {field.ProhibitEmpty ? " *" : ""}</label>
                  </div>
                </div>
              );
            } else {
              const oidValue = this.state.model[field.Oid];

              return (
                <div className="row">
                  <div className="input-field input-field-csr col s12">
                    <input
                      disabled={field.ProhibitChange}
                      id={field.Oid}
                      type="text"
                      className="validate"
                      name={field.Oid}
                      value={oidValue}
                      onChange={this.handleInputChange}
                      placeholder={`${field.LocalizedName} (oid: ${field.Oid})`}
                    />
                    <label htmlFor={field.Oid}>{field.LocalizedName} {field.ProhibitEmpty ? " *" : ""}</label>
                  </div>
                </div>
              );
            }
          })
        }
      </div>
    );
  }

  handleInputChange = (ev: any) => {
    const target = ev.target;
    const name = target.name;
    const value = ev.target.value;

    const newModel = {
      ...this.state.model,
      [name]: value,
    };

    this.setState(({
      model: { ...newModel },
    }));

    this.props.onRDNmodelChange({ ...newModel });
  }

  geCAtuserattr = async () => {
    const { caURL } = this.props;

    this.setState({ isUserattrLoading: true });
    let data: any;

    try {
      data = await requestApi(`${caURL}/userattr`);
    } catch (err) {
      this.setState({ isUserattrLoading: false, isUserattrLoaded: true, error: err });
    }

    const model: any = {};
    data.RDN.map((field: IRDNObject) => model[field.Oid] = field.DefaultValue);

    this.props.onRDNmodelChange(model);

    this.setState({ isUserattrLoading: false, isUserattrLoaded: true, RDN: data.RDN, model: { ...model } });
  }

  handelCancel = () => {
    const { onCancel } = this.props;

    if (onCancel) {
      onCancel();
    }
  }
}

export default DynamicRegistrationForm;
