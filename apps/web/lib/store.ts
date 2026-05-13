import { configureStore } from "@reduxjs/toolkit";

import { cartApi } from "./cart-api";

export function makeStore(): ReturnType<typeof configureStore> {
  return configureStore({
    reducer: {
      [cartApi.reducerPath]: cartApi.reducer,
    },
    middleware: (gdm) => gdm().concat(cartApi.middleware),
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
