import { collectDiagnosticInfo } from "../../AC/urlCmdDiagnostic";
import PropTypes from "prop-types";
import React from "react";
import { copyDiagnosticInfo } from "../Diagnostic/Diagnostic";

interface IDiagnosticInfoProps {
    onCancel?: () => void;
}

class DiagnosticInfo extends React.Component<IDiagnosticInfoProps>{

    static contextTypes = {
        locale: PropTypes.string,
        localize: PropTypes.func,
    };

    componentWillUnmount() {
        this.handelCancel();
    }

    render() {
        const { localize, locale } = this.context;

        return (
            <React.Fragment>
                <div>
                    <div className="row nobottom">
                        <div className="selectable-text content-wrapper z-depth-1 diagnostic_info">
                                <span className="card-infos sub">
                                    <table className="diagnostic_table">
                                        {this.showDiagnosticInfo()}
                                    </table>
                                </span> 
                        </div>
                        <div className="row halfbottom" style={{paddingTop: "10px"}}>
                            <div style={{ float: "right" }}>
                                <div style={{ display: "inline-block", margin: "10px"}}>
                                    <a className="btn btn-text waves-effect waves-light" onClick={copyDiagnosticInfo}>{localize("DiagnosticInfo.copy", locale)}</a>
                                </div>
                                <div style={{ display: "inline-block", margin: "10px"}}>
                                    <a className="btn btn-outlined waves-effect waves-light" onClick={this.handelCancel}>{localize("Common.close", locale)}</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </React.Fragment>
        )
    };

    handelCancel = () => {
        const { onCancel } = this.props;
    
        if (onCancel) {
          onCancel();
        }
    }
    
    showDiagnosticInfo = () => {
        const diagOperations = ["SYSTEMINFORMATION", "CSP_ENABLED", "CADES_ENABLED", "VERSIONS", "PROVIDERS", "LICENSES"];
        const result = collectDiagnosticInfo("fromSideMenu", diagOperations)
        
        return (
            <React.Fragment>
                {this.systemInformation(result.SYSTEMINFORMATION)}
                {this.cspEnabled(result.CSP_ENABLED)}
                {this.cadesEnabled(result.CADES_ENABLED)}
                {this.version(result.VERSIONS)}
                {this.providers(result.PROVIDERS)}
                {this.licenses(result.LICENSES)}
            </React.Fragment>
        )
    }

    systemInformation = (SYSTEMINFORMATION: any) => {
        const { localize, locale } = this.context;

        if (SYSTEMINFORMATION !== undefined) {
            return (
                <tbody>
                    <tr>
                        <td style={{textAlign: 'right', paddingRight: '20px'}}>{localize("DiagnosticInfo.information_about_system", locale)}:</td>
                        <td>{localize("DiagnosticInfo.arch", locale)}{SYSTEMINFORMATION.arch}</td>
                    </tr>
                    <tr>
                        <td></td>
                        <td>{localize("DiagnosticInfo.type", locale)}{SYSTEMINFORMATION.packageType}</td>
                    </tr>
                    <tr>
                        <td></td>
                        <td>{localize("DiagnosticInfo.platform", locale)}{SYSTEMINFORMATION.platform}</td>
                    </tr>
                    <tr>
                        <td></td>
                        <td style={{paddingBottom: "10px"}}>{localize("DiagnosticInfo.OC_type", locale)}{SYSTEMINFORMATION.type}</td>
                    </tr>
                </tbody>
            )
        }
    }

    cspEnabled = (CSP_ENABLED: any) => {
        const { localize, locale } = this.context;
        if (CSP_ENABLED !== undefined) {
            return (
                <tbody>
                    <tr>
                        <td style={{textAlign: 'right', paddingRight: '20px', paddingBottom: "10px"}}>{localize("DiagnosticInfo.crypto_pro_provider", locale)}</td>
                        <td style={{paddingBottom: "10px"}}>{CSP_ENABLED ? localize("DiagnosticInfo.install", locale) : localize("DiagnosticInfo.not_install", locale)}</td>
                    </tr>
                </tbody>
            )
        }
    }

