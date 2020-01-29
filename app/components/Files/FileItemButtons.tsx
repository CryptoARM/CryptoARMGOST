import { List } from "immutable";
import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";
import { TMP_DIR } from "../../constants";
import * as signs from "../../trusted/sign";
import { fileExists } from "../../utils";

const shell = window.electron.shell;
const dialog = window.electron.remote.dialog;

interface IFileItemButtonsProps {
  file: any;
  deleteFile: (id: number) => void;
  selectTempContentOfSignedFiles: (path: string) => void;
}

class FileItemButtons extends React.Component<IFileItemButtonsProps, {}> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  render() {
    const { file } = this.props;

    if (!file) {
      return null;
    }

    const classDisabled = file.socket ? "disabled" : "";

    return (
      <div className="row nobottom" style={{ width: "120px" }}>
        {
          file.extension !== "enc" ?
            <div className="col" style={{ width: "40px" }}>
              <i className="file-setting-item waves-effect material-icons secondary-content"
                onClick={(event) => {
                  event.stopPropagation();
                  this.openFile(file.fullpath);
                }}>visibility</i>
            </div> :
            null
        }

        <div className="col" style={{ width: "40px" }}>
          <i className={`file-setting-item waves-effect material-icons secondary-content ${classDisabled}`}
            onClick={(event) => {
              event.stopPropagation();
              shell.showItemInFolder(file.fullpath);
            }}>directions</i>
        </div>
        <div className="col" style={{ width: "40px" }}>
          <i className={`file-setting-item waves-effect material-icons secondary-content ${classDisabled}`}
            onClick={(event) => {
              event.stopPropagation();
              this.props.deleteFile(file.id);
            }}>delete</i>
        </div>
      </div>
    );
  }

  openFile = (file: string) => {
    if (file.split(".").pop() === "sig") {
      const cms: trusted.cms.SignedData | undefined = signs.loadSign(file);

      if (cms.isDetached()) {
        this.openDetachedContent(file);
      } else {
        const newPath = signs.unSign(file, TMP_DIR, false);

        if (newPath) {
          if (shell.openItem(newPath)) {
            this.props.selectTempContentOfSignedFiles(newPath);

          }
        }
      }
    } else {
      shell.openItem(file);
    }
  }

  openDetachedContent = (file: string) => {
    const { localize, locale } = this.context;

    let tempURI: string;
    tempURI = file.substring(0, file.lastIndexOf("."));
    if (!fileExists(tempURI)) {
      tempURI = dialog.showOpenDialog(null, {
        properties: ["openFile"],
        title: localize("Sign.sign_content_file", locale) + path.basename(file),
      });

      if (tempURI) {
        tempURI = tempURI[0];
      }

      if (!tempURI || !fileExists(tempURI)) {
        $(".toast-verify_get_content_failed").remove();
        Materialize.toast(localize("Sign.verify_get_content_failed", locale), 2000, "toast-verify_get_content_failed");

        return;
      } else {
        shell.openItem(tempURI);
      }
    } else {
      shell.openItem(tempURI);
    }
  }
}

export default connect((state) => {
  return {};
})(FileItemButtons);
