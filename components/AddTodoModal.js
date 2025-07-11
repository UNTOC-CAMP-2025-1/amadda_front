import React, { useState, useEffect, useTransition } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  TextInput,
} from "react-native";

import { Picker } from "@react-native-picker/picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { themeColors, categories, groups } from "../Colors";

const getDaysInMonth = (year, month) => {
  return new Date(year, month, 0).getDate();
};

const getCategoryTag = (categoryName, colorKey) => {
  const colorNumber = colorKey.replace("category", "");
  return `${categoryName}-${colorNumber}`;
};

const getISODate = (year, month, date) => {
  return new Date(year, month - 1, date, 12).toISOString();
};

const AddTodoModal = ({
  visible,
  onClose,
  onAddTodo,
  selectedDate,
  personal,
}) => {
  const today = new Date();

  const [todoText, setTodoText] = useState("");

  const [todoYear, setTodoYear] = useState(selectedDate.getFullYear());
  const [todoMonth, setTodoMonth] = useState(selectedDate.getMonth() + 1);
  const [todoDate, setTodoDate] = useState(selectedDate.getDate());

  useEffect(() => {
    if (visible && selectedDate) {
      setTodoText("");
      setSelectedCategory(null);

      const newYear = selectedDate.getFullYear();
      const newMonth = selectedDate.getMonth() + 1;
      const newDate = selectedDate.getDate();

      setTodoYear(newYear);
      setTodoMonth(newMonth);

      // 해당 연월에 존재하지 않는 일은 1일로 대체
      const lastDay = getDaysInMonth(newYear, newMonth);
      setTodoDate(Math.min(newDate, lastDay));
    }
  }, [visible, selectedDate]);

  // 달 일자 차이 보정
  useEffect(() => {
    const maxDate = getDaysInMonth(todoYear, todoMonth);
    if (todoDate > maxDate) {
      setTodoDate(maxDate);
    }
  }, [todoYear, todoMonth]);

  // 카테고리 목록 저장용 State
  const [categoryList, setCategoryList] = useState([]);
  // 비동기 스토리지에서 카테고리 리스트 가져오기
  useEffect(() => {
    const fetchCategories = async () => {
      const stored = await AsyncStorage.getItem("categoriesList");
      if (stored) {
        // console.log(stored); // 테스트
        setCategoryList(JSON.parse(stored));
      }
    };
    fetchCategories();
  }, [visible]);

  const [selectedCategory, setSelectedCategory] = useState(null);

  const validateInputs = () => {
    if (!todoText.trim()) {
      alert("일정 내용을 입력해주세요.");
      return false;
    }
    if (personal && !selectedCategory) {
      alert("카테고리를 선택해주세요.");
      return false;
    }
    const isValidDate = !isNaN(
      new Date(todoYear, todoMonth - 1, todoDate).getTime()
    );
    if (!isValidDate) {
      alert("올바른 날짜를 선택해주세요.");
      return false;
    }
    return true;
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              <Text style={styles.title}>일정 추가</Text>

              <View style={styles.userInputContainer}>
                <Text style={styles.inputLabels}>일정 내용</Text>
                <TextInput
                  value={todoText}
                  onChangeText={setTodoText}
                  placeholder="일정을 입력하세요"
                  placeholderTextColor="#aaa"
                  keyboardType="default"
                  maxLength={9}
                  returnKeyType="done"
                  style={styles.textInput}
                />

                <Text
                  style={styles.inputLabels}
                >{`날짜 선택 [${todoYear}-${todoMonth}-${todoDate}]`}</Text>
                <View style={styles.dateInputContainer}>
                  <TextInput
                    value={todoYear.toString()}
                    onChangeText={(text) => {
                      const num = parseInt(text, 10);
                      if (!isNaN(num)) setTodoYear(num);
                      else setTodoYear(selectedDate.getFullYear());
                    }}
                    placeholder={todoYear.toString()}
                    placeholderTextColor="#aaa"
                    keyboardType="number-pad"
                    maxLength={4}
                    returnKeyType="done"
                    style={styles.yearInput}
                  />

                  <View style={styles.monthWrapper}>
                    <Picker
                      selectedValue={todoMonth}
                      onValueChange={(val) => setTodoMonth(val)}
                      style={styles.monthPicker}
                      itemStyle={styles.pickerItem}
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <Picker.Item
                          key={i}
                          label={`${i + 1}월`}
                          value={i + 1}
                          color={themeColors.text}
                        />
                      ))}
                    </Picker>
                  </View>

                  <View style={styles.dateWrapper}>
                    <Picker
                      selectedValue={todoDate}
                      onValueChange={(val) => setTodoDate(val)}
                      style={styles.datePicker}
                      itemStyle={styles.pickerItem}
                    >
                      {Array.from(
                        { length: getDaysInMonth(todoYear, todoMonth) },
                        (_, i) => (
                          <Picker.Item
                            key={i}
                            label={`${i + 1}일`}
                            value={i + 1}
                            color={themeColors.text}
                          />
                        )
                      )}
                    </Picker>
                  </View>
                </View>
                {personal && (
                  <View>
                    <Text style={styles.inputLabels}>카테고리</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.categoryScroll}
                    >
                      {Array.isArray(categoryList) &&
                        categoryList.map((item) => (
                          <TouchableOpacity
                            key={item.id}
                            onPress={() => setSelectedCategory(item)}
                            style={[
                              styles.categoryBox,
                              {
                                backgroundColor: categories[item.colorKey].bg,
                                borderColor:
                                  selectedCategory?.id === item.id
                                    ? themeColors.highlight
                                    : "transparent",
                              },
                            ]}
                          >
                            <Text
                              style={{
                                color: categories[item.colorKey].text,
                                fontWeight: "bold",
                              }}
                            >
                              {item.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity onPress={onClose}>
                  <Text style={styles.cancelBtn}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    if (!validateInputs()) return;

                    if (personal) {
                      const newTodo = {
                        name: todoText,
                        category: getCategoryTag(
                          selectedCategory.name,
                          selectedCategory.colorKey
                        ),
                        date: getISODate(todoYear, todoMonth, todoDate, 12),
                      };
                      onAddTodo(newTodo);
                    } else {
                      const newTodo = {
                        name: todoText,
                        date: getISODate(todoYear, todoMonth, todoDate, 12),
                      };
                      onAddTodo(newTodo);
                    }

                    onClose();
                  }}
                >
                  <Text style={styles.addBtn}>추가</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // 모달 배경 오버레이
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  // 모달 컨테이너
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 10,
    width: "85%",
    padding: 17,
  },

  // 일정 추가 텍스트
  title: {
    fontSize: 21,
    fontWeight: 400,
    color: themeColors.text,
    paddingBottom: 13,
    paddingLeft: 9,
  },
  // 인풋 모음 컨테이너
  userInputContainer: {
    borderTopWidth: 1,
    borderTopColor: themeColors.text,
    paddingVertical: 10,
  },
  // 각 인풋 라벨
  inputLabels: {
    fontSize: 16,
    color: themeColors.text,
    marginTop: 13,
    marginBottom: 5,
    paddingLeft: 9,
  },
  // 일정 내용 입력 텍스트 인풋
  textInput: {
    backgroundColor: themeColors.bar,
    color: themeColors.text,
    borderColor: themeColors.lightText,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 18,
  },

  // 날짜 입력 요소 컨테이너
  dateInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  // 년 입력 텍스트 인풋
  yearInput: {
    width: 85,
    textAlign: "center",
    backgroundColor: themeColors.bar,
    color: themeColors.text,
    borderColor: themeColors.lightText,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 18,
  },
  // 달 입력 picker 래퍼
  monthWrapper: {
    flex: 1,
    overflow: "hidden",
    justifyContent: "center",
  },
  // 달 입력 피커
  monthPicker: {
    width: "100%",
  },
  // 일 입력 picker 래퍼
  dateWrapper: {
    flex: 1,
    overflow: "hidden",
    justifyContent: "center",
  },
  // 일 입력 피커
  datePicker: {
    width: "100%",
  },
  // 피커 아이템 스타일
  pickerItem: {
    fontSize: 18,
    textAlign: "center",
  },
  // 카테고리 목록 횡스크롤
  categoryScroll: {
    paddingTop: 10,
    paddingLeft: 9,
    marginBottom: 7,
  },
  // 각 카테고리 박스
  categoryBox: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 15,
    marginRight: 7,
    borderWidth: 2,
    // 텍스트 중앙 정렬
    alignItems: "center",
    justifyContent: "center",
  },

  // 취소 / 추가 버튼 컨테이너
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelBtn: {
    fontSize: 18,
    padding: 10,
    color: "gray",
  },
  addBtn: {
    fontSize: 18,
    padding: 10,
    paddingHorizontal: 10 * 2,
    backgroundColor: themeColors.highlight,
    borderRadius: 7,
    color: "white",
    fontWeight: 450,
  },
});

export default AddTodoModal;
