import { Component, OnInit } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AnimationItem } from 'lottie-web';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  lang = 'en';
  copyRightYear = new Date().getFullYear();
  roadmapIndex = 0;
  roadmapLen = 4;
  roadmapInterval;
  enterActiviteFirst = false;
  enterActiviteLast = false;

  email = '';

  options = {
    path: '/assets/home-json/data.json',
  };

  constructor(private nzMessage: NzMessageService) {}

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
    if (this.checkEmail() === false) {
      this.nzMessage.error('please enter your vaild email');
      return;
    }
    const form = document.createElement('form');
    form.method = 'post';
    form.target = '_blank';
    form.action =
      'https://network.us1.list-manage.com/subscribe/post?u=3d72cfc6b405673c83b82325e&amp;id=f2135928fa';

    const hiddenField = document.createElement('input');
    hiddenField.type = 'hidden';
    hiddenField.name = 'EMAIL';
    hiddenField.value = this.email;
    form.appendChild(hiddenField);

    const node = document.createElement('div');
    node.setAttribute('aria-hidden', 'true');
    node.setAttribute('style', 'position: absolute; left: -5000px;');

    const nodeInput = document.createElement('input');
    nodeInput.type = 'text';
    nodeInput.name = 'b_3d72cfc6b405673c83b82325e_f2135928fa';
    nodeInput.setAttribute('tabindex', '-1');

    node.appendChild(nodeInput);
    form.appendChild(node);
    console.log(form);
    document.body.appendChild(form);
    form.submit();
  }

  checkEmail(): boolean {
    const regex = /^[_a-z0-9-]+(\.[_a-z0-9-]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,})$/;
    if (regex.test(this.email)) {
      return true;
    } else {
      return false;
    }
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
