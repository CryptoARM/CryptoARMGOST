import PropTypes from "prop-types";
import React from "react";
import CheckBoxWithLabel from "../CheckBoxWithLabel";

interface ITspSettingsProps {
  handleChange: (encoding: string) => void;
}

interface ITspSettingsState {
  port: number;
  url_proxy: string;
  url_tsp: string;
  use_proxy: boolean;
}

class TspSettings extends React.Component<ITspSettingsProps, ITspSettingsState> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  constructor(props: any) {
    super(props);
    this.state = {
      port: 0,
      url_proxy: "",
      url_tsp: "",
      use_proxy: false,
    };
  }

  render() {
    const { localize, locale } = this.context;

    return (
      <div className="row">
        <div className="col s12 m12 l6">
          <div className="input-field col s12">
            <input
              id="url_tsp"
              type="text"
              className="validate"
              name="url_tsp"
              value={this.state.url_tsp}
              onChange={this.handleInputChange}
              placeholder="https://"
            />
            <label htmlFor="url_tsp">
              {localize("Cades.url_tsp", locale)}
            </label>
          </div>

          <div className="col s12">
            <CheckBoxWithLabel
              disabled={false}
              isChecked={this.state.use_proxy}
              elementId="use_proxy"
              onClickCheckBox={this.handleUseProxyClick}
              title={localize("Cades.use_proxy", locale)} />
            <div className="row" />
          </div>
        </div>

        <div className="col s12 m12 l6">
          <div className="input-field col s12">
            <input
              id="url_proxy"
              type="text"
              className="validate"
              name="url_proxy"
              value={this.state.url_proxy}
              onChange={this.handleInputChange}
              placeholder="https://"
            />
            <label htmlFor="url_proxy">
              {localize("Cades.url_proxy", locale)}
            </label>
          </div>

          <div className="input-field col s12">
            <input
              id="port"
              type="number"
              className="validate"
              max={65536}
              min={0}
              name="port"
              value={this.state.port}
              onChange={this.handleInputPort}
              placeholder="0 - 65536"
            />
            <label htmlFor="port">
              {localize("Cades.port", locale)}
            </label>
          </div>
        </div>
      </div>
    );
  }

  handleInputChange = (ev: any) => {
    const target = ev.target;
    const name = target.name;
    const value = ev.target.value;

    this.setState(({
      ...this.state,
      [name]: value,
    }));
  }

  handleInputPort = (ev: any) => {
    const target = ev.target;
    const name = target.name;
    const value = ev.target.value;

    this.setState(({
      port: parseInt(value, 10),
    }));
  }

  handleUseProxyClick = () => {
    this.setState({
      use_proxy: !this.state.use_proxy,
    });
  }
}

export default TspSettings;
