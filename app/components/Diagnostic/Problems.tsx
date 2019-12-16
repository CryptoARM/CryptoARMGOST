import PropTypes from "prop-types";
import React from "react";
import {
  ERROR_CHECK_CSP_LICENSE, ERROR_CHECK_CSP_PARAMS,
  ERROR_LOAD_TRUSTED_CRYPTO,
  ERROR_LOAD_TRUSTED_CURL, NO_CORRECT_CRYPTOARM_LICENSE,
  NO_CRYPTOARM_LICENSE, NO_GOST_2001, NO_HAVE_CERTIFICATES_WITH_KEY, NOT_INSTALLED_CSP,
} from "../../errors";
import HeaderWorkspaceBlock from "../HeaderWorkspaceBlock";

interface IError {
  important?: string;
  type: string;
}

interface IProblemsProps {
  activeError: string;
  errors: IError[];
  onClick: (type: string) => void;
}

class Problems extends React.Component<IProblemsProps, {}> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  getErrorMessageByType = (error: string): string => {
    switch (error) {
      case ERROR_LOAD_TRUSTED_CRYPTO:
        return "Problems.problem_6";
      case ERROR_LOAD_TRUSTED_CURL:
        return "Problems.problem_7";
      case NOT_INSTALLED_CSP:
        return "Problems.problem_1";
      case ERROR_CHECK_CSP_LICENSE:
        return "Problems.problem_2";
      case NO_GOST_2001:
        return "Csp.noProvider2001";
      case ERROR_CHECK_CSP_PARAMS:
        return "Csp.cspErr";
      case NO_CRYPTOARM_LICENSE:
        return "Problems.problem_3";
      case NO_CORRECT_CRYPTOARM_LICENSE:
        return "Problems.problem_3";
      case NO_HAVE_CERTIFICATES_WITH_KEY:
        return "Problems.problem_5";

      default:
        return "License.jwtErrorCode";
    }
  }

  isOpen = (type: string) => {

    const { activeError } = this.props;
    return (type === activeError) ? "active" : "";
  }

  isImportant = (important: string) => {
    return (important === "BUG") ? "problem_bug" : "problem_warning";
  }

  render() {
    const { errors, onClick } = this.props;
    const { localize, locale } = this.context;

    const elements = errors.map((error: any) => <div key={Math.random()}>

      <div className={"add-problems collection "}>
        <div className="row problems-list-item" onClick={() => onClick(error.type)}>
          <div className={"collection-item avatar problems-collection " + this.isOpen(error.type)}>
            <div className="col s1">
              <div className={this.isImportant(error.important)}></div>
            </div>
            <div className="col s11">
              <div className="collection-title multiline">{localize(this.getErrorMessageByType(error.type), locale)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>);

    return (
      <div className="problem-contaner">
        <div className="content-wrapper z-depth-1">
          <HeaderWorkspaceBlock text={localize("Diagnostic.problem_header", locale)} />
          {elements}
        </div>
      </div>
    );
  }
}

export default Problems;
