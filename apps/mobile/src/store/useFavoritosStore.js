import AsyncStorage from "@react-native-async-storage/async-storage";
import { criarFavoritosStore } from "@busca-bus/core/store";

export const useFavoritosStore = criarFavoritosStore(AsyncStorage);
