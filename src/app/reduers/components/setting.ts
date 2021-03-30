import { DEFAULT_DEADLINE, DEFAULT_SLIPVALUE, UPDATE_SETTING } from '@lib';

const initialState = {
  slipValue: DEFAULT_SLIPVALUE,
  isCustomSlip: false,
  deadline: DEFAULT_DEADLINE,
};

export default function setting(state = initialState, action): any {
  switch (action.type) {
    case UPDATE_SETTING:
      return action.data;
    default:
      return state;
  }
}
