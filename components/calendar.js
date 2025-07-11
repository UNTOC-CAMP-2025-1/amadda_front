import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  FlatList,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  StyleSheet,
  RefreshControl,
} from "react-native";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { FontAwesome } from "@expo/vector-icons";
import { Feather } from "@expo/vector-icons";

import { themeColors, categories, groups } from "../Colors";
import CalendarPage from "./calendarPage";
import CheckBox from "./checkbox";
import AddTodoModal from "./AddTodoModal";
import api from "../api";

const screenWidth = Dimensions.get("window").width;

const days = ["일", "월", "화", "수", "목", "금", "토"];

const Calendar = ({
  todoData = {},
  onAddTodo,
  onDeleteTodo,
  onToggleTodo,
  permission,
  personal,
}) => {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);

  // 1년치 데이터 생성 함수
  const generateOneYearData = (year) => {
    let data = [];
    for (let m = 1; m <= 12; m++) {
      data.push({ year, month: m });
    }
    return data;
  };

  // centerYear을 중심으로 앞 뒤 2년씩 총 5년 렌더링
  const generateCalendarData = (year) => {
    let data = [];
    for (let y = year - 2; y <= year + 2; y++) {
      data.push(...generateOneYearData(y));
    }
    return data;
  };

  const getSelectedDateFormat = () => {
    const year = selectedDate.getFullYear();
    const monthStr = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const dateStr = String(selectedDate.getDate()).padStart(2, "0");

    return `${year}-${monthStr}-${dateStr}`;
  };

  // 스크롤 엔드 이벤트
  const handleScrollEnd = useCallback((e) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / screenWidth);

    // 페이징 인덱스 동기화
    setCurrentIndex(index);

    // 새로운 페이지 로딩 임계값
    const threshold = 1;

    // 오른쪽 끝 도달 시 동적 할당
    if (index > calendarDataRef.current.length - 1 - threshold) {
      const lastItem = calendarDataRef.current.at(-1);
      const moreData = generateOneYearData(lastItem.year + 1);
      setCalendarData((prev) => {
        const updated = [...prev, ...moreData];
        calendarDataRef.current = updated;
        return updated;
      });
    }

    // 왼쪽 끝 도달 시 동적 할당 ( flatList 한계 상 불완전 구현 )
    // 그래서 그냥 냅다 5년치 한번에 로딩해버리기로 해스요
    if (index < 1) {
      const firstItem = calendarDataRef.current[0];
      const moreData = [];
      for (let y = firstItem.year - 5; y < firstItem.year; y++) {
        moreData.push(...generateOneYearData(y));
      }
      const updated = [...moreData, ...calendarDataRef.current];
      calendarDataRef.current = updated;
      setCalendarData(updated);

      const offsetAfter = screenWidth * (index + 60);
      requestAnimationFrame(() => {
        flatListRef.current?.scrollToOffset({
          offset: offsetAfter,
          animated: false,
        });

        setCurrentIndex((prev) => prev + 60);
      });
    }

    // 캘린더 헤더 업데이트
    const viewed = calendarDataRef.current[index];
    if (viewed) {
      setCurrentHeader({ year: viewed.year, month: viewed.month });
    }
  }, []);

  // 다음달 이동 버튼 이벤트
  const goToNextMonth = () => {
    if (currentIndex < calendarData.length - 1) {
      const newIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: newIndex, animated: true });
      setCurrentIndex(newIndex);
    }
  };
  // 이전달 이동 버튼 이벤트
  const goToPreviousMonth = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      flatListRef.current?.scrollToIndex({ index: newIndex, animated: true });
      setCurrentIndex(newIndex);
    }
  };
  // 특정달 이동 이벤트
  const goToMonth = (targetYear, targetMonth) => {
    const newData = generateCalendarData(targetYear);
    const newIndex = 12 + (targetYear - 1);

    setCalendarData(newData);
    setCurrentIndex(newIndex);

    setTimeout(() => {
      flatListRef.current?.scrollToIndex({ index: newIndex, animated: false });
    }, 5);
  };

  // flatList 렌더링 함수
  const renderItem = useCallback(
    ({ item }) => {
      return (
        <View style={styles.bg}>
          <CalendarPage
            year={item.year}
            month={item.month}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            todos={todoData}
          />
        </View>
      );
    },
    [selectedDate, todoData]
  );

  // FlatList 레퍼런스
  const flatListRef = useRef(null);

  // FlatList 렌더링 데이터
  const [calendarData, setCalendarData] = useState(() =>
    generateCalendarData(today.getFullYear())
  );
  // calendarData 레퍼런스
  const calendarDataRef = useRef(calendarData);
  // setState가 비동기 작업이므로 동기화된 레퍼런스가 필요
  useEffect(() => {
    calendarDataRef.current = calendarData;
  }, [calendarData]);

  // 페이지, 헤더 동기화
  const [currentHeader, setCurrentHeader] = useState({
    year: today.getFullYear(),
    month: today.getMonth() + 1,
  });
  // 페이징 이동용 현재 인덱스 정보
  const [currentIndex, setCurrentIndex] = useState(24 + today.getMonth());

  // 모달 이벤트 감지
  const [isAddTodoVisible, setIsAddTodoVisible] = useState(false);

  // 캘린더 컴포넌트 초기 상태로 새로고침 이벤트
  const [refreshing, setRefreshing] = useState(false);
  // 새로고침 함수
  const onRefresh = () => {
    setRefreshing(true);
    const today = new Date();

    const newData = generateCalendarData(today.getFullYear());
    setCalendarData(newData);
    setSelectedDate(today);
    setCurrentIndex(24 + today.getMonth());

    setTimeout(() => {
      flatListRef.current?.scrollToIndex({
        index: 24 + today.getMonth(),
        animated: false,
      });
      setRefreshing(false);
    }, 300);
  };

  const getTodoColor = (item) => {
    const categoryNum = item.category.split("-")[1];
    let key = "category1";
    if (item.isGroup) {
      key = `group${categoryNum}`;
      return (
        groups[key] || { bg: "#638A7E", text: "#DBF0E4", checkbox: "#324B25" }
      );
    } else {
      key = `category${categoryNum}`;
      return (
        categories[key] || {
          bg: "#C3DFF0",
          text: "#6488BB",
          checkbox: "#7EB4BC",
        }
      );
    }
  };

  // 스와이프 삭제 렌더링
  const renderRightActions = (item) => {
    // 만약 플랜이 그룹 플랜인데
    // 퍼스널 캘린더 이거나 권한이 없다면 삭제 X
    if (item.isGroup) {
      if (personal || permission >= 2) return null;
    }

    const handleDelete = () => {
      onDeleteTodo(item.uuid, getSelectedDateFormat());
    };
    return (
      <TouchableOpacity onPress={handleDelete}>
        <View style={styles.deleteButton}>
          <Text style={styles.deleteButtonText}>삭제</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView
      style={styles.bg}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <View style={styles.headerDate}>
          <Text style={styles.headerText}>
            {currentHeader.year}년 {currentHeader.month}월
          </Text>
          <TouchableOpacity
            style={styles.moveMonthBtn}
            onPress={goToPreviousMonth}
          >
            <Feather name="chevron-left" size={24} color="black" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.moveMonthBtn} onPress={goToNextMonth}>
            <Feather name="chevron-right" size={24} color="black" />
          </TouchableOpacity>
        </View>

        <View style={styles.daysRow}>
          {days.map((day, index) => {
            const textStyle = [styles.daysText];
            if (index === 0) textStyle.push(styles.textRed);
            if (index === 6) textStyle.push(styles.textBlue);
            return (
              <View style={styles.dayCell} key={index}>
                <Text style={textStyle}>{day}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <FlatList
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        ref={flatListRef}
        data={calendarData}
        keyExtractor={(item) => `${item.year}${item.month}`}
        getItemLayout={(data, index) => ({
          length: screenWidth,
          offset: screenWidth * index,
          index,
        })}
        initialScrollIndex={24 + today.getMonth()}
        initialNumToRender={3}
        windowSize={3}
        onMomentumScrollEnd={handleScrollEnd}
        renderItem={renderItem}
      />

      <View style={styles.todosContainer}>
        <View style={styles.todoHeader}>
          <Text style={styles.todoHeaderText}>
            {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일
          </Text>
          {permission < 2 && (
            <TouchableOpacity
              style={styles.todoAddBtn}
              onPress={() => setIsAddTodoVisible(true)}
            >
              <FontAwesome name="plus" size={19} color={themeColors.text} />
            </TouchableOpacity>
          )}
        </View>
        {(todoData[getSelectedDateFormat()] || []).map((item, index) => (
          <View key={item.uuid} style={styles.todoWrapper}>
            <Swipeable renderRightActions={() => renderRightActions(item)}>
              <View
                style={[
                  styles.todos,
                  { backgroundColor: getTodoColor(item).bg },
                ]}
              >
                <View style={{ width: "85%" }}>
                  <Text
                    style={[
                      styles.todoCatText,
                      { color: getTodoColor(item).text },
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {item.category.split("-")[0]}
                  </Text>
                  <Text
                    style={[
                      styles.todoNameText,
                      { color: getTodoColor(item).text },
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {item.name}
                  </Text>
                </View>
                <View>
                  {item.isGroup ? (
                    <Text
                      style={{ fontSize: 15, color: getTodoColor(item).text }}
                    >
                      그룹
                    </Text>
                  ) : (
                    <CheckBox
                      color={getTodoColor(item).checkbox}
                      uuid={item.uuid}
                      initialChecked={item.isActive}
                      onToggle={(newActive) =>
                        onToggleTodo(
                          item.uuid,
                          getSelectedDateFormat(),
                          newActive
                        )
                      }
                    />
                  )}
                </View>
              </View>
            </Swipeable>
          </View>
        ))}
      </View>

      <AddTodoModal
        visible={isAddTodoVisible}
        onClose={() => setIsAddTodoVisible(false)}
        onAddTodo={onAddTodo}
        selectedDate={selectedDate}
        personal={personal}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  // 배경 전체 컨테이너 스타일
  bg: {
    flex: 1,
    width: screenWidth,
    backgroundColor: themeColors.bg,
  },
  // 헤더 컨테이너 스타일
  header: {},
  // 연월 텍스트, 이동 버튼 포함 컨테이너
  headerDate: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingTop: 13,
    paddingHorizontal: 21,
  },
  // 헤더의 20XX년 XX월 텍스트 스타일
  headerText: {
    fontSize: 24,
    color: themeColors.text,
    fontWeight: 300,
    flex: 8,
  },
  // 헤더 이동 좌우 버튼
  moveMonthBtn: {
    alignItems: "center",
    justifyContent: "center",
    width: 45,
  },
  // 일월화수목금토일 컨테이너
  daysRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: 0.5,
    borderBlockColor: "#ccc",
  },
  // 각 요일 셀 스타일
  dayCell: {
    flex: 1,
    aspectRatio: 1.1,
    alignItems: "center",
    justifyContent: "center",
  },
  // 각 요일 텍스트 스타일
  daysText: {
    color: themeColors.text,
    fontWeight: 600,
    fontSize: 16,
  },

  textRed: {
    color: themeColors.sunday,
  },
  textBlue: {
    color: themeColors.saturday,
  },

  // 일정 목록 컨테이너
  todosContainer: {
    flex: 1,
    marginHorizontal: 19,
    borderRadius: 23,
    backgroundColor: themeColors.bar,
    paddingVertical: "5%",
    paddingHorizontal: "7%",
    marginBottom: 35,
  },
  todoHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  todoHeaderText: { color: themeColors.text, fontWeight: 600, fontSize: 27 },
  todoAddBtn: {
    width: 32,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  todoWrapper: {
    flex: 1,
    width: "100%",
    backgroundColor: "tomato",
    overflow: "hidden",
    borderRadius: 13,
    marginTop: 21,
    height: 77,
  },
  todos: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 13, // 넣을까 뺄까?
    paddingVertical: "5%",
    paddingHorizontal: "7%",
    width: "100%",
    height: "100%",
  },
  todoNameText: {
    fontSize: 19,
    fontWeight: 500,
  },
  todoCatText: {
    fontSize: 13,
  },
  deleteButton: {
    backgroundColor: "tomato",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingHorizontal: 21,
    height: "100%",
  },
  deleteButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 17,
  },
});

export default Calendar;
