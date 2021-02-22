import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.less'],
})
export class HomeComponent implements OnInit {
  roadmapIndex = 0;
  roadmapLen = 5;
  roadmapInterval;
  enterActiviteFirst = false;
  enterActiviteLast = false;

  constructor() {}

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
}
