import { criarBusStore, criarClienteApi } from "@busca-bus/core";

const clienteApi = criarClienteApi(process.env.EXPO_PUBLIC_API_URL);
export const useBusStore = criarBusStore(clienteApi);
