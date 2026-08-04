import Document, { Html, Head, Main, NextScript } from 'next/document';
import { envPublic } from '../code/env';
import { getCMSLang } from '../code/cmsLang';

/** Disable all analytics scripts for development purposes */
const DEV_DISABLE_ANALYTICS = false;

class MyDocument extends Document {
    static async getInitialProps(ctx) {
        const initialProps = await Document.getInitialProps(ctx);
        const locals = ctx.res?.locals || {};

        const extra = {
            noAnalytics: !!locals.noAnalytics || !!locals.isExperienceEditor,
            isExperienceEditor: !!locals.isExperienceEditor,
            isPostPage: !!locals.isPostPage,
            isIframe: !!locals.isIframe,
            lang: locals.lang || ctx.locale,
            isPromoCarouselIframe: !!locals.isPromoCarouselIframe,
            isAPPDScriptDisabled: !!locals.isAPPDScriptDisabled,
        };

        if (DEV_DISABLE_ANALYTICS) {
            extra.noAnalytics = true;
        }

        return { ...initialProps, ...extra };
    }

    get ensightenScript() {
        const ensighten = envPublic.ENSIGHTEN_CODE;

        if (!ensighten) return null;

        if (typeof ensighten === 'string') return ensighten;

        return ensighten[this.props.lang] || ensighten['en'];
    }

    get isGAEnabled() {
        // INS-275 turn on GA on carousel IFrame
        return this.props.isPromoCarouselIframe || !(this.props.noAnalytics || this.props.isIframe);
    }

    get GATagManger() {
        return this.props.isIframe ? envPublic.GOOGLE_TAG_MANAGER_IFRAME : envPublic.GOOGLE_TAG_MANAGER;
    }

