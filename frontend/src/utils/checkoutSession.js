const KEY = "checkoutSession";

const load = () => {
  try {
    const raw = localStorage.getItem(KEY) || "{}";
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (err) {
    console.error("Failed to load checkout session", err);
    return {};
  }
};

const save = (data) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch (err) {
    console.error("Failed to save checkout session", err);
  }
};

export const getCheckoutSession = () => load();

export const setCheckoutSession = (updates) => {
  const current = load();
  const next = { ...current, ...updates };
  save(next);
  return next;
};

export const clearCheckoutSession = () => {
  try {
    localStorage.removeItem(KEY);
  } catch (err) {
    console.error("Failed to clear checkout session", err);
  }
};
