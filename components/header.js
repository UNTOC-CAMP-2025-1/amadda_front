import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { themeColors, categories, groups } from "../Colors";

const Header = () => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.headerText}>Amadda</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 110,
    backgroundColor: themeColors.bg,
    justifyContent: "center",
    alignItems: "center",
  },
  headerText: {
    color: themeColors.text,
    fontSize: 27,
    fontWeight: 400,
  },
});

export default Header;
