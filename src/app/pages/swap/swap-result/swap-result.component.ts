import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ALL_TOKENS, SWAP_CONTRACT_HASH, Token } from '@lib';
import { ApiService, CommonService } from '@core';
import { NzMessageService } from 'ng-zorro-antd/message';
import BigNumber from 'bignumber.js';
import { InvokeOutput } from 'o3-dapi-neo/lib/modules/write/invoke';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpResponse, HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-swap-result',
  templateUrl: './swap-result.component.html',
  styleUrls: ['../common.less', './swap-result.component.less'],
})
export class SwapResultComponent implements OnInit {
  @Input() rates;
  @Input() fromToken: Token;
  @Input() toToken: Token;
  @Input() inputAmount: string; // 支付的 token 数量
  @Input() deadline: number;
  @Input() slipValue: number;
  @Input() initData: any;
  @Output() closeResultPage = new EventEmitter<any>();

  myNeoDapi;
  account;
  walletType;

  TOKENS: Token[] = []; // 所有的 tokens
  o3SwapFee = '0.3'; // 系统收费 0.3%
  showRoutingModal = false; // swap 路径弹窗
  showTxHashModal = false;
  showInquiry: boolean;
  isTxPending = true;
  TX_PAGES_PREFIX = 'https://testnet.neotube.io/transaction/';
  // txhash = '0xff2eaa131b5b65caa64c048224a9860742194cfb5dbff5c44790ec4e406a45cf';
  // txPage = this.TX_PAGES_PREFIX + this.txhash;
  txhash: string;
  txPage: string;
  inquiryInterval; // 询价定时器

  chooseSwapPath: any;
  chooseSwapPathIndex;
  receiveSwapPathArray;
  price; // swap 比
  lnversePrice; // swap 反比

  constructor(
    private apiService: ApiService,
    private nzMessage: NzMessageService,
    private commonService: CommonService
  ) {
    this.apiService.myNeoDapiSub$.subscribe((res) => {
      this.myNeoDapi = res;
    });
    this.apiService.accountSub$.subscribe((res) => {
      this.account = res;
    });
    this.apiService.walletTypeSub$.subscribe((res) => {
      this.walletType = res;
    });
  }

  ngOnInit(): void {
    this.TOKENS = ALL_TOKENS[this.apiService.chain];
    if (this.initData) {
      this.chooseSwapPath = this.initData.chooseSwapPath;
      this.chooseSwapPathIndex = this.initData.chooseSwapPathIndex;
      this.receiveSwapPathArray = this.initData.receiveSwapPathArray;
      this.price = this.initData.price;
      this.lnversePrice = this.initData.lnversePrice;
      this.showInquiry = false;
    } else {
      this.showInquiry = true;
      this.getSwapPath();
    }
    this.inquiryInterval = setInterval(() => {
      this.getSwapPath();
    }, 30000);
  }

  backToHomePage(): void {
    clearInterval(this.inquiryInterval);
    const initData = {
      chooseSwapPath: this.chooseSwapPath,
      chooseSwapPathIndex: this.chooseSwapPathIndex,
      receiveSwapPathArray: this.receiveSwapPathArray,
      price: this.price,
      lnversePrice: this.lnversePrice,
    };
    this.closeResultPage.emit(initData);
  }
  copy(hash: string): void {
    this.commonService.copy(hash);
  }
  closeTxHashModal(): void {
    clearInterval(this.inquiryInterval);
    this.closeResultPage.emit();
  }

  changeSwapPath(index: number): void {
    this.showRoutingModal = false;
    this.chooseSwapPathIndex = index;
    this.chooseSwapPath = this.receiveSwapPathArray[index];
    this.calculationPrice();
  }

  reGetSwapPath(): void {
    clearInterval(this.inquiryInterval);
    this.getSwapPath();
    this.inquiryInterval = setInterval(() => {
      this.getSwapPath();
    }, 30000);
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
  //#region
  getSwapPath(): void {
    this.chooseSwapPath = null;
    this.apiService
      .getSwapPath(
        this.fromToken.symbol,
        this.toToken.symbol,
        this.getAmountIn()
      )
      .subscribe((event) => {
        if (event instanceof HttpResponse) {
          this.showInquiry = false;
          if (event.body.length === 0) {
            this.nzMessage.error('支付数额太小、太大或其他原因无法无法swap');
          }
          if (event.body.length > 0) {
            this.receiveSwapPathArray = event.body;
            this.handleReceiveSwapPathFiat();
            this.chooseSwapPathIndex = 0;
            this.chooseSwapPath = this.receiveSwapPathArray[0];
            this.calculationPrice();
          }
        } else if (event instanceof HttpErrorResponse) {
          this.showInquiry = false;
          clearInterval(this.inquiryInterval);
          if (event.status === 400) {
            this.nzMessage.error('支付数额太小、太大或其他原因无法无法swap');
          }
        }
      });
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
  getAssetHashByName(name: string): string {
    const token = this.TOKENS.find((item) => item.symbol === name);
    return (token && token.assetID) || '';
  }
  //#endregion
}
