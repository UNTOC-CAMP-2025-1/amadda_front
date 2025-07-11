import { StyleSheet } from "react-native";
import { themeColors } from "../Colors"; // 색상 불러오기

const GroupScreenStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: themeColors.bg },

  // 그룹 헤더 스타일
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 6,
    borderBottomColor: themeColors.highlight,
    borderBottomWidth: 1,
    alignItems: "center",
  },
  headText: {
    flex: 1,
    fontSize: 25,
    padding: 8,
    marginVertical: 10,
    marginLeft: 10,
    color: themeColors.highlight,
    textAlign: "center",
  },
  iconButton: {
    padding: 4,
    marginLeft: 5,
  },
  iconImage: {
    width: 24,
    height: 24,
    marginTop: 4,
    tintColor: themeColors.highlight,
    resizeMode: "contain",
  },
  icon: {
    width: 24,
    height: 24,
    tintColor: themeColors.highlight,
    resizeMode: "contain",
    marginBottom: 5,
    marginRight: 5,
  },
  infoIcon: {
    width: 24,
    height: 24,
    tintColor: themeColors.highlight,
    resizeMode: "contain",
    marginBottom: 5,
    marginRight: 5,
    marginLeft: -1,
  },
  trashIcon: {
    width: 24,
    height: 24,
    tintColor: themeColors.sunday,
    resizeMode: "contain",
    marginBottom: 5,
    marginRight: 5,
  },
  subIcon: {
    width: 18,
    height: 18,
    tintColor: themeColors.highlight,
    resizeMode: "contain",
    marginBottom: 5,
    marginRight: 5,
  },
  authIcon: {
    width: 20,
    height: 20,
    tintColor: themeColors.highlight,
    resizeMode: "contain",
    marginRight: 5,
  },
  modalOverlay: {
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.4)",
  justifyContent: "center",
  alignItems: "center",
},
  modalContainer: {
    backgroundColor: themeColors.bg,
    borderRadius: 8,
    padding: 20,
    width: 380,
  },
  inputLabel: {
    fontSize: 16,
    color: themeColors.highlight,
  },
  authInputLabel: {
    fontSize: 16,
    color: themeColors.highlight,
    marginLeft: 5,
  },
  inputBackground: {
    width: "100%",
    height: 54.5,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 6,
    flexDirection: "row",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  actionButton: {
    width: "48%",
    backgroundColor: themeColors.highlight,
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
  actionButtonText: {
    color: "white",
    fontWeight: "bold",
  },// GroupScreenStyles.js 하단에 이어서 붙여주세요
  menuModalContainer: {
    position: "absolute",
    top: 10,     // 헤더 높이에 맞춰 조정
    right: 10,   // 오른쪽 여백
    width: "auto",
    backgroundColor: themeColors.bg,
    borderRadius: 10,
    padding: 10,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  menuItem: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  menuItemText: {
    fontSize: 16,
    color: themeColors.highlight,
    marginHorizontal: 5,
  },
  itemText: {
    fontSize: 16,
    color: themeColors.highlight,
    marginHorizontal: 5,
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginVertical: 10,
  },
  colorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    margin: 5,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  groupInfoModal: {
    width: 340,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
  },

  infoSection: {
    marginVertical: 8,
  },

  infoLabel: {
    fontSize: 14,
    color: "#888",
    marginBottom: 4,
  },

  infoInputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 48,
    backgroundColor: themeColors.bg,
  },

  infoText: {
    flex: 1,
    fontSize: 15,
    color: "#333",
  },

  iconButtonSmall: {
    padding: 6,
  },
  copyButton: {
    marginTop: 12,
    backgroundColor: themeColors.highlight,
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: "center",
  },

  copyButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  modalHeader: {
  marginBottom: 12,
  borderBottomColor: themeColors.text,
  borderBottomWidth: 1.5,
  },
  modalTitle: {
    fontSize: 18,
    color: themeColors.highlight,
    textAlign: "center",
    margin: 5
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginVertical: 10,
  },
  colorCircleWrapper: {
    margin: 10,
  },
  colorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  checkMark: {
    width: 20,
    height: 20,
    tintColor: "white",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  cancelButton: {
    width: "25%",
    backgroundColor: themeColors.sunday,
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
  actionButton: {
    width: "25%",
    backgroundColor: themeColors.highlight,
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
  actionButtonText: {
    color: "white",
  },
  authModalHeader: {
    flexDirection: "row",

  },
});

export default GroupScreenStyles;
