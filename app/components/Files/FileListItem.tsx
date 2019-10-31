import PropTypes from "prop-types";
import React from "react";
import { TMP_DIR } from "../../constants";
import * as signs from "../../trusted/sign";
import { fileExists } from "../../utils";
import FileIcon from "./FileIcon";

const shell = window.electron.shell;
const dialog = window.electron.remote.dialog;

interface IFileRedux {
  active: boolean;
  extension: string;
  filename: string;
  fullpath: string;
  id: number;
  mtime: Date;
  socket: string;
}

interface IFilelistItemProps {
  file: IFileRedux;
  operation: string;
  onClickBtn: (event: any) => void;
  removeFiles: (event: any) => void;
  selectTempContentOfSignedFiles: (filePath: string) => void;
  index: string;
}

class FileListItem extends React.Component<IFilelistItemProps, {}> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  componentDidMount() {
    $(".file-setting-item").dropdown({
      inDuration: 300,
      outDuration: 225,
      constrain_width: false,
      gutter: 0,
      belowOrigin: false,
      alignment: "left",
    },
    );
  }

  shouldComponentUpdate(nextProps: IFilelistItemProps) {
    return nextProps.file.active !== this.props.file.active || nextProps.file.id !== this.props.file.id;
  }

  render() {
    const { localize, locale } = this.context;
    const { file, style } = this.props;

    const self = this;
    let active = "";

    if (file.active) {
      active = "active";
    }

    return (
      <div style={style}>
        <div className={"collection-item avatar files-collection " + active} id={"file-" + this.props.index} onClick={this.props.onClickBtn}>
          <div className="r-iconbox-link">
            <FileIcon file={file} />
            <p className="collection-title">{file.filename}</p>
            <p className="collection-info-files">{file.mtime.toLocaleDateString(locale, {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "numeric",
              minute: "numeric",
              second: "numeric",
            })}</p>
          </div>
          <i className="file-setting-item waves-effect material-icons secondary-content"
            data-activates={"dropdown-btn-set-file-" + this.props.index} onClick={self.stopEvent}>more_vert</i>
          <ul id={"dropdown-btn-set-file-" + this.props.index} className="dropdown-content">
            <li><a onClick={function (event: any) { self.openFile(event, file.fullpath); }}>{localize("Settings.open_file", locale)}</a></li>
            {
              file.socket ? null
                :
                <React.Fragment>
                  <li><a onClick={function (event: any) { self.openFileFolder(event, file.fullpath); }}>{localize("Settings.go_to_file", locale)}</a></li>
                  <li><a onClick={this.props.removeFiles}>{localize("Settings.delete_file", locale)}</a></li>
                </React.Fragment>
            }
          </ul>
        </div>
      </div>
    );
  }

  stopEvent(event: any) {
    event.stopPropagation();
  }

  openFile(event: any, file: string) {
    event.stopPropagation();

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

  openFileFolder(event: any, path: string) {
    event.stopPropagation();
    shell.showItemInFolder(path);
  }
}

export default FileListItem;
