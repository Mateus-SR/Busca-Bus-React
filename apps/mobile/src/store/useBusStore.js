import { criarBusStore } from "@busca-bus/core/store";
import { criarClienteApi } from "@busca-bus/core/cliente";

const clienteApi = criarClienteApi(process.env.EXPO_PUBLIC_API_URL);
export const useBusStore = criarBusStore(clienteApi);
