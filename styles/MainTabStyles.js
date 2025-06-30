import { StyleSheet } from "react-native";
import { themeColors, categories, groups } from "../Colors";

const MainTabStyles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 0,
    backgroundColor: themeColors.bg,
    borderTopWidth: 0,
  },
});

export default MainTabStyles;
