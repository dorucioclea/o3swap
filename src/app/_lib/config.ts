export interface CommonHttpResponse {
    status: 'success' | 'error';
    data?: any;
    error_msg?: string;
    error_code?: number;
}