    render() {
        return (
            <Html lang={getCMSLang(this.props.lang)}>
                <Head>
                    <meta charSet='utf-8' />

                    {!!(
                        envPublic.APPD_AGENT_CONFIG_SCRIPT &&
                        !this.props.isAPPDScriptDisabled &&
                        !DEV_DISABLE_ANALYTICS &&
                        !this.props.isExperienceEditor
                    ) && (
                        <script
                            type='text/javascript'
                            dangerouslySetInnerHTML={{
                                __html: envPublic.APPD_AGENT_CONFIG_SCRIPT,
                            }}
                        />
                    )}

                    {!!(
                        envPublic.APPD_SCRIPT_URL &&
                        !this.props.isAPPDScriptDisabled &&
                        !DEV_DISABLE_ANALYTICS &&
                        !this.props.isExperienceEditor
                    ) && <script src={envPublic.APPD_SCRIPT_URL} type='text/javascript' async />}

                    {!!(
                        envPublic.SPLUNK_RUM_ENABLED &&
                        !this.props.isAPPDScriptDisabled &&
                        !DEV_DISABLE_ANALYTICS &&
                        !this.props.isExperienceEditor
                    ) && (
                        <>
                            <script
                                src='https://cdn.signalfx.com/o11y-gdi-rum/v2.4.0/splunk-otel-web.js'
                                integrity='sha384-y1roVG1ZqRtK6YPe8dR4qIBWg3m2JCwESyToHsOm8c9GEjbJA8ZTFfMYEIqoxmpp'
                                crossOrigin='anonymous'
                            />
                            <script
                                id='splunk-rum-init'
                                dangerouslySetInnerHTML={{
                                    __html: `
                                        SplunkRum.init({
                                            realm: 'eu2',
                                            rumAccessToken: '${envPublic.SPLUNK_RUM_ACCESS_TOKEN}',
                                            applicationName: '${envPublic.SPLUNK_RUM_APP_NAME}',
                                            deploymentEnvironment: '${envPublic.SPLUNK_ENVIRONMENT_NAME}',
                                            version: '${envPublic.SPLUNK_RUM_APP_VERSION}',
                                            tracer: {
                                              sampler: new SplunkRum.SessionBasedSampler({
                                                ratio: ${envPublic.SPLUNK_RUM_TRACER_SAMPLING_RATIO}
                                              }),
                                            }
                                        });
                                    `,
                                }}
                            />
                        </>
                    )}

                    {!!(
                        envPublic.SPLUNK_RUM_SESSION_RECORDER_ENABLED &&
                        !this.props.isAPPDScriptDisabled &&
                        !DEV_DISABLE_ANALYTICS &&
                        !this.props.isExperienceEditor
                    ) && (
                        <>
                            <script
                                src='https://cdn.signalfx.com/o11y-gdi-rum/v2.4.0/splunk-otel-web-session-recorder.js'
                                integrity='sha384-08TZUK3LE2oXW/1HgfB0gNS5uQcYii5otmPFldyVLCAB0fE4U4jQKXBLuk+sQ4cJ'
                                crossOrigin='anonymous'
                            />
                            <script
                                id='splunk-rum-recorder-init'
                                dangerouslySetInnerHTML={{
                                    __html: `
                                        SplunkSessionRecorder.init({
                                            realm: 'eu2',
                                            rumAccessToken: '${envPublic.SPLUNK_RUM_ACCESS_TOKEN}',
                                            sampler: new SplunkRum.SessionBasedSampler({
                                                ratio: ${envPublic.SPLUNK_RUM_RECORDER_SAMPLING_RATIO}
                                            })
                                        });
                                    `,
                                }}
                            />
                        </>
                    )}

                    {!this.props.noAnalytics && !!this.ensightenScript && (
                        <script src={this.ensightenScript} type='text/javascript' async />
                    )}

                    <script
                        type='text/javascript'
                        dangerouslySetInnerHTML={{
                            __html: `window.NEXT_ENV = ${JSON.stringify(envPublic)}; window.NO_ANALYTICS = ${!!this
                                .props.noAnalytics};`,
                        }}
                    />
                    {this.props.isIframe && (
                        <script
                            type='text/javascript'
                            dangerouslySetInnerHTML={{
                                __html: `window.IS_IFRAME = true;`,
                            }}
                        />
                    )}

                    {this.props.isPostPage && (
                        // here we add script to skip initial history replace by Next.js router as it breaks reloading of POST pages (they reload as GET losing payload)
                        <script
                            type='text/javascript'
                            dangerouslySetInnerHTML={{
                                __html: `var firstSkipped=!1,replaceState=history.replaceState;history.replaceState=function(e,un,u){firstSkipped?replaceState.call(history,e,un||'',u||undefined):firstSkipped=!0};`,
                            }}
                        />
                    )}
                    {this.isGAEnabled && (
                        // Google Tag Manager
                        <>
                            <link rel='dns-prefetch' href={`${envPublic.GOOGLE_TAG_MANAGER_URL}`} />
                            <script
                                dangerouslySetInnerHTML={{
                                    __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
                                j.async=true;
                                j.src='${envPublic.GOOGLE_TAG_MANAGER_URL}/gtm.js?id='+i+dl;
                                f.parentNode.insertBefore(j,f);
                                })(window,document,'script','dataLayer', "${this.GATagManger}");`,
                                }}
                            />
                        </>
                        // End Google Tag Manager
                    )}
                </Head>
                <body>
                    {this.isGAEnabled && (
                        // Google Tag Manager (noscript)
                        <noscript>
                            <iframe
                                src={`${envPublic.GOOGLE_TAG_MANAGER_URL}/ns.html?id=${this.GATagManger}`}
                                height='0'
                                width='0'
                                style={{ display: 'none', visibility: 'hidden' }}
                                title='Google Tag Manager'
                            ></iframe>
                        </noscript>
                        // End Google Tag Manager (noscript)
                    )}

                    <Main />
                    <NextScript />

                    <div id='modal-portal-root'></div>
                </body>
            </Html>
        );
    }
}

export default MyDocument;
