import React from "react";

interface ILicenseInfoField {
  title: string;
  info: string;
  style: any;
}

export default function LicenseInfoField({ title, info, style }: ILicenseInfoField) {
    return (
      <React.Fragment>
        <div className="caption-text">{title}</div>
        <div className="primary-text" style={style}>{info}</div>
      </React.Fragment>
    );
}
