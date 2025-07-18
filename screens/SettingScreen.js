import React, { useState, useEffect, useContext } from "react";
import { StatusBar } from "expo-status-bar";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  Image,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Modal,
  FlatList,
  Alert,
  ScrollView,
} from "react-native";
import { themeColors, categories, groups } from "../Colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

import styles from "../styles/SettingScreenStyles";
import Header from "../components/header";
import LoginScreen from "./LoginScreen";
import { AuthContext } from "../context/AuthContext";
import api from "../api";

const SettingScreen = () => {
  const navigation = useNavigation();
  const { userInfo, setUserInfo, setIsLoggedIn } = useContext(AuthContext);

  const [account, setAccount] = useState("");

  const [isEditingAccount, setIsEditingAccount] = useState(false);

  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [selectedColorKey, setSelectedColorKey] = useState("category1");

  const [isEditCategoryModalVisible, setIsEditCategoryModalVisible] =
    useState(false);
  const [editingCategory, setEditingCategory] = useState(null); // {id, name, colorKey}
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [editingColorKey, setEditingColorKey] = useState("category1");

  useEffect(() => {
    loadCategoriesList();
  }, []);

  const updateCategoriesFromServer = async () => {
    try {
      const userResponse = await api.get("/users/info");
      setUserInfo(userResponse.data);
      if (userResponse.data?.categories) {
        const parsed = userResponse.data.categories.map((item) => {
          const [name, colorNumber] = item.split("-");
          const colorKey = `category${colorNumber}`;
          const existing = categoriesList.find(
            (c) => c.name === name && c.colorKey === colorKey
          );
          // 기존에 있으면 id 유지, 없으면 새 id 부여
          const maxId = categoriesList.reduce(
            (max, c) => (c.id > max ? c.id : max),
            0
          );
          return {
            id: existing ? existing.id : maxId + 1,
            name,
            colorKey,
          };
        });
        setCategoriesList(parsed);
        await saveCategoriesList(parsed);
      }
    } catch (err) {
      console.error("유저 정보 갱신 실패:", err);
    }
  };

  const saveCategoriesList = async (data) => {
    try {
      await AsyncStorage.setItem("categoriesList", JSON.stringify(data));
    } catch (error) {
      console.error("categoriesList 저장 실패:", error);
    }
  };

  const saveAccount = async () => {
    const trimmedName = account.trim();
    console.log("✅ 최종 전송 name:", trimmedName);

    if (trimmedName === "") {
      Alert.alert("이름 입력 오류", "이름을 입력해주세요.");
      setIsEditingAccount(false);
      return;
    }

    try {

      // 요청
      const response = await api.post(
        "/users/change_name",
        { name: trimmedName }
      );

      console.log("서버 응답:", response);

      // 성공 처리
      setIsEditingAccount(false);

      Alert.alert("변경 완료", "이름이 변경되었습니다.");
      try {
        const userResponse = await api.get("/users/info");
        setUserInfo(userResponse.data);
        console.log("유저 정보 갱신:", userResponse.data);
      } catch (fetchError) {
        console.error("유저 정보 재조회 실패:", fetchError);
      }
    } catch (error) {
      if (error.response) {
        console.error("서버 응답 오류:", error.response.data);
        Alert.alert(
          "업데이트 실패",
          error.response.data?.detail || "이름 변경 실패"
        );
      } else {
        console.error("네트워크 오류:", error);
        Alert.alert("오류", "서버에 연결할 수 없습니다.");
      }
    }
  };

  const [categoriesList, setCategoriesList] = useState([
    { id: 1, name: "기타", colorKey: "category1" },
  ]);

  const openCategoryModal = () => {
    if (categoriesList.length >= 20) {
      Alert.alert(
        "카테고리 제한",
        "최대 20개의 카테고리만 추가할 수 있습니다.",
        [{ text: "확인" }]
      );
      return;
    }
    setNewCategoryName("");
    setSelectedColorKey("category1");
    setIsCategoryModalVisible(true);
  };

  const saveCategory = async () => {
    if (newCategoryName.trim() === "") {
      return;
    }
    const maxId = categoriesList.reduce(
      (max, c) => (c.id > max ? c.id : max),
      0
    );
    const newId = maxId + 1;
    const newCategory = {
      id: newId,
      name: newCategoryName.trim(),
      colorKey: selectedColorKey,
    };
    const newList = [...categoriesList, newCategory];
    setCategoriesList(newList);
    await saveCategoriesList(newList);
    setIsCategoryModalVisible(false);

    try {
      const colorIndex = selectedColorKey.replace("category", "");
      const response = await api.post("/plan/push_category", {
        category: `${newCategory.name}-${colorIndex}`,
      });

      console.log("카테고리 서버 등록 응답:", response);

      Alert.alert("성공", "카테고리가 등록되었습니다.");

      await updateCategoriesFromServer();

    } catch (error) {
      if (error.response) {
        console.error("카테고리 서버 등록 실패:", error.response.data);
        Alert.alert(
          "서버 오류",
          error.response.data?.detail || "카테고리 추가 실패"
        );
      } else {
        console.error("네트워크 오류:", error);
        Alert.alert("오류", "카테고리를 서버에 전송하지 못했습니다.");
      }
    }
  };

  const saveEditedCategory = async () => {
    if (editingCategoryName.trim() === "") {
      Alert.alert("카테고리 이름 입력", "카테고리 이름을 입력해주세요.");
      return;
    }

    const oldColorIndex = editingCategory.colorKey.replace("category", "");
    const oldCategoryString = `${editingCategory.name}-${oldColorIndex}`;

    const newColorIndex = editingColorKey.replace("category", "");
    const newCategoryString = `${editingCategoryName.trim()}-${newColorIndex}`;

    const newList = categoriesList.map((cat) =>
      cat.id === editingCategory.id
        ? {
            ...cat,
            name: editingCategoryName.trim(),
            colorKey: editingColorKey,
          }
        : cat
    );
    setCategoriesList(newList);
    await saveCategoriesList(newList);
    setIsEditCategoryModalVisible(false);

    try {
      const response = await api.post("/plan/change_category", {
        category: oldCategoryString,
        new_category: newCategoryString,
      });

      console.log("카테고리 수정 서버 응답:", response);
      Alert.alert("변경 완료", "카테고리가 수정되었습니다.");

      await updateCategoriesFromServer();
    } catch (error) {
      if (error.response) {
        console.error("카테고리 수정 실패:", error.response.data);
        Alert.alert(
          "서버 오류",
          error.response.data?.detail || "카테고리 수정 실패"
        );
      } else {
        console.error("네트워크 오류:", error);
        Alert.alert("오류", "서버에 연결할 수 없습니다.");
      }
    }
  };

  const deleteCategory = async () => {
    if (editingCategory.id <= 3) {
      Alert.alert("삭제 불가", "기본 카테고리는 삭제할 수 없습니다.");
      return;
    }

    const newList = categoriesList.filter(
      (cat) => cat.id !== editingCategory.id
    );
    setCategoriesList(newList);
    await saveCategoriesList(newList);
    setIsEditCategoryModalVisible(false);

    try {
      const colorIndex = editingCategory.colorKey.replace("category", "");
      const payload = {
        category: `${editingCategory.name}-${colorIndex}`,
      };

      console.log("삭제 요청 payload:", payload);

      const response = await api.post("/plan/del_category", payload);

      console.log("삭제 서버 응답:", response);

      Alert.alert("삭제 완료", "카테고리가 삭제되었습니다.");

      await updateCategoriesFromServer();
    } catch (error) {
      if (error.response) {
        console.error("카테고리 서버 삭제 실패:", error.response.data);
        Alert.alert(
          "서버 오류",
          error.response.data?.detail || "카테고리 삭제 실패"
        );
      } else {
        console.error("네트워크 오류:", error);
        Alert.alert("오류", "카테고리를 서버에서 삭제하지 못했습니다.");
      }
    }
  };

  const loadCategoriesList = async () => {
    try {
      let loadedFromServer = false;

      // 1. userInfo.categories가 있으면 서버 데이터 우선
      if (userInfo?.categories && Array.isArray(userInfo.categories)) {
        const parsed = userInfo.categories.map((item, index) => {
          const [name, colorNumber] = item.split("-");
          return {
            id: index + 1,
            name: name,
            colorKey: `category${colorNumber}`,
          };
        });

        setCategoriesList(parsed);
        await saveCategoriesList(parsed);
        loadedFromServer = true;
        console.log("서버에서 카테고리 로드 완료:", parsed);
      }

      // 2. 서버 데이터가 없을 경우 AsyncStorage에서 불러오기
      if (!loadedFromServer) {
        const stored = await AsyncStorage.getItem("categoriesList");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
              setCategoriesList(parsed);
              console.log("AsyncStorage에서 카테고리 로드 완료:", parsed);
            } else {
              console.warn("categoriesList에 배열이 아닌 데이터:", parsed);
              await AsyncStorage.removeItem("categoriesList");
              console.log("깨진 데이터를 삭제했습니다.");
            }
          } catch (parseError) {
            console.error("categoriesList JSON 파싱 실패:", parseError);
            await AsyncStorage.removeItem("categoriesList");
            console.log("깨진 데이터를 삭제했습니다.");
          }
        } else {
          console.log("저장된 카테고리가 없습니다.");
        }
      }
    } catch (error) {
      console.error("categoriesList 불러오기 실패:", error);
    }
  };

  const logout = async () => {
    try {
      const response = await api.post("/users/expire_token");

      console.log("로그아웃 응답:", response);

      // regardless of result, clear tokens
      await SecureStore.deleteItemAsync("accessToken");
      await SecureStore.deleteItemAsync("refreshToken");
      setIsLoggedIn(false);

      Alert.alert("로그아웃 완료", "정상적으로 로그아웃 되었습니다.");
    } catch (error) {
      if (error.response) {
        console.error("로그아웃 서버 오류:", error.response.data);
        Alert.alert(
          "로그아웃 실패",
          error.response.data?.detail || "다시 시도해주세요."
        );
      } else {
        console.error("로그아웃 네트워크 오류:", error);
        Alert.alert("오류", "서버에 연결할 수 없습니다.");
      }
    }
  };

  return (
    <View style={styles.fullcontainer}>
      <View>
        <Header />
      </View>
      <View style={styles.setting}>
        <Text style={styles.font}>설정</Text>
      </View>
      <ScrollView
        style={{ flex: 1, backgroundColor: themeColors.bg }}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <View style={styles.information}>
          <View style={styles.leftpannel}>
            <Image
              source={require("../assets/images/userIcon.png")}
              style={styles.icon}
            />
          </View>
          <View style={styles.rightpannel}>
            <View style={styles.inputRow}>
              <Text style={styles.label}>계정</Text>
              <View style={styles.inputContainer}>
                {isEditingAccount ? (
                  <TextInput
                    placeholder={userInfo?.name}
                    value={account}
                    onChangeText={setAccount}
                    onBlur={saveAccount}
                    autoFocus
                    style={styles.input}
                    maxLength={9}
                  />
                ) : (
                  <Text style={styles.input}>{userInfo?.name}</Text>
                )}
                <TouchableOpacity
                  onPress={() => 
                    {
                      setAccount("");
                      setIsEditingAccount(!isEditingAccount);
                    }
                 }
                >
                  <Image
                    source={require("../assets/images/pencilIcon.png")}
                    style={styles.icon}
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.inputRow}>
                <Text style={styles.label}>이메일</Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.input}>{userInfo?.email}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.information}>
          <View style={styles.leftpannel}>
            <Image
              source={require("../assets/images/tagIcon.png")}
              style={styles.icon}
            />
          </View>
          <View style={styles.rightpannel}>
            <View style={styles.inputRow}>
              <View style={styles.labelContainer}>
                <Text style={styles.categoryLabel}>카테고리</Text>
                <TouchableOpacity
                  onPress={openCategoryModal}
                  style={styles.addCategoryButton}
                >
                  <Image
                    source={require("../assets/images/addIcon.png")}
                    style={styles.addIcon}
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.categoryContainer}>
                <FlatList
                  data={categoriesList}
                  scrollEnabled={false}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => {
                        setEditingCategory(item);
                        setEditingCategoryName(item.name);
                        setEditingColorKey(item.colorKey);
                        setIsEditCategoryModalVisible(true);
                      }}
                      style={styles.categoryItem}
                    >
                      <Text style={styles.categoryText}>{item.name}</Text>
                      <View
                        style={[
                          styles.selectedColor,
                          { backgroundColor: categories[item.colorKey].bg },
                        ]}
                      ></View>
                    </TouchableOpacity>
                  )}
                  keyExtractor={(item) => item.id.toString()}
                />
              </View>
            </View>
          </View>
        </View>
        <Modal
          visible={isCategoryModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsCategoryModalVisible(false)}
        >
          <TouchableWithoutFeedback
            onPress={() => setIsCategoryModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.modalContainer}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>카테고리 추가</Text>
                  </View>
                  <Text style={styles.categoryModalLabel}>카테고리 이름</Text>
                  <TextInput
                    value={newCategoryName}
                    onChangeText={setNewCategoryName}
                    placeholder="카테고리 이름"
                    style={styles.categoryModalInput}
                    maxLength={9}
                  />
                  <Text style={styles.categoryModalLabel}>카테고리 색상</Text>
                  <View style={styles.colorGrid}>
                    {Object.keys(categories).map((key) => (
                      <TouchableOpacity
                        key={key}
                        onPress={() => setSelectedColorKey(key)}
                        style={[styles.colorCircleWrapper]}
                      >
                        <View
                          style={[
                            styles.colorCircle,
                            { backgroundColor: categories[key].bg },
                          ]}
                        >
                          {selectedColorKey === key && (
                            <Image
                              source={require("../assets/images/checkIcon.png")}
                              style={styles.checkMark}
                            />
                          )}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.buttonContainer}>
                    <TouchableOpacity
                      onPress={() => setIsCategoryModalVisible(false)}
                      style={styles.cancelButton}
                    >
                      <Text style={styles.actionButtonText}>취소</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={saveCategory}
                      style={styles.actionButton}
                    >
                      <Text style={styles.actionButtonText}>추가</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
        <Modal
          visible={isEditCategoryModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsEditCategoryModalVisible(false)}
        >
          <TouchableWithoutFeedback
            onPress={() => setIsEditCategoryModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.modalContainer}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>카테고리 수정</Text>
                  </View>

                  <Text style={styles.categoryModalLabel}>카테고리 이름</Text>
                  <TextInput
                    value={editingCategoryName}
                    onChangeText={setEditingCategoryName}
                    placeholder="카테고리 이름"
                    style={styles.categoryModalInput}
                    maxLength={9}
                  />
                  <Text style={styles.categoryModalLabel}>카테고리 색상</Text>
                  <View style={styles.colorGrid}>
                    {Object.keys(categories).map((key) => (
                      <TouchableOpacity
                        key={key}
                        onPress={() => setEditingColorKey(key)}
                        style={styles.colorCircleWrapper}
                      >
                        <View
                          style={[
                            styles.colorCircle,
                            { backgroundColor: categories[key].bg },
                          ]}
                        >
                          {editingColorKey === key && (
                            <Image
                              source={require("../assets/images/checkIcon.png")}
                              style={styles.checkMark}
                            />
                          )}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={styles.buttonContainer}>
                    <TouchableOpacity
                      onPress={deleteCategory}
                      style={styles.cancelButton}
                    >
                      <Text style={styles.actionButtonText}>삭제</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={saveEditedCategory}
                      style={styles.actionButton}
                    >
                      <Text style={styles.actionButtonText}>변경</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
        <TouchableOpacity
          style={styles.information}
          onPress={() => navigation.navigate("ChangePw")}
        >
          <View style={styles.leftpannel}>
            <Image
              source={require("../assets/images/lockIcon.png")}
              style={styles.lockIcon}
            />
          </View>
          <View style={styles.rightpannel}>
            <View style={styles.inputRow}>
              <Text style={styles.findPWFont}>비밀번호 변경</Text>
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.information}
          onPress={() => {
            Alert.alert(
              "로그아웃",
              "정말 로그아웃 하시겠습니까?",
              [
                {
                  text: "취소",
                  style: "cancel",
                },
                {
                  text: "확인",
                  style: "destructive",
                  onPress: logout,
                },
              ],
              { cancelable: true }
            );
          }}
        >
          <View style={styles.leftpannel}>
            <Image
              source={require("../assets/images/logoutIcon.png")}
              style={styles.outIcon}
            />
          </View>
          <View style={styles.rightpannel}>
            <View style={styles.inputRow}>
              <Text style={styles.outText}>로그아웃</Text>
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.information}
          onPress={() => navigation.navigate("Deluser")}
        >
          <View style={styles.leftpannel}>
            <Image
              source={require("../assets/images/userXIcon.png")}
              style={styles.outIcon}
            />
          </View>
          <View style={styles.rightpannel}>
            <View style={styles.inputRow}>
              <Text style={styles.outText}>앱 탈퇴</Text>
            </View>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default SettingScreen;
