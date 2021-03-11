import { Component, OnInit } from '@angular/core';
import BigNumber from 'bignumber.js';
import { ALL_TOKENS, SWAP_CONTRACT_HASH } from '@lib';
import { Token } from '@lib';
import { ApiService, CommonService } from '@core';
import { InvokeOutput } from 'o3-dapi-neo/lib/modules/write/invoke';
import { NzMessageService } from 'ng-zorro-antd/message';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';

type PageStatus = 'home' | 'tokenList' | 'setting' | 'inquiring' | 'result';
type SelectTokenType = 'from' | 'to';
const defaultResult = [
  {
    swapPath: ['FLM', 'nNEO', 'pnUSDT'],
    amount: [1500000, 21126, 5180],
  },
  {
    swapPath: ['FLM', 'pnWBTC', 'pnUSDT'],
    amount: [1500000, 21126, 13, 4933],
  },
];

@Component({
  selector: 'app-swap',
  templateUrl: './swap.component.html',
  styleUrls: ['./swap.component.less'],
})
export class SwapComponent implements OnInit {
  TX_PAGES_PREFIX = 'https://testnet.neotube.io/transaction/';
  // txhash = '0xff2eaa131b5b65caa64c048224a9860742194cfb5dbff5c44790ec4e406a45cf';
  // txPage = this.TX_PAGES_PREFIX + this.txhash;
  txhash: string;
  txPage: string;
  o3SwapFee = '0.3'; // 系统收费 0.3%
  myNeoDapi;
  account;
  walletType;
  tokenBalance = {}; // 账户的 tokens

  TOKENS: any[] = []; // 所有的 tokens
  displayTokens: any[] = []; // 排除了 fromToken 或 toToken 的 tokens
  tokens: any[] = []; // 最终展示的 tokens

  pageStatus: PageStatus = 'home';
  rates = {};
  showRoutingModal = false; // swap 路径弹窗
  showTxHashModal = false;
  isTxPending = true;

  selectTokenType: SelectTokenType;
  fromToken: Token;
  toToken: Token;
  chooseToken: Token;

  inputAmount: string; // 支付的 token 数量
  inputAmountFiat: string; // 支付的 token 美元价值
  inputAmountError: string;
  receiveSwapPathArray;
  chooseSwapPath;
  chooseSwapPathIndex;
  inquiryInterval; // 询价定时器
  changeData = false; // 询价后回到’home‘后，重新输入数量、from、 to => changeData = true
  price; // swap 比
  lnversePrice; // swap 反比

  // setting slip
  slipValueGroup = [0.1, 0.5, 1, 2];
  defaultSlipValue = 2; // 默认滑点 2%
  slipValue: any = this.defaultSlipValue;
  isCustomSlip = false; // 自定义滑点
  slipValueError: string;

  defaultDeadline = 10; // 分钟
  deadline = this.defaultDeadline;

  constructor(
    private apiService: ApiService,
    private nzMessage: NzMessageService,
    private commonService: CommonService
  ) {}

  ngOnInit(): void {
    this.apiService.myNeoDapiSub$.subscribe((res) => {
      this.myNeoDapi = res;
    });
    this.apiService.accountSub$.subscribe((res) => {
      this.account = res;
    });
    this.apiService.walletTypeSub$.subscribe((res) => {
      this.walletType = res;
    });
    this.TOKENS = ALL_TOKENS[this.apiService.chain];
    this.apiService.tokenBalanceSub$.subscribe((res) => {
      this.tokenBalance = res;
      this.handleTokenAmount();
    });
    this.getRates();
  }

  handleTokenAmount(): void {
    if (this.fromToken && this.tokenBalance[this.fromToken.assetID]) {
      this.fromToken.amount = this.tokenBalance[this.fromToken.assetID].amount;
    }
    this.TOKENS.forEach((tokenItem, index) => {
      if (this.tokenBalance[tokenItem.assetID]) {
        this.TOKENS[index].amount = this.tokenBalance[tokenItem.assetID].amount;
      }
    });
    this.displayTokens.forEach((tokenItem, index) => {
      if (this.tokenBalance[tokenItem.assetID]) {
        this.displayTokens[index].amount = this.tokenBalance[
          tokenItem.assetID
        ].amount;
      }
    });
    this.tokens.forEach((tokenItem, index) => {
      if (this.tokenBalance[tokenItem.assetID]) {
        this.tokens[index].amount = this.tokenBalance[tokenItem.assetID].amount;
      }
    });
  }

  calcutionInputAmountFiat(): void {
    if (!this.fromToken) {
      return;
    }
    const price = this.rates[this.fromToken.symbol];
    if (this.inputAmount && price) {
      this.inputAmountFiat = new BigNumber(this.inputAmount)
        .multipliedBy(new BigNumber(price))
        .dp(2)
        .toFixed();
    } else {
      this.inputAmountFiat = '';
    }
  }

  getRates(): void {
    this.apiService.getRates().subscribe((res) => {
      this.rates = res;
    });
  }
  resetSwapData(): void {
    this.changeData = true;
    this.chooseSwapPath = {};
  }

