import React from "react";
import { connect } from "react-redux";
import { changeLocale } from "../../AC/settingsActions";
import { EN, RU } from "../../constants";

interface ILocaleSelectProps {
  changeLocale: (locale: string) => void;
  locale: string;
}

class LocaleSelect extends React.Component<ILocaleSelectProps, {}> {
  handleChange = () => {
    // tslint:disable-next-line:no-shadowed-variable
    const { locale, changeLocale } = this.props;

    locale === RU ? changeLocale(EN) : changeLocale(RU);
    window.locale = locale === RU ? EN : RU;
  }

  render() {
    const { locale } = this.props;

    return (
      <div className="waves-effect waves-light">
        <a className={`headline6 ${locale}`} onClick={this.handleChange}>{locale}</a>
      </div>
    );
  }
}

export default connect((state) => ({
  locale: state.settings.getIn(["entities", state.settings.default]).locale,
}), { changeLocale })(LocaleSelect);
