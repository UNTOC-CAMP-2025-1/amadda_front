import { StyleSheet, Dimensions } from "react-native";
import { themeColors, categories, groups } from "../Colors";

const screenWidth = Dimensions.get("window").width;
const screenHeight = Dimensions.get("window").height;

const LoginScreenStyles = StyleSheet.create({
  fullcontainer: {
    flex: 1,
  },
  container_logo: {
    backgroundColor: "white",
    flex: 6,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 10,
  },
  container_login1: {
    backgroundColor: "white",
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  container_login2: {
    backgroundColor: "white",
    flex: 1,
    justifyContent: "center",
  },
  container_fpw_join: {
    backgroundColor: "white",
    flex: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    flex: 8,
    backgroundColor: "white",
    resizeMode: "contain",
  },
  logo_name: {
    flex: 1,
    textAlign: "center",
    fontSize: 40,
    color: "#555B8F",
  },
  input: {
    borderColor: "#7D8AAB",
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderRadius: 15,
    marginTop: 10,
    marginLeft: 20,
    fontSize: 18,
    borderWidth: 2,
    width: screenWidth * 0.65,
  },

  Login_idpw: {
    width: 25,
    height: 25,
    resizeMode: "contain",
  },
  Login_icon: {
    width: 22,
    height: 22,
    resizeMode: "contain",
  },

  Button: {
    backgroundColor: "#555B8F",
    paddingVertical: 13,
    paddingHorizontal: 23,
    borderRadius: 10,
    alignSelf: "flex-end",
    marginRight: screenWidth * 0.15,
    maxWidth: 140,
  },
  ButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
  },

  fpw: {
    fontSize: 15,
    color: "#949494",
  },
  join: {
    paddingBottom: 100,
    fontSize: 15,
    color: "#949494",
  },
});
export default LoginScreenStyles;
