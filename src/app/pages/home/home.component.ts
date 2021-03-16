import { Component, OnInit } from '@angular/core';
import { ApiService } from '@core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  lang = 'en';
  copyRightYear = new Date().getFullYear();
  roadmapIndex = 0;
  roadmapLen = 5;
  roadmapInterval;
  enterActiviteFirst = false;
  enterActiviteLast = false;

  email = '';

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.roadmapIntervalFun();
  }

  roadmapIntervalFun(): void {
    this.roadmapInterval = setInterval(() => {
      this.roadmapIndex = (this.roadmapIndex + 1) % this.roadmapLen;
    }, 2000);
  }

  enterRoadmap(index: number): void {
    clearInterval(this.roadmapInterval);
    this.roadmapIndex = index;
  }

  leaveRoadmap(): void {
    this.roadmapIntervalFun();
  }

  subscriptNews(): void {
    const formData = new FormData();
    formData.append('EMAIL', this.email);

    console.log(this.email);
    // this.apiService.subscriptNews(formData).subscribe((res) => {
    //   console.log(res);
    // });
    const json = { EMAIL: this.email };
    this.apiService.subscriptNews(json).subscribe((res) => {
      console.log(res);
    });
  }

  changeLang(lang: 'en' | 'zh'): void {
    this.lang = lang;
    window.scrollTo({
      left: 0,
      top: 0,
      behavior: 'smooth',
    });
  }
}
