import { Component } from 'preact';
import { translate } from 'react-i18next';
import { apiGet, apiPost } from '../../../utils/request';
import { Button, Checkbox, Input } from '../../../components/forms';
import { Guide } from '../../../components/guide/guide';
import Status from '../../../components/status/status';
import WaitDialog from '../../../components/wait-dialog/wait-dialog';
import Balance from '../../../components/balance/balance';
import FeeTargets from './feetargets';
import Toast from '../../../components/toast/Toast';
import style from './send.css';

@translate()
export default class Send extends Component {

    constructor(props) {
        super(props);

        let coin = props.wallet.coinCode.toUpperCase();
        if (coin.length === 4 && coin.startsWith('T')) {
            coin = coin.substring(1);
        }

        this.state = {
            feeTarget: null,
            proposedFee: null,
            proposedAmount: null,
            proposedTotal: null,
            valid: false,
            addressError: null,
            amountError: null,
            sendAll: false,
            isSent: false,
            paired: null,
            amountFiat: null,
            coin,
        };
    }

    componentDidMount() {
        if (this.props.deviceIDs.length > 0) {
            apiGet('devices/' + this.props.deviceIDs[0] + '/paired').then((paired) => {
                this.setState({ paired });
            });
        }
    }

    send = () => {
        this.props.setConfirmation({ isConfirming: true });
        apiPost('wallet/' + this.props.walletCode + '/sendtx', this.txInput()).then(res => {
            if (res.success) {
                this.setState({
                    isSent: true,
                    recipientAddress: null,
                    proposedAmount: null,
                    proposedFee: null,
                    proposedTotal: null,
                    amount: null,
                });
            }
            this.props.setConfirmation({ isConfirming: false });
        }).catch(() => {
            this.props.setConfirmation({ isConfirming: false });
        });
    }

    txInput = () => ({
        address: this.state.recipientAddress,
        amount: this.state.amount,
        feeTarget: this.state.feeTarget,
        sendAll: this.state.sendAll ? 'yes' : 'no',
    })

    sendDisabled = () => {
        const txInput = this.txInput();
        return !txInput.address || !txInput.feeTarget || (txInput.sendAll === 'no' && !txInput.amount);
    }

    validateAndDisplayFee = () => {
        this.setState({
            proposedFee: null,
            proposedTotal: null,
            addressError: null,
            amountError: null,
        });
        if (this.sendDisabled()) {
            return;
        }
        const txInput = this.txInput();
        apiPost('wallet/' + this.props.walletCode + '/tx-proposal', txInput).then(result => {
            this.setState({ valid: result.success });
            if (result.success) {
                this.setState({
                    proposedFee: result.fee,
                    proposedAmount: result.amount,
                    proposedTotal: result.total,
                });
            } else {
                const error = result.errMsg;
                switch (error) {
                case 'invalid address':
                    this.setState({ addressError: error });
                    break;
                case 'invalid amount':
                    this.setState({ amountError: error });
                    break;
                default:
                    /* eslint no-alert: 0 */
                    alert(error);
                }
            }
        }).catch(() => {
            this.setState({ valid: false });
        });
    }

    handleFormChange = event => {
        let value = event.target.value;
        if (event.target.id === 'sendAll') {
            value = event.target.checked;
        } else if (event.target.id.startsWith('amount')) {
            this.convertToFiat(value);
        }
        this.setState({
            [event.target.id]: value,
            proposedFee: null,
            proposedTotal: null,
        });
    }

    handleFiatInput = event => {
        const value = event.target.value;
        this.setState({ amountFiat: value });
        this.convertFromFiat(value);
    }

    convertToFiat = value => {
        const fiat = this.props.unitFiat.toUpperCase();
        apiGet(`coins/convert?from=${this.state.coin}&to=${fiat}&amount=${value}`)
            .then(amountFiat => this.setState({ amountFiat }));
    }

    convertFromFiat = value => {
        const fiat = this.props.unitFiat.toUpperCase();
        apiGet(`coins/convert?from=${fiat}&to=${this.state.coin}&amount=${value}`)
            .then(amount => this.setState({ amount }));
    }

    sendAll = event => {
        this.handleFormChange(event);
        this.validateAndDisplayFee();
    }

    feeTargetChange = feeTarget => {
        this.setState({ feeTarget });
        this.validateAndDisplayFee();
    }

