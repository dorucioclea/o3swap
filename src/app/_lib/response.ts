export interface CommonHttpResponse {
  status: 'success' | 'error';
  data?: any;
  error_msg?: string;
  error_code?: number;
}

export interface AssetQueryResponseItem {
  amount: any[];
  swapPath: string[];
  fiat?: string;
  receiveAmount?: number | string;
  swapPathLogo?: string[];
}
export type AssetQueryResponse = AssetQueryResponseItem[];
