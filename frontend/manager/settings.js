// settings.js

window.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  document.getElementById('btnSave').addEventListener('click', saveSettingsClick);
});

/* -----------------------------
   LOAD SETTINGS FROM BACKEND
------------------------------ */
async function loadSettings() {
  const res = await apiCall('getSettings', {});
  if (!res) {
    showAlert('Failed to load settings.');
    return;
  }

  document.getElementById('managerEmail').value = res.managerEmail || '';
  document.getElementById('startingSlipNumber').value = res.startingSlipNumber || 10000;
  document.getElementById('autoEmailSlips').checked = !!res.autoEmailSlips;
  document.getElementById('requireEmailConfirmation').checked = !!res.requireEmailConfirmation;
  document.getElementById('emailSubjectTemplate').value = res.emailSubjectTemplate || '';
  document.getElementById('emailBodyTemplate').value = res.emailBodyTemplate || '';
  document.getElementById('companyName').value = res.companyName || '';
  document.getElementById('companyLocation').value = res.companyLocation || '';
}

/* -----------------------------
   SAVE SETTINGS TO BACKEND
------------------------------ */
async function saveSettingsClick() {
  const payload = {
    managerEmail: document.getElementById('managerEmail').value,
    startingSlipNumber: parseInt(document.getElementById('startingSlipNumber').value, 10) || 10000,
    autoEmailSlips: document.getElementById('autoEmailSlips').checked,
    requireEmailConfirmation: document.getElementById('requireEmailConfirmation').checked,
    emailSubjectTemplate: document.getElementById('emailSubjectTemplate').value,
    emailBodyTemplate: document.getElementById('emailBodyTemplate').value,
    companyName: document.getElementById('companyName').value,
    companyLocation: document.getElementById('companyLocation').value
  };

  const res = await apiCall('saveSettings', payload);

  if (res.success) {
    showAlert('Settings saved successfully.');
  } else {
    showAlert('Failed to save settings: ' + res.error);
  }
}
