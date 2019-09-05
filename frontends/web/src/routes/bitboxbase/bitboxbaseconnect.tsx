/**
 * Copyright 2019 Shift Devices AG
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Component, h, RenderableProps } from 'preact';
import { alertUser } from '../../components/alert/Alert';
import * as style from '../../components/bitboxbase/bitboxbase.css';
import { DetectedBase } from '../../components/bitboxbase/detectedbase';
import { confirmation } from '../../components/confirm/Confirm';
import { Button, Input } from '../../components/forms';
import { Header } from '../../components/layout';
import { Step, Steps } from '../../components/steps';
import * as stepStyle from '../../components/steps/steps.css';
import { Store } from '../../decorators/store';
import { translate, TranslateProps } from '../../decorators/translate';
import { apiPost } from '../../utils/request';

interface BitBoxBaseConnectProps {
    bitboxBaseIDs: string[];
    detectedBases: DetectedBitBoxBases;
    bitboxBaseID?: string;
    ip?: string;
}

interface State {
    showWizard?: boolean;
    activeStep?: number;
}

export interface DetectedBitBoxBases {
    [Hostname: string]: string;
}

export const bitboxBaseStore = new Store<BitBoxBaseConnectProps>({
    detectedBases: {},
    bitboxBaseIDs: [],
    bitboxBaseID: '',
    ip: '',
});

type Props = BitBoxBaseConnectProps & TranslateProps;

class BitBoxBaseConnect extends Component<Props, State> {

    constructor(props) {
        super(props);
        this.state = {
            showWizard: true,
            activeStep: 0,
        };
    }

    private handleFormChange = event => {
        bitboxBaseStore.setState({
            ip : event.target.value,
        });
    }

    private submit = (event: Event) => {
        event.preventDefault();
        apiPost('bitboxbases/connectbase', {
            ip: bitboxBaseStore.state.ip,
        }).then(data => {
            const { success } = data;
            if (!success) {
                alertUser(data.errorMessage);
            }
        });
    }

    private connect = (ip: string) => {
        apiPost('bitboxbases/connectbase', { ip })
        .then(data => {
            if (!data.success) {
                alertUser(data.errorMessage);
            }
        });
    }

    public componentWillUpdate() {
        bitboxBaseStore.setState({bitboxBaseIDs : this.props.bitboxBaseIDs});
    }

    public render(
        {
            t,
            ip,
            detectedBases,
        }: RenderableProps<Props>,
        { showWizard, activeStep }: State,
        ) {
            if (!showWizard) {
                return (
                    <div class="contentWithGuide">
                        <div class="container">
                            <Header title={<h2>{t('bitboxBase.title')}</h2>} />
                            <div class="innerContainer scrollableContainer">
                                <div class="content padded">
                                    <div>
                                        <h3>{t('bitboxBase.detectedBases')}</h3>
                                        {
                                            Object.entries(detectedBases).map(bases => (
                                            <DetectedBase
                                                hostname={bases[0]}
                                                ip={bases[1]}
                                                connect={this.connect}/>
                                        ))
                                        }
                                    </div>
                                    <div>
                                        <h3>{t('bitboxBase.manualInput')}</h3>
                                        <form onSubmit={this.submit}>
                                            <Input
                                                name="ip"
                                                onInput={this.handleFormChange}
                                                value={ip}
                                                placeholder="IP address:port"
                                            />
                                            <div class="flex flex-row flex-start flex-center flex-around">
                                                <button
                                                    className={[style.button, style.primary].join(' ')}
                                                    disabled={ip === ''}
                                                    onClick={this.submit}>
                                                    {t('bitboxBase.connect')}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
            } else {
                return (
                    <div class="contentWithGuide">
                        <div class="container">
                            <Header title={<h2>{t('bitboxBase.title')}</h2>} />
                            <div class="innerContainer scrollableContainer">
                                <div class="content padded">
                                    <Steps>

                                        <Step title="Verify Pairing Code" active={activeStep === 0} width={540}>
                                            <div className={stepStyle.stepContext}>
                                                <p>Please verify the pairing code matches what is shown on your BitBox Base.</p>
                                                <pre>THIS-IS-A-PAIRING-CODE-POOP</pre>
                                                <div className={['buttons text-center', stepStyle.fullWidth].join(' ')}>
                                                    <Button primary onClick={() => this.setState({ activeStep: 1 })}>Continue</Button>
                                                </div>
                                            </div>
                                        </Step>

                                        <Step title="Set a Password" active={activeStep === 1} width={540}>
                                            <div className={stepStyle.stepContext}>
                                                <Input
                                                    className={stepStyle.wizardLabel}
                                                    label="Password"
                                                    type="password"
                                                    placeholder="Enter Password" />
                                                <Input
                                                    className={stepStyle.wizardLabel}
                                                    label="Password Confirmation"
                                                    type="password"
                                                    placeholder="Confirm your password" />
                                                <div className={['buttons text-center', stepStyle.fullWidth].join(' ')}>
                                                    <Button primary onClick={() => this.setState({ activeStep: 2 })}>Continue</Button>
                                                </div>
                                            </div>
                                        </Step>

                                        <Step title="Choose Setup" active={activeStep === 2} large>
                                            <div className="columnsContainer half">
                                                <div className="columns">
                                                    <div className="column column-1-2">
                                                        <div className={stepStyle.stepContext}>
                                                            <h3 className={stepStyle.stepSubHeader}>Quick</h3>
                                                            <p>The quickest way to get started.</p>
                                                            <ul>
                                                                <li>Starts from pre-synced blockchain</li>
                                                                <li>Uses Tor by default</li>
                                                                <li>Chooses default hostname</li>
                                                            </ul>
                                                            <div className={['buttons text-center', stepStyle.fullWidth].join(' ')}>
                                                                <Button primary onClick={() => this.setState({ activeStep: 31 })}>Select</Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="column column-1-2">
                                                        <div className={stepStyle.stepContext}>
                                                            <h3 className={stepStyle.stepSubHeader}>Custom</h3>
                                                            <p>More control over your node.</p>
                                                            <ul>
                                                                <li>Lets you choose syncing options</li>
                                                                <li>Lets you choose network options</li>
                                                                <li>Choose custom hostname</li>
                                                            </ul>
                                                            <div className={['buttons text-center', stepStyle.fullWidth].join(' ')}>
                                                                <Button secondary onClick={() => this.setState({ activeStep: 13 })}>Select</Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Step>

                                        <Step title="Choose a Name" active={activeStep === 13} width={540}>
                                            <div className={stepStyle.stepContext}>
                                                <Input
                                                    className={stepStyle.wizardLabel}
                                                    label="Base name"
                                                    placeholder="My BitBox Base"
                                                    type="text" />
                                                <div className={['buttons text-center', stepStyle.fullWidth].join(' ')}>
                                                    <Button primary onClick={() => this.setState({ activeStep: 14 })}>Continue</Button>
                                                    <Button transparent onClick={() => this.setState({ activeStep: 2 })}>Go Back</Button>
                                                </div>
                                            </div>
                                        </Step>

                                        <Step title="Choose Syncing Option" active={activeStep === 14} width={540}>
                                            <div className={stepStyle.stepContext}>
                                                <div className={['buttons text-center', stepStyle.fullWidth].join(' ')} style="margin-top: 0 !important;">
                                                    <Button primary onClick={() => this.setState({ activeStep: 15 })}>Start from pre-synced blockchain</Button>
                                                    <Button primary onClick={() => {
                                                        confirmation('This process takes approximately 1 day. Are you sure you want to continue?', result => {
                                                            console.log(result);
                                                            this.setState({ activeStep: 15 });
                                                        });
                                                    }}>Validate from genesis block</Button>
                                                    <Button primary onClick={() => {
                                                        confirmation('This process takes approximately 1 ~ 2 days depending on your internet connection. Are you sure you want to continue?', result => {
                                                            console.log(result);
                                                            this.setState({ activeStep: 30 });
                                                        });
                                                    }}>Sync from scratch</Button>
                                                </div>
                                            </div>
                                        </Step>

                                        <Step title="Choose Network Option" active={activeStep === 15} width={540}>
                                            <div className={stepStyle.stepContext}>
                                                <div className={['buttons text-center', stepStyle.fullWidth].join(' ')} style="margin-top: 0 !important;">
                                                    <Button primary onClick={() => this.setState({ activeStep: 31 })}>Tor Only</Button>
                                                    <Button secondary onClick={() => this.setState({ activeStep: 31 })}>Clearnet Only</Button>
                                                </div>
                                            </div>
                                        </Step>

                                        <Step title="Choose Network Option" active={activeStep === 30} width={540}>
                                            <div className={stepStyle.stepContext}>
                                                <div className={['buttons text-center', stepStyle.fullWidth].join(' ')} style="margin-top: 0 !important;">
                                                    <Button primary onClick={() => this.setState({ activeStep: 31 })}>Tor Only</Button>
                                                    <Button secondary onClick={() => this.setState({ activeStep: 31 })}>Clearnet Only</Button>
                                                    <Button secondary onClick={() => this.setState({ activeStep: 31 })}>Clearnet Only for Initial Block Download</Button>
                                                </div>
                                            </div>
                                        </Step>

                                        <Step title="Wallet Backup" active={activeStep === 31} width={540}>
                                            <div className={stepStyle.stepContext}>
                                                <p>Insert USB memory stick into the BitBox Base to make a backup of your wallet.</p>
                                                <div className={['buttons text-center', stepStyle.fullWidth].join(' ')} style="margin-top: 0 !important;">
                                                    <Button primary onClick={() => this.setState({ activeStep: 32 })}>Continue</Button>
                                                </div>
                                            </div>
                                        </Step>

                                        <Step title="Wallet Backup Created" active={activeStep === 32} width={540}>
                                            <div className={stepStyle.stepContext}>
                                                <p>You may now remove the memory stick and store it in a secure location.</p>
                                                <div className={['buttons text-center', stepStyle.fullWidth].join(' ')} style="margin-top: 0 !important;">
                                                    <Button primary onClick={() => this.setState({ activeStep: 33 })}>Continue</Button>
                                                </div>
                                            </div>
                                        </Step>

                                        <Step title="You're Ready To Go!" active={activeStep === 33} width={540}>
                                            <div className={stepStyle.stepContext}>
                                                <div className={['buttons text-center', stepStyle.fullWidth].join(' ')} style="margin-top: 0 !important;">
                                                    <Button primary onClick={() => this.setState({ showWizard: false, activeStep: 0 })}>Go to Dashboard</Button>
                                                </div>
                                            </div>
                                        </Step>

                                    </Steps>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            }
        }
}

const HOC = translate<BitBoxBaseConnectProps>()(BitBoxBaseConnect);
export { HOC as BitBoxBaseConnect };
