import AsyncStorage from "@react-native-async-storage/async-storage";
import { criarFavoritosStore } from "@busca-bus/core";

export const useFavoritosStore = criarFavoritosStore(AsyncStorage);
