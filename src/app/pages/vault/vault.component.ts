import { Component, OnDestroy, OnInit } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import {
  MetaMaskWalletApiService,
  VaultdMetaMaskWalletApiService,
} from '@core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { Unsubscribable, Observable, interval } from 'rxjs';
import { ApproveComponent, VaultStakeComponent } from '@shared';
import { Store } from '@ngrx/store';
import BigNumber from 'bignumber.js';
import { O3_TOKEN, Token } from '@lib';
interface State {
  language: any;
}
interface State {
  vault: any;
}
@Component({
  selector: 'app-vault',
  templateUrl: './vault.component.html',
  styleUrls: ['./vault.component.scss', './mobile.scss'],
})
export class VaultComponent implements OnInit, OnDestroy {
  langPageName = 'vault';
  langUnScribe: Unsubscribable;
  language$: Observable<any>;
  lang: string;
  vault$: Observable<any>;
  vaultUnScribe: Unsubscribable;

  o3Locked = '--';
  o3Available = '--';
  o3Total = '--';
  o3UnlockSpeed = '--';
  o3ClaimableUnlocked = '--';
  stakeUnlockTokenList: any[] = [
    {
      assetID: '0xd5d63dce45e0275ca76a8b2e9bd8c11679a57d0d',
      symbol: 'LP',
      decimals: 18,
      amount: '0',
      chain: 'ETH',
      logo: '/assets/images/tokens/lp-eth.png',
    },
  ];
  constructor(
    private store: Store<State>,
    private modal: NzModalService,
    private nzMessage: NzMessageService,
    private metaMaskWalletApiService: MetaMaskWalletApiService,
    private vaultdMetaMaskWalletApiService: VaultdMetaMaskWalletApiService
  ) {
    this.language$ = store.select('language');
    this.langUnScribe = this.language$.subscribe((state) => {
      this.lang = state.language;
    });
    this.vault$ = store.select('vault');
  }

  ngOnInit(): void {
    this.vaultUnScribe = this.vault$.subscribe((state) => {
      this.initO3Data();
    });
    interval(5000).subscribe(() => {
      if (this.vaultdMetaMaskWalletApiService.vaultWallet) {
        this.initO3Data();
      }
    });
  }
  ngOnDestroy(): void {
    if (this.vaultUnScribe) {
      this.vaultUnScribe.unsubscribe();
    }
    if (this.langUnScribe) {
      this.langUnScribe.unsubscribe();
    }
  }

  async initO3Data(): Promise<void> {
    this.o3Locked =
      (await this.vaultdMetaMaskWalletApiService.getLockedOf()) || '--';
    this.o3Available =
      (await this.vaultdMetaMaskWalletApiService.getUnlockedOf()) || '--';
    this.o3UnlockSpeed =
      (await this.vaultdMetaMaskWalletApiService.getUnlockSpeed(
        this.stakeUnlockTokenList[0]
      )) || '--';
    this.o3ClaimableUnlocked =
      (await this.vaultdMetaMaskWalletApiService.claimableUnlocked(
        this.stakeUnlockTokenList[0]
      )) || '--';
    this.stakeUnlockTokenList.forEach(async (item: any) => {
      item.staked =
        (await this.vaultdMetaMaskWalletApiService.getStaked(item)) || '--';
      item.remaining =
        (await this.metaMaskWalletApiService.getBalancByHash(item)) || '--';
    });
    const totleNum = new BigNumber(this.o3Locked).plus(
      new BigNumber(this.o3Available)
    );
    if (!totleNum.isNaN()) {
      this.o3Total = totleNum.toFixed();
    } else {
      this.o3Total = '--';
    }
  }

  async showStake(token: Token, balance: string, isStake: boolean = true): Promise<void> {
    const modal = this.modal.create({
      nzContent: VaultStakeComponent,
      nzFooter: null,
      nzTitle: null,
      nzClosable: false,
      nzClassName: 'custom-modal custom-stake-modal',
      nzComponentParams: {
        token,
        balance,
        isStake
      },
    });
    modal.afterClose.subscribe(async (res) => {
      if (res) {
        const showApprove = await this.checkShowApprove(
          token,
          this.vaultdMetaMaskWalletApiService.vaultWallet.address,
          res
        );
        if (showApprove === true) {
          this.showApproveModal(token);
          return;
        }
        if (isStake) {
          this.vaultdMetaMaskWalletApiService.stakeO3(token, res);
        } else {
          this.vaultdMetaMaskWalletApiService.unstakeO3(token, res);
        }
      }
    });
  }

  async checkShowApprove(
    token: Token,
    address: string,
    inputAmount: string
  ): Promise<boolean> {
    const balance = await this.metaMaskWalletApiService.getAllowance(
      token,
      address,
      null,
      O3_TOKEN.assetID
    );
    if (new BigNumber(balance).comparedTo(new BigNumber(inputAmount)) >= 0) {
      return false;
    } else {
      return true;
    }
  }
  showApproveModal(token: Token): void {
    const walletName = this.vaultdMetaMaskWalletApiService.vaultWallet
      .walletName;
    const address = this.vaultdMetaMaskWalletApiService.vaultWallet.address;
    this.modal.create({
      nzContent: ApproveComponent,
      nzFooter: null,
      nzTitle: null,
      nzClosable: false,
      nzMaskClosable: false,
      nzClassName: 'custom-modal',
      nzComponentParams: {
        fromToken: token,
        fromAddress: address,
        walletName,
        isO3Stake: true,
      },
    });
  }
}
