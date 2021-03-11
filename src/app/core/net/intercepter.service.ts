import { Injectable, Injector } from '@angular/core';
import {
    HttpInterceptor as NgHttpInterceptor,
    HttpEvent,
    HttpHandler,
    HttpRequest,
    HttpResponseBase,
    HttpResponse,
} from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, mergeMap } from 'rxjs/operators';

import { CommonHttpResponse } from '@lib';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzMessageService } from 'ng-zorro-antd/message';

// http 错误码对应错误信息
const CODE_MESSAGE = {
    0: '未知错误',
    200: '服务器成功返回请求的数据。',
    201: '新建或修改数据成功。',
    202: '一个请求已经进入后台排队（异步任务）。',
    204: '删除数据成功。',
    400: '发出的请求有错误，服务器没有进行新建或修改数据的操作。',
    401: '用户没有权限（令牌、用户名、密码错误）。',
    403: '未登录或登录已过期，请重新登录。',
    404: '发出的请求针对的是不存在的记录，服务器没有进行操作。',
    406: '请求的格式不可得。',
    410: '请求的资源被永久删除，且不会再得到的。',
    422: '当创建一个对象时，发生一个验证错误。',
    500: '服务器发生错误，请检查服务器。',
    502: '网关错误。',
    503: '服务不可用，服务器暂时过载或维护。',
    504: '网关超时。',
};

// 返回错误码对应错误信息
const RESPONSE_ERROR = {};
// 不弹窗显示的错误码
const INGORE_ERROR = new Set([]);

@Injectable()
export class HttpInterceptor implements NgHttpInterceptor {
    constructor(
        private nzNotification: NzNotificationService,
        private injector: Injector
    ) {}

    intercept(
        request: HttpRequest<any>,
        next: HttpHandler
    ): Observable<HttpEvent<any>> {
        return next.handle(request).pipe(
            mergeMap((event: any) => {
                // 允许统一对请求错误处理
                if (event instanceof HttpResponseBase) {
                    return this.handleError(event);
                }
                // 若一切都正常，则后续操作
                return of(event);
            }),
            catchError((error) => {
                return this.handleError(error);
            })
        );
    }

    private get message(): NzMessageService {
        return this.injector.get(NzMessageService);
    }

    private checkStatus(ev: HttpResponseBase): any {
        if (ev.status >= 200 && ev.status < 300 || ev.status === 400) {
            return;
        }
        const errortext = CODE_MESSAGE[ev.status] || ev.statusText;
        this.nzNotification.error(`请求错误 ${ev.status}: `, errortext);
    }

    private handleError(ev: HttpResponseBase): Observable<any> {
        this.checkStatus(ev);
        switch (ev.status) {
            case 200:
                if (ev instanceof HttpResponse) {
                    const body: CommonHttpResponse = ev.body;
                    if (
                        body.status === 'error' &&
                        INGORE_ERROR.has(body.error_code) === false
                    ) {
                        const errortext =
                            RESPONSE_ERROR[body.error_code] || body.error_msg;
                        this.message.error(errortext);
                    }
                    return of(ev);
                }
                break;
        }
        return of(ev);
    }
}
