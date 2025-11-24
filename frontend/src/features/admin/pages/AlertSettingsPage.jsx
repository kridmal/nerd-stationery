import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { message } from "antd";
import AdminLayout from "../components/AdminLayout";
import useAdminSession from "../hooks/useAdminSession";
import { getAlertSettings, updateAlertSettings } from "../../../services/api";

const hours = Array.from({ length: 24 }).map((_, idx) => idx.toString().padStart(2, "0"));
const isValidEmail = (email) =>
  typeof email === "string" &&
  email.trim().length > 3 &&
  /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());

const AlertSettingsPage = () => {
  const navigate = useNavigate();
  const { isRootAdmin } = useAdminSession();
  const [receiverEmail, setReceiverEmail] = useState("");
  const [ccInput, setCcInput] = useState("");
  const [ccEmails, setCcEmails] = useState([]);
  const [sendHour, setSendHour] = useState("09");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const isFormValid = useMemo(() => receiverEmail && isValidEmail(receiverEmail) && hours.includes(sendHour), [
    receiverEmail,
    sendHour,
  ]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await getAlertSettings();
      setReceiverEmail(data?.receiverEmail || "");
      setCcEmails(Array.isArray(data?.ccEmails) ? data.ccEmails : []);
      setSendHour(data?.sendHour || "09");
    } catch (error) {
      message.error(error?.response?.data?.message || "Failed to load alert settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isRootAdmin) {
      message.warning("Only root admins can manage alert settings.");
      navigate("/admin-dashboard");
      return;
    }
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRootAdmin, navigate]);

  const addCcEmail = (value) => {
    const trimmed = (value || "").trim();
    if (!trimmed) return;
    if (!isValidEmail(trimmed)) {
      message.warning("Please enter a valid email for CC.");
      return;
    }
    if (ccEmails.includes(trimmed)) return;
    setCcEmails((prev) => [...prev, trimmed]);
    setCcInput("");
  };

  const handleCcKeyDown = (event) => {
    if (event.key === "Enter" || event.key === "," || event.key === "Tab") {
      event.preventDefault();
      addCcEmail(ccInput);
    }
  };

  const handleSave = async () => {
    if (!isFormValid) {
      message.warning("Please provide a valid receiver email and send time.");
      return;
    }
    try {
      setSaving(true);
      await updateAlertSettings({
        receiverEmail,
        ccEmails,
        sendHour,
      });
      message.success("Alert settings saved.");
    } catch (error) {
      message.error(error?.response?.data?.message || "Failed to save alert settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title="Alert Settings" subtitle="Configure daily low-stock email alerts">
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Paper
          elevation={3}
          sx={{
            maxWidth: 720,
            mx: "auto",
            p: { xs: 2, md: 3 },
            borderRadius: 2,
            background: "linear-gradient(135deg, #f7fafc 0%, #ffffff 60%)",
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} mb={2}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: "#1f2937" }}>
                Daily Low-Stock Alerts
              </Typography>
              <Typography variant="body2" sx={{ color: "#4b5563" }}>
                Emails are sent once per day at the configured time when items are below minimum quantity.
              </Typography>
            </Box>
            <Button variant="outlined" onClick={() => loadSettings()} disabled={loading}>
              Refresh
            </Button>
          </Stack>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Stack spacing={3}>
              <TextField
                label="Alert Receiver Email"
                value={receiverEmail}
                onChange={(e) => setReceiverEmail(e.target.value)}
                fullWidth
                placeholder="alerts@company.com"
              />

              <Box>
                <TextField
                  label="CC Emails"
                  value={ccInput}
                  onChange={(e) => setCcInput(e.target.value)}
                  onKeyDown={handleCcKeyDown}
                  placeholder="Press Enter to add"
                  fullWidth
                />
                <Stack direction="row" flexWrap="wrap" gap={1} mt={1}>
                  {ccEmails.map((email) => (
                    <Chip key={email} label={email} onDelete={() => setCcEmails((prev) => prev.filter((c) => c !== email))} />
                  ))}
                  {ccEmails.length === 0 && (
                    <Typography variant="caption" sx={{ color: "#6b7280" }}>
                      Optional: add colleagues to be copied.
                    </Typography>
                  )}
                </Stack>
              </Box>

              <FormControl fullWidth>
                <InputLabel id="send-hour-label">Automatic Send Time</InputLabel>
                <Select
                  labelId="send-hour-label"
                  label="Automatic Send Time"
                  value={sendHour}
                  onChange={(e) => setSendHour(e.target.value)}
                  MenuProps={{ disableScrollLock: true }}
                >
                  {hours.map((h) => (
                    <MenuItem key={h} value={h}>
                      {`${h}:00`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="flex-end">
                <Button variant="outlined" onClick={() => navigate("/admin/manage-quantity")}>
                  Back
                </Button>
                <Button variant="contained" onClick={handleSave} disabled={!isFormValid || saving}>
                  {saving ? "Saving..." : "Save Settings"}
                </Button>
              </Stack>
            </Stack>
          )}
        </Paper>
      </Box>
    </AdminLayout>
  );
};

export default AlertSettingsPage;
