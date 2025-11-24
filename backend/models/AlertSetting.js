import mongoose from "mongoose";

const alertSettingSchema = new mongoose.Schema(
  {
    receiverEmail: {
      type: String,
      default: "",
      trim: true,
    },
    ccEmails: {
      type: [String],
      default: [],
    },
    sendHour: {
      type: String,
      default: "09",
      trim: true,
    },
    lastSentDate: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const AlertSetting = mongoose.model("AlertSetting", alertSettingSchema);
export default AlertSetting;