    cadesEnabled = (CADES_ENABLED: any) => {
        const { localize, locale } = this.context;

        if (CADES_ENABLED !== undefined) {
            return (
                <tbody>
                    <tr>
                        <td style={{textAlign: 'right', paddingRight: '20px', paddingBottom: "10px"}}>{localize("DiagnosticInfo.improved_sign", locale)}</td>
                        <td style={{paddingBottom: "10px"}}>{CADES_ENABLED ? localize("DiagnosticInfo.install", locale) : localize("DiagnosticInfo.not_install", locale)}</td>
                    </tr>
                </tbody>
            )
        }
    }

    version = (VERSIONS: any) => {
        const { localize, locale } = this.context;

        if (VERSIONS !== undefined) {
            return (
                <tbody>
                    <tr>
                        <td style={{textAlign: 'right', paddingRight: '20px'}}>{localize("DiagnosticInfo.versions", locale)}</td>
                        <td>{localize("DiagnosticInfo.crypto_arm", locale)}{VERSIONS.cryptoarm}</td>
                    </tr>
                    <tr>
                        <td></td>
                        <td style={{paddingBottom: "10px"}}>{localize("DiagnosticInfo.crypro_pro", locale)}{VERSIONS.csp ? VERSIONS.csp : localize("DiagnosticInfo.not_install", locale)}</td>
                    </tr>
                </tbody>
            )
        }
    }

    providers = (PROVIDERS: any) => {
        const { localize, locale } = this.context;

        if (PROVIDERS !== undefined) {
            return (
                <tbody>
                    <tr>
                        <td style={{textAlign: 'right', paddingRight: '20px'}}>{localize("DiagnosticInfo.providers", locale)}</td>
                        <td>{localize("DiagnosticInfo.providers_256", locale)}{PROVIDERS.GOST2012_256 ? localize("DiagnosticInfo.install", locale) : localize("DiagnosticInfo.not_install", locale)}</td>
                    </tr>
                    <tr>
                        <td></td>
                        <td style={{paddingBottom: "10px"}}>{localize("DiagnosticInfo.providers_512", locale)}{PROVIDERS.GOST2012_512 ? localize("DiagnosticInfo.install", locale) : localize("DiagnosticInfo.not_install", locale)}</td>
                    </tr>
                </tbody>
            )
        }
    }
    
    licenses = (LICENSES: any) => {
        const { localize, locale } = this.context;

        if (LICENSES) {
            let lic
            if (LICENSES.cryptoarm.type === "temporary") {
                lic = localize("DiagnosticInfo.lic_temporary", locale)
            } else if (LICENSES.cryptoarm.type === "permament") {
                lic = localize("DiagnosticInfo.lic_permament", locale)
            } else {lic = localize("DiagnosticInfo.lic_none", locale)}
            return (
                <tbody>
                    <tr>
                        <td style={{textAlign: 'right', paddingRight: '20px'}}>{localize("DiagnosticInfo.license", locale)}</td>
                        <td>{localize("DiagnosticInfo.crypto_arm", locale)}{lic}</td>
                    </tr>
                    <tr>
                        <td></td>
                        <td>{localize("DiagnosticInfo.lic_crypto_arm", locale)}{LICENSES.cryptoarm.status ? localize("DiagnosticInfo.valid", locale) : localize("DiagnosticInfo.invalid", locale)}</td>
                    </tr>
                    <tr>
                        <td></td>
                        <td>{localize("DiagnosticInfo.lic_crypto_pro", locale)}{LICENSES.csp.status ? localize("DiagnosticInfo.valid", locale) : localize("DiagnosticInfo.invalid", locale)}</td>
                    </tr>
                </tbody>
            )
        }
    }
}

export default DiagnosticInfo