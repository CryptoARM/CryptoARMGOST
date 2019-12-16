import PropTypes from "prop-types";
import React from "react";

export default function ProgressBars({ }, context: { localize: (str: string, locale: string) => string; locale: string; }) {
  const { localize, locale } = context;

  return (
    <div className="preloader-content">
      <div className="preloader-wrapper big active">
        <div className="spinner-layer spinner-blue-only">
          <div className="circle-clipper left">
            <div className="circle"></div>
          </div>
          <div className="gap-patch">
            <div className="circle" />
          </div>
          <div className="circle-clipper right">
            <div className="circle" />
          </div>
        </div>
      </div>
      <div className="headline6 preloader-text">{localize("Settings.wait", locale)}</div>
    </div>
  );
}

ProgressBars.contextTypes = {
  locale: PropTypes.string,
  localize: PropTypes.func,
};
