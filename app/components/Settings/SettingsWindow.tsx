import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";
import {
  activeSetting, changeDefaultSettings, createSettings,
  deleteSetting,
} from "../../AC/settingsActions";
import {
  LOCATION_SETTINGS_CONFIG,
} from "../../constants";
import { mapToArr } from "../../utils";
import SettingsInfo from "./SettingsInfo";
import SettingsTable from "./SettingsTable";

interface ISettingsWindowState {
  searchValue: string;
  setting: any;
}

class SettingsWindow extends React.Component<{}, ISettingsWindowState> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  constructor(props: {}) {
    super(props);

    this.state = {
      searchValue: "",
      setting: null,
      showModalFilterEvents: false,
    };
  }

  componentDidMount() {
    $(".btn-floated, .nav-small-btn").dropdown({
      alignment: "left",
      belowOrigin: false,
      gutter: 0,
      inDuration: 300,
      outDuration: 225,
    });
  }

  render() {
    const { localize, locale } = this.context;
    const { recipients, setting, settings, signer } = this.props;

    return (
      <div className="content-noflex">
        <div className="row">
          <div className="col s8 leftcol">
            <div className="row halfbottom">
              <div className="row halfbottom" />
              <div className="col s12">
                <SettingsTable searchValue={this.state.searchValue} selectSetting={this.handleSelectSetting} setting={setting} />
              </div>
            </div>
          </div>
          <div className="col s4 rightcol">
            <div className="row" />
            {
              setting ?
                <React.Fragment>
                  <SettingsInfo setting={setting} signer={signer} recipients={recipients} />
                  <div className="row fixed-bottom-rightcolumn" style={{ bottom: "20px" }}>
                    <div className="col s12">
                      <hr />
                    </div>

                    {
                      settings.default !== setting.id ?
                        <div className="col s4 waves-effect waves-cryptoarm">
                          <div className="col s12 svg_icon">
                            <a onClick={() => this.props.changeDefaultSettings(setting.id)}
                              data-position="bottom">
                              <i className="material-icons certificate export" />
                            </a>
                          </div>
                          <div className="col s12 svg_icon_text">{"Применить"}</div>
                        </div>
                        :
                        null
                    }

                    <div className="col s4 waves-effect waves-cryptoarm">
                      <div className="col s12 svg_icon">
                        <a onClick={() => this.props.history.push(LOCATION_SETTINGS_CONFIG)}
                          data-position="bottom">
                          <i className="material-icons certificate export" />
                        </a>
                      </div>
                      <div className="col s12 svg_icon_text">{"Редактирвоать"}</div>
                    </div>

                    {
                      settings.default !== setting.id ?
                        <div className="col s4 waves-effect waves-cryptoarm">
                          <div className="col s12 svg_icon">
                            <a onClick={() => this.props.deleteSetting(setting.id)}
                              data-position="bottom">
                              <i className="material-icons certificate remove" />
                            </a>
                          </div>
                          <div className="col s12 svg_icon_text">{localize("Documents.docmenu_remove", locale)}</div>
                        </div> :
                        null
                    }

                  </div>
                </React.Fragment>
                :
                <div className="row fixed-bottom-rightcolumn" style={{ bottom: "20px" }}>
                  <div className="col s12">
                    <hr />
                  </div>

                  <div className="col s4 waves-effect waves-cryptoarm">
                    <div className="col s12 svg_icon">
                      <a onClick={() => this.props.createSettings()}
                        data-position="bottom">
                        <i className="material-icons certificate remove" />
                      </a>
                    </div>
                    <div className="col s12 svg_icon_text">{"Создать"}</div>
                  </div>
                </div>
            }
          </div>
        </div>
      </div>
    );
  }

  handleSearchValueChange = (ev: any) => {
    this.setState({ searchValue: ev.target.value });
  }

  handleSelectSetting = (setting) => {
    this.props.activeSetting(setting.id);
  }
}

export default connect((state) => ({
  recipients: mapToArr(state.recipients.entities)
    .map((recipient) => state.certificates.getIn(["entities", recipient.certId]))
    .filter((recipient) => recipient !== undefined),
  setting: state.settings.getIn(["entities", state.settings.active]),
  settings: state.settings,
  signer: state.certificates.getIn(["entities", state.signers.signer]),
}), { activeSetting, changeDefaultSettings, createSettings, deleteSetting })(SettingsWindow);