  //#region home page
  checkInputAmount(): boolean {
    const decimalPart = this.inputAmount && this.inputAmount.split('.')[1];
    if (
      this.fromToken &&
      decimalPart &&
      decimalPart.length > this.fromToken.decimals
    ) {
      this.inputAmountError = `You've exceeded the decimal limit.`;
      return false;
    }
    this.inputAmountError = '';
    return true;
  }
  changeInputAmount($event): void {
    this.inputAmount = $event.target.value;
    this.checkInputAmount();
    this.resetSwapData();
    this.calcutionInputAmountFiat();
  }

  allInputAmount(): void {
    this.inputAmount = this.fromToken.amount;
    this.resetSwapData();
    this.calcutionInputAmountFiat();
  }

  showTokens(type: SelectTokenType): void {
    this.selectTokenType = type;
    this.pageStatus = 'tokenList';
    if (type === 'from') {
      this.chooseToken = this.fromToken;
      if (this.toToken) {
        this.tokens = this.TOKENS.filter(
          (token) => token.assetID !== this.toToken.assetID
        );
      } else {
        this.tokens = this.TOKENS;
      }
    } else {
      this.chooseToken = this.toToken;
      if (this.fromToken) {
        this.tokens = this.TOKENS.filter(
          (token) => token.assetID !== this.fromToken.assetID
        );
      } else {
        this.tokens = this.TOKENS;
      }
    }
    this.displayTokens = this.tokens;
  }

  inquiry(): void {
    if (this.checkInputAmount() === false) {
      return;
    }
    this.pageStatus = 'inquiring';
    setTimeout(() => {
      this.getSwapPath();
    }, 1500);
    this.inquiryInterval = setInterval(() => {
      this.getSwapPath();
    }, 30000);
  }

  getSwapPath(): void {
    this.chooseSwapPath = null;
    this.apiService
      .getSwapPath(
        this.fromToken.symbol,
        this.toToken.symbol,
        this.getAmountIn()
      )
      .subscribe((res) => {
        if (res.length === 0) {
          this.pageStatus = 'home';
          this.nzMessage.error('支付数额太小或其他原因无法无法swap');
        }
        if (res.length > 0) {
          this.pageStatus = 'result';
          this.receiveSwapPathArray = res;
          this.handleReceiveSwapPathFiat();
          this.chooseSwapPathIndex = 0;
          this.chooseSwapPath = this.receiveSwapPathArray[0];
          this.calculationPrice();
        }
      });
  }

  getToNeoSwapPath(): Promise<any> {
    if (this.fromToken.symbol === 'nNEO') {
      return of(['nNEO']).toPromise();
    }
    return this.apiService
      .getSwapPath(this.fromToken.symbol, 'nNEO', this.getAmountIn())
      .pipe(
        map((res) => {
          return res[0].swapPath;
        })
      )
      .toPromise();
  }

  reGetSwapPath(): void {
    clearInterval(this.inquiryInterval);
    this.getSwapPath();
    this.inquiryInterval = setInterval(() => {
      this.getSwapPath();
    }, 30000);
  }
  handleReceiveSwapPathFiat(): void {
    this.receiveSwapPathArray.forEach((item, index) => {
      const tempAmount = item.amount[item.amount.length - 1];
      item.receiveAmount = new BigNumber(tempAmount).shiftedBy(
        -this.toToken.decimals
      );
      const price = this.rates[this.toToken.symbol];
      if (price) {
        this.receiveSwapPathArray[index].fiat = new BigNumber(
          item.receiveAmount
        )
          .multipliedBy(new BigNumber(price))
          .dp(2)
          .toFixed();
      }
    });
  }
  calculationPrice(): void {
    this.price = new BigNumber(this.chooseSwapPath.receiveAmount)
      .dividedBy(new BigNumber(this.inputAmount))
      .dp(7)
      .toFixed();
    this.lnversePrice = new BigNumber(this.inputAmount)
      .dividedBy(new BigNumber(this.chooseSwapPath.receiveAmount))
      .dp(7)
      .toFixed();
  }
  //#endregion

  //#region setting page
  selectSlipValue(value: number): void {
    this.slipValue = value;
    this.isCustomSlip = false;
    this.checkSlipValue();
  }
  clickCustomSlipValue(): void {
    this.isCustomSlip = true;
    this.slipValue = '';
  }
  checkSlipValue(): void {
    const tempSlip = Number(this.slipValue);
    if (Number.isNaN(tempSlip) || tempSlip <= 0) {
      return;
    }
    if (this.slipValue < 0.5) {
      this.slipValueError = 'Your transaction may fail';
    } else if (this.slipValue > 5) {
      this.slipValueError = 'Your transaction may be frontrun';
    } else {
      this.slipValueError = '';
    }
  }
  updateDeadline(): void {
    let tempDeadline = Math.floor(Number(this.deadline));
    if (Number.isNaN(tempDeadline) || tempDeadline <= 0) {
      tempDeadline = this.defaultDeadline;
    }
    this.deadline = tempDeadline;
  }
  closeSetting(): void {
    this.pageStatus = 'home';
    this.updateDeadline();
    const tempSlip = Number(this.slipValue);
    if (Number.isNaN(tempSlip) || tempSlip <= 0) {
      this.isCustomSlip = false;
      this.slipValue = this.defaultSlipValue;
    }
  }
  //#endregion

