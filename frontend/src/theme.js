import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#071B3F",
      light: "#123067",
      dark: "#020816",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#820035",
      light: "#B3124C",
      dark: "#5a0024",
      contrastText: "#FFFFFF",
    },
    background: {
      default: "#F4F4F4",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#3D3D3D",
      secondary: "#9A9A9A",
    },
    divider: "#E5E5E5",
  },
});

export default theme;
