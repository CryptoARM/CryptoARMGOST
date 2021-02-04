import PropTypes from "prop-types";
import React from "react";
import { err_inn, err_ogrnip, err_snils, validateInn, validateOgrn, validateOgrnip, validateSnils } from "../../utils";

const REQULAR_EXPRESSION = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;

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
   * Максимально разренная длина
   */
  Length: number;
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

interface ITemplate {
  Description: string;
  FriendlyName: string;
  RDN: IRDNObject[];
  Extensions: {
    KeyUsage: any,
    ExtendedKeyUsage: any,
  };
  MarkExportable: boolean;
}

interface IDynamicSubjectNameProps {
  formVerified: boolean;
  model: any;
  template: ITemplate;
  onCancel?: () => void;
  onSubjectChange: (subject: any) => void;
}

interface IDynamicSubjectNameState {
  error: string;
  subject: any;
  /**
   * Значения элементов учетных записей пользователейорганизованных в папке УЦ
   *
   * @type {IRDNObject[]}
   * @memberof IDynamicSubjectNameProps
   */
  RDN: IRDNObject[];
}

class DynamicSubjectName extends React.Component<IDynamicSubjectNameProps, IDynamicSubjectNameState> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  constructor(props: any) {
    super(props);

    this.state = {
      RDN: this.props.template ? this.props.template.RDN : [],
      error: "",
      subject: { ...this.props.model },
    };
  }

  componentDidMount() {
    const self = this;

    $(document).ready(() => {
      $("select").material_select();

      $("select").on("change", self.handleInputChange);

      Materialize.updateTextFields();
    });
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.filedChanged && this.props.filedChanged) {
      this.setState({subject: { ...this.props.model } });
      Materialize.updateTextFields();
    }
  }

  render() {
    const { RDN, subject } = this.state;

    return (
      <div className="row">
        <div className="row" />
        {
          RDN.map((field: IRDNObject) => {
            if (field.SettingsValues && field.SettingsValues.length) {
              return (
                <div key={field.Oid} className="row" >
                  <div className="input-field input-field-csr col s12">
                    <select
                      disabled={field.ProhibitChange}
                      id={field.Oid}
                      className="select"
                      defaultValue={subject[field.Oid] ? subject[field.Oid].value : ""}
                      name={field.Oid}
                      value={subject[field.Oid] ? subject[field.Oid].value : ""}
                      onChange={this.handleInputChange}
                    >
                      {
                        field.SettingsValues.map((settingsValue) =>
                          <option key={settingsValue} value={settingsValue}>
                            {settingsValue}
                          </option>)
                      }
                    </select>

                    <label htmlFor={field.Oid}>{field.LocalizedName} {field.ProhibitEmpty ? " *" : ""}</label>
                  </div>
                </div>
              );
            } else {
              const oidValue = subject[field.Oid] ? subject[field.Oid].value : "";

              return (
                <div className="row" key={field.Oid}>
                  <div key={field.Oid} className="input-field input-field-csr col s12">
                    <input
                      disabled={field.ProhibitChange}
                      id={field.Oid}
                      type="text"
                      className={this.validateOidValue(field)}
                      maxLength={field.Length}
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

  validateOidValue = (field: IRDNObject) => {
    const { subject } = this.state;
    const oidValue = subject[field.Oid] ? subject[field.Oid].value : "";
    if (this.props.formVerified && field.ProhibitEmpty && !(oidValue && oidValue.length > 0)) {
      return "invalid";
    }

    if (field.Oid === "1.2.643.3.131.1.1") {
      return !oidValue || !oidValue.length ? "validate" : validateInn(oidValue) ? "valid" : "invalid";
    } else if (field.Oid === "1.2.643.100.1") {
      return !oidValue || !oidValue.length ? "validate" : validateOgrn(oidValue) ? "valid" : "invalid";
    } else if (field.Oid === "1.2.643.100.3") {
      return !oidValue || !oidValue.length ? "validate" : validateSnils(oidValue) ? "valid" : "invalid";
    } else if (field.Oid === "1.2.643.100.5") {
      return !oidValue || !oidValue.length ? "validate" : validateOgrnip(oidValue) ? "valid" : "invalid";
    } else if (field.Oid === "1.2.840.113549.1.9.1") {
      return !oidValue || !oidValue.length ? "validate" : REQULAR_EXPRESSION.test(oidValue) ? "valid" : "invalid";
    }

    if (!this.props.formVerified) {
      return "validate";
    } else if (field.ProhibitEmpty) {
      if (oidValue && oidValue.length > 0) {
        return "valid";
      } else {
        return "invalid";
      }
    } else {
      if (oidValue && oidValue.length > 0) {
        return "valid";
      } else {
        return "validate";
      }
    }
  }

  handleInputChange = (ev: any) => {
    const target = ev.target;
    const name = target.name;
    const value = ev.target.value;

    const newSubject = {
      ...this.state.subject,
      [name]: { type: name, value },
    };

    this.setState(({
      subject: { ...newSubject },
    }));

    this.props.onSubjectChange({ ...newSubject });
  }

  handelCancel = () => {
    const { onCancel } = this.props;

    if (onCancel) {
      onCancel();
    }
  }
}

export default DynamicSubjectName;
