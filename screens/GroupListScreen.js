import React, { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
} from "react-native";
import { themeColors, categories, groups } from "../Colors";

import styles from "../styles/GroupListScreenStyles";
import Header from "../components/header";

const GroupListScreen = () => {
  return (
    <View>
      <Header />
    </View>
  );
};

export default GroupListScreen;
