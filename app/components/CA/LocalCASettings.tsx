import PropTypes from "prop-types";
import React from "react";
import { IService } from "../Services/types";
const dialog = window.electron.remote.dialog;

interface ILocalCASettingsProps {
  nameChange: (ev: any) => void;
  service: IService;
  description: string;
  template_file: string;
  templateFileChange: (ev: any) => void;
}

class LocalCASettings extends React.PureComponent<ILocalCASettingsProps, {}> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func
  };

  constructor(props: ILocalCASettingsProps) {
    super(props);
  }

  componentDidMount() {
    $(document).on("ready", function () {
      Materialize.updateTextFields();
    });

    try {
      Materialize.updateTextFields();
    } catch (e) {
      //
    }
  }

  componentDidUpdate() {
    Materialize.updateTextFields();
  }

  render() {
    const { localize, locale } = this.context;
    const { template_file, nameChange, service, templateFileChange } = this.props;
    const self = this;

    if (!service) {
      return null;
    }

    const { settings } = service;
    const url = settings && settings.url ? settings.url : "";
    const name = service.name;

    return (
      <div className="row">
        <div className="row" />

        <div className="row">
          <div className="input-field input-field-csr col s12">
            <input
              id="name"
              type="text"
              className="validate"
              name="name"
              value={name}
              placeholder={localize("Services.write_service_description", locale)}
              onChange={nameChange}
            />
            <label htmlFor="name">
              {localize("Services.description", locale)}
            </label>
          </div>
        </div>

        <div className="row">
          <div className="col s12">
            <div className="input-field col s12 input-field-licence">
              <i
                className="material-icons prefix key-prefix"
                style={{ left: "-10px" }}
              >
                file_download
              </i>
              <input
                id="input_file"
                type="text"
                value={template_file}
                onChange={(e: any) => {
                  templateFileChange(e.target.value);
                }}
              />
              <label htmlFor="input_file">
                Укажите файл с шаблонами
              </label>
              <a onClick={this.openLicenseFile.bind(this)}>
                <i className="file-setting-item waves-effect material-icons secondary-content pulse active">
                  insert_drive_file
                </i>
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  openLicenseFile = () => {
    const { localize, locale } = this.context;
    const {templateFileChange} = this.props;

    if (!window.framework_NW) {
      const file = dialog.showOpenDialogSync({
        filters: [
          { name: "Шаблоны", extensions: ["json"] },
        ],
        properties: ["openFile"],
      });
      if (file) {
        $("#input_file").focus();
        templateFileChange(file[0]);
      }
    }
  }
}

export default LocalCASettings;
