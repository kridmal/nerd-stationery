import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: { main: "#1976d2" },   // blue
    secondary: { main: "#555555" }, // gray
    background: { default: "#f9f9f9", paper: "#ffffff" },
    text: { primary: "#333333", secondary: "#555555" },
  },
  typography: { fontFamily: "Roboto, Arial, sans-serif" },
});

export default theme;
