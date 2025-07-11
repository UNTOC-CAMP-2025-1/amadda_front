import React, { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { useNavigation, useRoute } from "@react-navigation/native";
import { View, Alert } from "react-native";
import { themeColors, categories, groups } from "../Colors";

import styles from "../styles/PersonalCalendarStyles";
import Header from "../components/header";
import Calendar from "../components/calendar";

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import api from "../api";
import { jwtDecode } from "jwt-decode";

const PersonalCalendar = () => {
  const navigation = useNavigation();
  const [todos, setTodos] = useState({});

  const ensureValidAccessToken = async () => {
    try {
      // 1. 유효성 검사
      await api.get("/users/verify_token");
    } catch (error) {
      if (error.response && error.response.status === 401) {
        // 2. 만료됐으면 새로 발급
        console.log("Access Token 만료, 새로 발급 요청");
        try {
          const refreshResponse = await api.post("users/refresh_token");
          const newAccessToken = refreshResponse.data.accessToken;
          await SecureStore.setItemAsync("accessToken", newAccessToken);
          console.log("Access Token 재발급 완료");
        } catch (refreshError) {
          console.error("토큰 재발급 실패:", refreshError);
          throw new Error("세션이 만료되었습니다. 다시 로그인해주세요.");
        }
      } else {
        throw error;
      }
    }
  };

  const handleAddTodo = async (newTodo) => {
    try {
      //0, access token 유효성 검사
      await ensureValidAccessToken();

      //1, 토큰 가져오기, uuid 추출
      const token = await SecureStore.getItemAsync("accessToken");
      const decoded = jwtDecode(token);

      // 2, 새 일정 post
      const response = await api.post("/plan/push_plan", {
        name: newTodo.name,
        category: newTodo.category,
        date: newTodo.date,
        create_at: decoded.uuid,
      });
      Alert.alert("일정 추가 성공", "일정을 추가했습니다!");

      // 3, 렌더할 새 일정 추가
      const addedTodo = {
        uuid: response.data.uuid,
        name: response.data.name,
        category: response.data.category,
        isActive: !response.data.is_active,
        isGroup: false,
      };

      // 4, 새 일정 렌더
      setTodos((prev) => {
        const dateKey = response.data.date.split("T")[0];
        const updated = { ...prev };
        if (!updated[dateKey]) updated[dateKey] = [];
        updated[dateKey].push(addedTodo);

        return updated;
      });
    } catch (err) {
      console.log("일정 추가 실패: ", err);
    }
  };

  const handleDeleteTodo = async (uuid, dateKey) => {
    try {
      await api.post("/plan/del_plan", {
        uuid: uuid,
      });

      // 성공 시 사용자에게 알림
      Alert.alert("일정 삭제", "일정 삭제 완료!");
    } catch (err) {
      console.log("플랜 삭제 실패: ", err);
      alert("삭제 실패. 다시 시도해주세요.");
      return; // 실패했으면 setTodos 건너뛰기
    }

    // 삭제 성공한 경우에만 state 업데이트
    setTodos((prev) => {
      const filtered = prev[dateKey].filter((item) => item.uuid !== uuid);
      return {
        ...prev,
        [dateKey]: filtered,
      };
    });
  };

  const handleToggleTodo = async (uuid, dateKey, newActive) => {
    try {
      await api.post("/plan/is_active", {
        uuid,
        is_active: !newActive,
      });

      // 업데이트된 todo 반영
      setTodos((prev) => {
        const updated = { ...prev };
        updated[dateKey] = updated[dateKey].map((todo) =>
          todo.uuid === uuid ? { ...todo, isActive: newActive } : todo
        );
        return updated;
      });
      console.log("토글 성공");
    } catch (err) {
      console.log("isActive 토글 실패: ", err);
      alert("토글 실패. 다시 시도해주세요.");
    }
  };

  const loadAllPlan = async () => {
    try {
      const tempTodos = {};

      const userRes = await api.get("/plan/plans");
      const userTodos = userRes.data;

      userTodos.forEach((todo) => {
        const dateKey = todo.date.split("T")[0];
        if (!tempTodos[dateKey]) {
          tempTodos[dateKey] = [];
        }

        tempTodos[dateKey].push({
          uuid: todo.uuid,
          name: todo.name,
          category: todo.category,
          isActive: !todo.is_active,
          isGroup: false,
        });
      });

      // 그룹 부분 로딩
      const userInfo = await api.get("/users/info");
      // console.log(userInfo);
      for (const group of userInfo.data.groups) {
        const groupRes = await api.get("plan/group_plans", {
          params: {
            code: group.code,
          },
          headers: {
            Authorization: `Bearer ${group.uuid}`,
          },
        });

        const groupTodos = groupRes.data;

        (groupTodos || []).forEach((todo) => {
          const dateKey = todo.date.split("T")[0];
          if (!tempTodos[dateKey]) {
            tempTodos[dateKey] = [];
          }

          tempTodos[dateKey].push({
            uuid: todo.uuid,
            name: todo.name,
            category: todo.category,
            isActive: !todo.is_active,
            isGroup: true,
          });
        });
      }

      setTodos(tempTodos);
      // console.log("퍼스널", tempTodos); // 테스트
    } catch (error) {
      console.log("plan update 실패", error);
    }
  };

  useEffect(() => {
    loadAllPlan();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      console.log(">> 포커스 재진입: 일정 재로드");
      loadAllPlan();
    });

    return unsubscribe;
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Header />
      <Calendar
        todoData={todos}
        onAddTodo={handleAddTodo}
        onDeleteTodo={handleDeleteTodo}
        onToggleTodo={handleToggleTodo}
        permission={0}
        personal={true}
      />
    </View>
  );
};

export default PersonalCalendar;
