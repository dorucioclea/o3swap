import { Component, OnInit } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ApiService } from '@core';
import { CommonHttpResponse } from '@lib';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  lang = 'en';
  copyRightYear = new Date().getFullYear();
  constructor(
    private nzMessage: NzMessageService,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
  }
}