  //#region token list page
  selectThisToken(token): void {
    this.resetSwapData();
    if (this.selectTokenType === 'from') {
      this.fromToken = token;
      this.checkInputAmount();
      this.calcutionInputAmountFiat();
    } else {
      this.toToken = token;
    }
    this.pageStatus = 'home';
  }

  search($event): void {
    let value: string = $event.target.value;
    value = value.trim().toUpperCase();
    if (value === '') {
      this.tokens = this.displayTokens;
      return;
    }
    const tempTokens = this.displayTokens.filter((item) =>
      item.symbol.startsWith(value)
    );
    this.displayTokens.forEach((item) => {
      if (item.symbol.includes(value) && !item.symbol.startsWith(value)) {
        tempTokens.push(item);
      }
    });
    this.tokens = tempTokens;
  }
  //#endregion

  //#region result page
  resultBackHome(): void {
    this.pageStatus = 'home';
    this.changeData = false;
    clearInterval(this.inquiryInterval);
  }

  getAssetHashByName(name: string): string {
    const token = this.TOKENS.find((item) => item.symbol === name) || {};
    return token?.assetID || '';
  }

  getAmountIn(): string {
    return this.commonService.decimalToInteger(
      this.inputAmount,
      this.fromToken.decimals
    );
  }

  getAmountOutMin(): number {
    const amount = this.chooseSwapPath.amount[
      this.chooseSwapPath.amount.length - 1
    ];
    const factPercentage = new BigNumber(1).minus(
      new BigNumber(this.slipValue).shiftedBy(-2)
    );
    const factAmount = Math.ceil(
      new BigNumber(amount).times(factPercentage).toNumber()
    );
    return factAmount;
  }

  async swap(): Promise<void> {
    if (!this.account) {
      this.nzMessage.error('请先连接钱包');
      return;
    }
    if (
      new BigNumber(this.inputAmount).comparedTo(
        new BigNumber(this.fromToken.amount || 0)
      ) > 0
    ) {
      this.nzMessage.error('钱包余额不足');
      return;
    }
    clearInterval(this.inquiryInterval);
    const toNeoswapPath = await this.getToNeoSwapPath();
    const args = [
      {
        type: 'Address',
        value: this.account.address,
      },
      {
        type: 'Integer',
        value: this.getAmountIn(),
      },
      {
        type: 'Integer',
        value: this.getAmountOutMin(),
      },
      {
        type: 'Array',
        value: this.chooseSwapPath.swapPath.map((assetName) => ({
          type: 'Hash160',
          value: this.getAssetHashByName(assetName),
        })),
      },
      {
        type: 'Array',
        value: toNeoswapPath.map((assetName) => ({
          type: 'Hash160',
          value: this.getAssetHashByName(assetName),
        })),
      },
      {
        type: 'Integer',
        value: Math.floor(Date.now() / 1000 + this.deadline * 60),
      },
      {
        type: 'Integer',
        value: 0,
      },
    ];
    this.myNeoDapi
      .invoke({
        scriptHash: SWAP_CONTRACT_HASH,
        operation: 'DelegateSwapTokenInForTokenOut',
        args,
      })
      .then(({ txid }: InvokeOutput) => {
        this.showTxHashModal = true;
        this.isTxPending = true;
        this.txhash = '0x' + txid;
        this.txPage = this.TX_PAGES_PREFIX + this.txhash;
        window.addEventListener(
          'NEOLine.NEO.EVENT.TRANSACTION_CONFIRMED',
          (result: any) => {
            if (result.detail.txid === this.txhash) {
              this.isTxPending = false;
            }
          }
        );
      })
      .catch((error) => {
        console.log(error);
        switch (error.type) {
          case 'NO_PROVIDER':
            window.open(
              this.walletType === 'O3'
                ? 'https://o3.network/#download'
                : 'https://neoline.io'
            );
            break;
          case 'CONNECTION_DENIED':
            this.nzMessage.error(
              'The user rejected the request to connect with your dApp'
            );
            break;
          default:
            this.nzMessage.error(error.description || '');
            break;
        }
      });
  }
  //#endregion

  changeSwapPath(index: number): void {
    this.showRoutingModal = false;
    this.chooseSwapPathIndex = index;
    this.chooseSwapPath = this.receiveSwapPathArray[index];
    this.calculationPrice();
  }

  //#region tx hash 弹窗
  copy(hash: string): void {
    this.commonService.copy(hash);
  }
  closeTxHashModal(): void {
    this.showTxHashModal = false;
    this.pageStatus = 'home';
    this.fromToken = null;
    this.toToken = null;
    this.inputAmount = null;
    this.inputAmountFiat = null;
    this.chooseSwapPath = null;
    this.changeData = true;
  }
  //#endregion
}
