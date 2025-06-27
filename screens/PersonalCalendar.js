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
import Header from "../components/header";

import styles from "../styles/PersonalCalendarStyles";

const PersonalCalendar = () => {
  return (
    <View style={styles.container}>
      <Header />
    </View>
  );
};

export default PersonalCalendar;
