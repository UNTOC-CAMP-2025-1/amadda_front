import { StyleSheet } from "react-native";
import { themeColors, categories, groups } from "../Colors";

const MainTabStyles = StyleSheet.create({
  container: {
    // position: "absolute",
    // bottom: 0,
    // left: 0,
    // right: 0,
    // elevation: 0,
    height: 110,
    paddingHorizontal: 40,
    backgroundColor: themeColors.bg,
    borderTopWidth: 1,
  },
  tabBarIcon: {
    flex: 1,
  },
  tabBarItem: {
    overflow: "hidden",
  },
  tabBarImage: {
    height: "115%",
    resizeMode: "contain",
  },
});

export default MainTabStyles;
