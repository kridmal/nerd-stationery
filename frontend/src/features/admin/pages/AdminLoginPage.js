import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Container,
  Divider,
  FormControlLabel,
  GlobalStyles,
  Grid,
  IconButton,
  InputAdornment,
  Link,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { keyframes } from "@mui/system";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
`;

const logoPlaceholder =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='60' viewBox='0 0 220 60'%3E%3Crect width='220' height='60' rx='12' fill='%23071B3F'/%3E%3Ctext x='50%' y='50%' fill='%23F8F9FF' font-family='Manrope, Arial, sans-serif' font-size='18' font-weight='700' text-anchor='middle' dominant-baseline='middle'%3ENERD%20STATIONERY%3C/text%3E%3C/svg%3E";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
const adminRoles = ["root_admin", "manager_admin", "admin"];
const normalizeAdminRole = (role) => {
  if (role === "root_admin" || role === "Root Admin") return "root_admin";
  if (role === "manager_admin" || role === "admin") return "manager_admin";
  return role;
};

const AdminLoginPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem("adminRememberEmail");
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  const isFormValid = useMemo(
    () => emailPattern.test(email) && password.trim().length > 0,
    [email, password]
  );

  const validateFields = () => {
    const validationErrors = {};
    if (!email.trim()) {
      validationErrors.email = "Admin email is required";
    } else if (!emailPattern.test(email)) {
      validationErrors.email = "Enter a valid email address";
    }

    if (!password.trim()) {
      validationErrors.password = "Password is required";
    }

    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setGeneralError("");

    if (!validateFields()) {
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        "http://54.179.149.89:5000/api/auth/login",
        {
          email,
          password,
        },
        {
          headers: { "x-admin-portal": "true" },
        }
      );

      const normalizedRole = normalizeAdminRole(response.data.user?.role);
      if (!adminRoles.includes(normalizedRole)) {
        setGeneralError("You are not authorized to access the admin portal.");
        return;
      }

      localStorage.setItem("adminToken", response.data.token);
      localStorage.setItem(
        "adminInfo",
        JSON.stringify({ ...response.data.user, role: normalizedRole })
      );

      if (rememberMe) {
        localStorage.setItem("adminRememberEmail", email);
      } else {
        localStorage.removeItem("adminRememberEmail");
      }

      navigate("/admin-dashboard", { replace: true });
    } catch (err) {
      const message =
        err.response?.data?.message || "Invalid email or password. Please try again.";
      setGeneralError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <GlobalStyles
        styles={`
          @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap');
          body { font-family: 'Manrope', 'Inter', 'Segoe UI', sans-serif; background: #f7f8fb; }
        `}
      />
      <Container
        maxWidth="lg"
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          py: { xs: 6, md: 8 },
        }}
      >
        <Grid
          container
          spacing={4}
          sx={{
            boxShadow: { md: "0px 20px 80px rgba(7, 27, 63, 0.15)" },
            borderRadius: { md: 4 },
            overflow: "hidden",
            backgroundColor: "transparent",
          }}
        >
          <Grid
            item
            xs={12}
            md={6}
            sx={{
              display: { xs: "none", md: "flex" },
              position: "relative",
              background: `linear-gradient(135deg, #071B3F 0%, #0E2E68 50%, #16407E 100%)`,
              color: "#fff",
              minHeight: { md: 560 },
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                background: `
                  radial-gradient(circle at 20% 20%, ${alpha(
                    theme.palette.secondary.main,
                    0.16
                  )}, transparent 35%),
                  radial-gradient(circle at 80% 10%, ${alpha(
                    theme.palette.primary.light,
                    0.2
                  )}, transparent 30%),
                  radial-gradient(circle at 50% 80%, ${alpha(
                    theme.palette.secondary.dark,
                    0.25
                  )}, transparent 32%)
                `,
              }}
            />
            <Box
              sx={{
                position: "relative",
                zIndex: 1,
                p: { md: 6 },
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: 3,
                maxWidth: 520,
              }}
            >
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 1.5,
                  backgroundColor: alpha("#FFFFFF", 0.08),
                  color: "#E9EDF6",
                  borderRadius: 999,
                  px: 2.2,
                  py: 1,
                  width: "fit-content",
                  border: `1px solid ${alpha("#FFFFFF", 0.12)}`,
                }}
              >
                <ShieldOutlinedIcon fontSize="small" />
                <Typography variant="body2">Secure admin workspace</Typography>
              </Box>
              <Typography variant="h4" fontWeight={700} lineHeight={1.2}>
                Nerd Stationery Admin Suite
              </Typography>
              <Typography variant="body1" color={alpha("#FFFFFF", 0.88)}>
                Monitor inventory, manage orders, and safeguard data with a calm, focused
                workspace tailored for your Nerd Stationery team.
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  flexWrap: "wrap",
                }}
              >
                {["Role-based access", "24/7 monitoring", "Encrypted sessions"].map(
                  (chip) => (
                    <Box
                      key={chip}
                      sx={{
                        px: 1.8,
                        py: 0.8,
                        borderRadius: 20,
                        backgroundColor: alpha("#FFFFFF", 0.1),
                        border: `1px solid ${alpha("#FFFFFF", 0.2)}`,
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      {chip}
                    </Box>
                  )
                )}
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} md={6} sx={{ display: "flex", alignItems: "center" }}>
            <Box width="100%" display="flex" justifyContent="center">
              <Paper
                elevation={10}
                sx={{
                  width: "100%",
                  maxWidth: 520,
                  p: { xs: 3, sm: 4 },
                  borderRadius: 4,
                  backgroundColor: "#fff",
                  animation: `${fadeIn} 0.65s ease`,
                  boxShadow: "0px 20px 70px rgba(7, 27, 63, 0.12)",
                }}
              >
                <Box display="flex" flexDirection="column" alignItems="center" gap={1.5}>
                  <Box
                    component="img"
                    src={logoPlaceholder}
                    alt="Nerd Stationery logo"
                    sx={{ height: 48, objectFit: "contain" }}
                  />
                  <Typography variant="h5" fontWeight={700} color="text.primary">
                    Nerd Stationery Admin Portal
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Authorized Access Only
                  </Typography>
                </Box>

                <Divider sx={{ my: 3 }} />

                <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                  <LockOutlinedIcon color="primary" />
                  <Typography variant="subtitle1" fontWeight={600}>
                    Sign in securely
                  </Typography>
                </Box>

                {generalError && (
                  <Box
                    sx={{
                      mb: 2,
                      px: 2,
                      py: 1.5,
                      borderRadius: 2,
                      backgroundColor: alpha(theme.palette.error.main, 0.08),
                      border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                      color: theme.palette.error.main,
                      fontWeight: 600,
                    }}
                  >
                    {generalError}
                  </Box>
                )}

                <Box component="form" noValidate onSubmit={handleLogin}>
                  <TextField
                    fullWidth
                    margin="normal"
                    label="Email address"
                    placeholder="Enter admin email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={Boolean(errors.email)}
                    helperText={errors.email || "Use your admin credentials"}
                    autoComplete="email"
                  />

                  <TextField
                    fullWidth
                    margin="normal"
                    label="Password"
                    placeholder="Enter password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    error={Boolean(errors.password)}
                    helperText={errors.password || "Masking enabled by default"}
                    autoComplete="current-password"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            onClick={() => setShowPassword((prev) => !prev)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <Box
                    mt={0.5}
                    mb={2}
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          color="primary"
                        />
                      }
                      label="Remember me"
                    />
                    <Link
                      href="#"
                      underline="hover"
                      sx={{ fontWeight: 600, color: theme.palette.primary.main }}
                    >
                      Forgot password?
                    </Link>
                  </Box>

                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    size="large"
                    disabled={!isFormValid || loading}
                    sx={{
                      py: 1.4,
                      textTransform: "none",
                      fontSize: 16,
                      fontWeight: 700,
                      borderRadius: 2.5,
                      boxShadow: "0px 12px 30px rgba(7, 27, 63, 0.25)",
                      transition: "transform 200ms ease, box-shadow 200ms ease",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: "0px 16px 35px rgba(7, 27, 63, 0.25)",
                      },
                    }}
                  >
                    {loading ? (
                      <Box display="flex" alignItems="center" gap={1}>
                        <CircularProgress size={20} color="inherit" thickness={5} />
                        Authenticating...
                      </Box>
                    ) : (
                      "Login"
                    )}
                  </Button>
                </Box>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  align="center"
                  sx={{ mt: 3 }}
                >
                  © 2025 Nerd Stationery. Admin Panel. All rights reserved.
                </Typography>
              </Paper>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </>
  );
};

export default AdminLoginPage;
