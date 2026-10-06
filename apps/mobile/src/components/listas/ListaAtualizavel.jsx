import React, { useCallback, useState } from "react";
import { FlatList, RefreshControl, StyleSheet } from "react-native";

export function ListaAtualizavel({ dados, onRefreshData, renderItem }) {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await onRefreshData();
    } finally {
      setRefreshing(false);
    }
  }, [onRefreshData]);

  return (
    <FlatList
      data={dados}
      keyExtractor={(item, index) => (item.id ? item.id.toString() : index.toString())}
      renderItem={renderItem}
      contentContainerStyle={dados.length === 0 && styles.emptyContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#007AFF"]} tintColor="#007AFF" />}
    />
  );
}

const styles = StyleSheet.create({ emptyContainer: { flexGrow: 1, justifyContent: "center" } });
