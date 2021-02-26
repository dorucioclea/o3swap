import { Component, OnInit } from '@angular/core';
// import o3dapi from 'o3-dapi-core';
import o3dapiNeo from 'o3-dapi-neo';
import BigNumber from 'bignumber.js';
import { ALL_TOKENS, SWAP_CONTRACT_HASH } from '@lib';
import { Token, CommonHttpResponse } from '@lib';
import { ApiService } from '@core';
import { InvokeOutput } from 'o3-dapi-neo/lib/modules/write/invoke';
import { NzMessageService } from 'ng-zorro-antd/message';

type PageStatus = 'home' | 'tokenList' | 'setting' | 'inquiring' | 'result';
type SelectTokenType = 'from' | 'to';
const defaultResult = [
  {
    swapPath: ['FLM', 'nNEO', 'pnUSDT'],
    amount: [1500000, 21126, 5180],
    receiveAmount: 5180,
    fiat: '-',
  },
  {
    swapPath: ['FLM', 'nNEO', 'pnWBTC', 'pnUSDT'],
    amount: [1500000, 21126, 13, 4933],
    receiveAmount: 4933,
    fiat: '-',
  },
];

@Component({
  selector: 'app-swap',
  templateUrl: './swap.component.html',
  styleUrls: ['./swap.component.less'],
})
export class SwapComponent implements OnInit {
  inquiryHost = 'http://localhost:5000/AssetQuery';
  myNeoDapi;
  account;
  walletType;

  TOKENS: any[] = []; // 所有的 tokens
  displayTokens: any[] = []; // 排除了 fromToken 或 toToken 的 tokens
  tokens: any[] = []; // 最终展示的 tokens

  pageStatus: PageStatus = 'home';
  tokenBalance = {}; // 账户的 tokens
  rates = {};
  showExchangeModal = false;
  inputError: string;

  selectTokenType: SelectTokenType;
  fromToken: Token;
  toToken: Token;
  chooseToken: Token;

  inputAmount: string; // 支付的 token 数量
  inputAmountFiat: string; // 支付的 token 美元价值
  receiveSwapPathArray;
  chooseSwapPath;
  chooseSwapPathIndex;
  inquiryTimeout: any;
  changeData = false;

  // setting slip
  slipValueGroup = [0.1, 0.5, 1, 2];
  defaultSlipValue = 2;
  slipValue: any = 2;
  isCustom = false;

  defaultDeadline = 10; // 分钟
  deadline = this.defaultDeadline;

  constructor(
    private apiService: ApiService,
    private nzMessage: NzMessageService
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

  getTokenRate(token: Token): string {
    const assetRate = this.rates[token.symbol.toLowerCase()];
    if (
      assetRate &&
      (token.symbol === 'NEO' || token.assetID.includes(assetRate.asset_id))
    ) {
      return assetRate.price;
    }
    return '';
  }

  calcutionInputAmountFiat(): void {
    if (!this.fromToken) {
      return;
    }
    const price = this.getTokenRate(this.fromToken);
    if (this.inputAmount && price) {
      this.inputAmountFiat = new BigNumber(this.inputAmount)
        .multipliedBy(new BigNumber(price))
        .toFixed(2);
    } else {
      this.inputAmountFiat = '-';
    }
  }

  getRates(): void {
    this.apiService.getRates().subscribe((res: CommonHttpResponse) => {
      if (res.status === 'success') {
        this.rates = res.data;
      }
    });
  }
  resetSwapData(): void {
    this.changeData = true;
    this.chooseSwapPath = {};
  }

  //#region home page
  changeInputAmount($event): void {
    this.inputAmount = $event.target.value;
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
    this.pageStatus = 'inquiring';
    this.inquiryTimeout = setTimeout(() => {
      this.pageStatus = 'result';
      this.receiveSwapPathArray = defaultResult;
      this.handleReceiveSwapPathFiat();
      this.chooseSwapPathIndex = 0;
      this.chooseSwapPath = this.receiveSwapPathArray[0];
    }, 1500);
  }

  handleReceiveSwapPathFiat(): void {
    this.receiveSwapPathArray.forEach((item, index) => {
      const price = this.getTokenRate(this.toToken);
      if (item.receiveAmount && price) {
        this.receiveSwapPathArray[index].fiat = new BigNumber(
          item.receiveAmount
        )
          .multipliedBy(new BigNumber(price))
          .toFixed(2);
      }
    });
  }
  //#endregion

  //#region setting page
  selectSlipValue(value: number): void {
    this.slipValue = value;
    this.isCustom = false;
  }
  inputSlipValue(): void {
    this.isCustom = true;
    this.slipValue = '';
  }
  updateDeadline(): void {
    let deadline = Math.floor(Number(this.deadline));
    if (
      this.deadline == null ||
      Number.isNaN(this.deadline) ||
      this.deadline <= 0
    ) {
      deadline = this.defaultDeadline;
    }
    this.deadline = deadline;
  }
  //#endregion

  //#region token list page
  selectThisToken(token): void {
    this.resetSwapData();
    if (this.selectTokenType === 'from') {
      this.fromToken = token;
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

  //#region inquiry page
  backHome(): void {
    this.pageStatus = 'home';
    clearTimeout(this.inquiryTimeout);
  }
  //#endregion

  //#region result page
  resultBackHome(): void {
    this.pageStatus = 'home';
    this.changeData = false;
  }

  getAssetHashByName(name: string): string {
    const token = this.TOKENS.find((item) => item.symbol === name) || {};
    return token?.assetID || '';
  }

  getAmountIn(): string {
    return new BigNumber(this.inputAmount)
      .times(1 - this.slipValue)
      .shiftedBy(this.fromToken.decimals)
      .toFixed();
  }

  getMinAmountOut(): string {
    return new BigNumber(this.chooseSwapPath.receiveAmount)
      .shiftedBy(this.toToken.decimals)
      .toFixed();
  }

  swap(): void {
    this.myNeoDapi
      .invoke({
        scriptHash: SWAP_CONTRACT_HASH,
        operation: 'swapTokenInForTokenOut',
        args: [
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
            value: this.getMinAmountOut(),
          },
          {
            type: 'Array',
            value: this.chooseSwapPath.swapPath.map((assetName) => ({
              type: 'Hash160',
              value: this.getAssetHashByName(assetName),
            })),
          },
          {
            type: 'Integer',
            value: Math.floor(Date.now() / 1000 + this.deadline * 60),
          },
        ],
      })
      .then(({ txid, nodeUrl }: InvokeOutput) => {
        console.log('Invoke transaction success!');
        console.log('Transaction ID: ' + txid);
        console.log('RPC node URL: ' + nodeUrl);
      })
      .catch((error) => {
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
}
