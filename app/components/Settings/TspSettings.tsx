import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";
import {
  changeTspProxyPort, changeTspProxyUrl, changeTspUrl, changeTspUseProxy,
} from "../../AC/settingsActions";
import CheckBoxWithLabel from "../CheckBoxWithLabel";

interface ITspSettingsProps {
  changeTspUrl: (url: string) => void;
  changeTspProxyUrl: (url: string) => void;
  changeTspProxyPort: (port: number) => void;
  changeTspUseProxy: (use: boolean) => void;
  settings: any;
}

class TspSettings extends React.Component<ITspSettingsProps, {}> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  constructor(props: any) {
    super(props);
  }

  componentDidMount() {
    Materialize.updateTextFields();
  }

  componentDidUpdate() {
    Materialize.updateTextFields();
  }

  render() {
    const { localize, locale } = this.context;
    const { tsp } = this.props.settings;
    const { url, use_proxy, proxy_url, proxy_port } = tsp;

    const disbledProxyInputs = use_proxy ? "" : "disabled";

    return (
      <div className="row">
        <div className="input-field col s12">
          <input
            id="url_tsp"
            type="text"
            className="validate"
            name="url_tsp"
            value={url}
            onChange={this.handleUrlChange}
            placeholder="https://"
          />
          <label htmlFor="url_tsp">
            {localize("Cades.url_tsp", locale)}
          </label>
        </div>

        <div className="col s12">
          <CheckBoxWithLabel
            disabled={false}
            isChecked={use_proxy}
            elementId="use_proxy_tsp"
            onClickCheckBox={this.handleUseProxyClick}
            title={localize("Cades.use_proxy", locale)} />
        </div>

        <div className={`input-field col s12 ${disbledProxyInputs}`}>
          <input
            id="url_proxy_tsp"
            type="text"
            className="validate"
            name="url_proxy_tsp"
            value={proxy_url}
            onChange={this.handleUrlProxyChange}
            placeholder="https://"
          />
          <label htmlFor="url_proxy_tsp" className={`${disbledProxyInputs}`}>
            {localize("Cades.url_proxy", locale)}
          </label>
        </div>

        <div className={`input-field col s12 ${disbledProxyInputs}`}>
          <input
            id="port_tsp"
            type="number"
            className="validate"
            max={65536}
            min={0}
            name="port_tsp"
            value={proxy_port}
            onChange={this.handleInputPort}
            placeholder="0 - 65536"
          />
          <label htmlFor="port_tsp" className={`${disbledProxyInputs}`}>
            {localize("Cades.port", locale)}
          </label>
        </div>
      </div>
    );
  }

  handleUrlChange = (ev: any) => {
    // tslint:disable-next-line: no-shadowed-variable
    const { changeTspUrl } = this.props;

    changeTspUrl(ev.target.value);
  }

  handleUrlProxyChange = (ev: any) => {
    // tslint:disable-next-line: no-shadowed-variable
    const { changeTspProxyUrl } = this.props;

    changeTspProxyUrl(ev.target.value);
  }

  handleInputPort = (ev: any) => {
    // tslint:disable-next-line: no-shadowed-variable
    const { changeTspProxyPort } = this.props;

    changeTspProxyPort(parseInt(ev.target.value, 10));
  }

  handleUseProxyClick = () => {
    // tslint:disable-next-line: no-shadowed-variable
    const { changeTspUseProxy } = this.props;

    changeTspUseProxy(!this.props.settings.tsp.use_proxy);
  }
}

export default connect((state) => {
  return {
    settings: state.settings.getIn(["entities", state.settings.active]),
  };
}, {
  changeTspProxyPort, changeTspProxyUrl, changeTspUrl, changeTspUseProxy,
})(TspSettings);