    render({
        t,
        wallet,
        walletCode,
        walletInitialized,
        unit,
        unitFiat,
        isConfirming,
        balance,
        guide,
    }, {
        proposedFee,
        proposedTotal,
        recipientAddress,
        proposedAmount,
        valid,
        amount,
        amountFiat,
        sendAll,
        feeTarget,
        isSent,
        addressError,
        amountError,
        paired,
    }) {
        return (
            <div class="contentWithGuide">
                <div class="container">
                    <div class="headerContainer">
                        <div class="header">
                            <Balance name={wallet.name} balance={balance}>
                                {
                                    balance && balance.hasIncoming && (
                                        <h5 class={style.pendingBalance}>
                                            {balance.incoming}
                                            <span style="color: var(--color-light);">{balance.incoming.unit}</span>
                                            {' '}
                                            {t('account.incoming')}
                                        </h5>
                                    )
                                }
                            </Balance>
                        </div>
                        <Status type="warning">
                            {paired === false && t('warning.sendPairing')}
                        </Status>
                    </div>
                    <div class="innerContainer">
                        <div class="content">
                            <div class="row">
                                <div class="subHeaderContainer first">
                                    <div class="subHeader">
                                        <h3>{t('send.title')}</h3>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <Input
                                    label={t('send.address.label')}
                                    placeholder={t('send.address.placeholder')}
                                    id="recipientAddress"
                                    error={addressError}
                                    onInput={this.handleFormChange}
                                    onChange={this.validateAndDisplayFee}
                                    value={recipientAddress}
                                    autofocus
                                />
                            </div>
                            <div class="row">
                                <div class="flex flex-1 flex-row flex-between flex-items-center spaced">
                                    <Input
                                        label={t('send.amount.label')}
                                        id="amount"
                                        onInput={this.handleFormChange}
                                        onChange={this.validateAndDisplayFee}
                                        disabled={sendAll}
                                        error={amountError}
                                        value={sendAll ? proposedAmount && proposedAmount.amount : amount}
                                        placeholder={`${t('send.amount.placeholder')} (${unit})`} />
                                    <Input
                                        label={unitFiat.toUpperCase()}
                                        id="amountFiat"
                                        onInput={this.handleFiatInput}
                                        disabled={sendAll}
                                        error={amountError}
                                        value={amountFiat}
                                        placeholder="" />
                                </div>
                                <Checkbox
                                    label={t('send.maximum')}
                                    id="sendAll"
                                    onChange={this.sendAll}
                                    checked={sendAll}
                                    className={style.maxAmount} />
                            </div>
                            <div class="row">
                                <div class="flex flex-1 flex-row flex-between flex-items-center spaced">
                                    <FeeTargets
                                        label={t('send.feeTarget.label')}
                                        placeholder={t('send.feeTarget.placeholder')}
                                        walletCode={walletCode}
                                        disabled={!amount && !sendAll}
                                        walletInitialized={walletInitialized}
                                        onFeeTargetChange={this.feeTargetChange}
                                    />
                                    <Input
                                        label={t('send.fee.label')}
                                        value={proposedFee ? proposedFee.amount + ' ' + proposedFee.unit : null}
                                        placeholder={feeTarget === 'custom' ? t('send.fee.customPlaceholder') : t('send.fee.placeholder')}
                                        disabled={feeTarget !==  'custom'}
                                    />
                                    {/*
                                    <Input
                                        label={t('send.customFee.label')}
                                        placeholder={t('send.customFee.placeholder')}
                                        disabled
                                    />
                                    */}
                                </div>
                            </div>
                            <div class={['row', 'buttons', 'flex', 'flex-row', 'flex-between', 'flex-start'].join(' ')}>
                                <Button secondary onClick={this.props.onClose}>
                                    {t('button.back')}
                                </Button>
                                <Button primary onClick={this.send} disabled={this.sendDisabled() || !valid}>
                                    {t('button.send')}
                                </Button>
                            </div>
                        </div>
                    </div>
                    {
                        isConfirming && (
                            <WaitDialog title={t('send.confirm.title')} includeDefault>
                                <div class={style.confirmationBox}>
                                    <div class="row">
                                        <p class={['label', style.confirmationLabel, 'first'].join(' ')}>
                                            {t('send.address.label')}
                                        </p>
                                        <p class={style.confirmationValue}>{recipientAddress || 'N/A'}</p>
                                    </div>
                                    <div class="flex flex-row flex-start spaced">
                                        <div>
                                            <p class={['label', style.confirmationLabel].join(' ')}>
                                                {t('send.amount.label')}
                                            </p>
                                            <p class={style.confirmationValue}>{proposedAmount && proposedAmount.amount + ' ' + proposedAmount.unit || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p class={['label', style.confirmationLabel].join(' ')}>
                                                {t('send.fee.label')}
                                                ({feeTarget})
                                            </p>
                                            <p class={style.confirmationValue}>{proposedFee && proposedFee.amount + ' ' + proposedFee.unit || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <p class={['label', style.confirmationLabel].join(' ')}>
                                        {t('send.total.label')}
                                    </p>
                                    <p class={[style.confirmationValue, style.standOut].join(' ')}>{proposedTotal && proposedTotal.amount + ' ' + proposedTotal.unit || 'N/A'}</p>
                                </div>
                            </WaitDialog>
                        )
                    }
                    {
                        isSent && (
                            <Toast
                                theme="success"
                                message={t('send.success')}
                                withGuide={guide.shown}
                                onHide={() => this.setState({ isSent: false })}
                            />
                        )
                    }
                </div>
                <Guide guide={guide} screen="send" />
            </div>
        );
    }
}
