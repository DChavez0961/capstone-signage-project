// Customer Profile Dashboard — functions only (design untouched)
class CustomerProfile {
  constructor() {
    this.isEditing = false;
    this.hasUnsavedChanges = false;
    this.originalProfile = {};

    // Cache elements
    this.form = document.getElementById('profile-form');
    this.editBtn = document.getElementById('edit-profile-btn');
    this.saveBtn = document.getElementById('save-profile-btn');
    this.cancelBtn = document.getElementById('cancel-profile-btn');
    this.saveCancelGroup = document.getElementById('save-cancel-btns');

    if (!this.form) return;

    // Init
    this.storeOriginalProfile();
    this.initializeNavigation();
    this.initializeProfileManagement();
    this.initializePasswordManagement();
    this.initializeChangeTracking();
    this.initializePasswordToggles();

    // Defaults
    if (this.saveCancelGroup) this.saveCancelGroup.style.display = 'none';
    this.updateSaveButtonState();
  }

  // Save original values for cancel/compare
  storeOriginalProfile() {
    this.originalProfile = {};
    const fd = new FormData(this.form);
    for (const [k, v] of fd.entries()) this.originalProfile[k] = v;
  }

  // Tabs
  initializeNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.content-section');

    navButtons.forEach(button => {
      button.addEventListener('click', () => {
        if (this.isEditing && this.hasUnsavedChanges) {
          const leave = confirm('You have unsaved changes. Leave this section?');
          if (!leave) return;
          this.cancelProfileEdit(false); // silent restore
        }
        const tab = button.getAttribute('data-tab');
        navButtons.forEach(b => b.classList.remove('active'));
        sections.forEach(s => s.classList.remove('active'));
        button.classList.add('active');
        const target = document.getElementById(`${tab}-section`);
        if (target) target.classList.add('active');
      });
    });
  }

  // Edit/Save/Cancel wiring
  initializeProfileManagement() {
    if (!this.editBtn || !this.saveBtn || !this.cancelBtn) return;

    this.editBtn.addEventListener('click', () => this.startProfileEdit());
    this.saveBtn.addEventListener('click', () => this.saveProfile());
    this.cancelBtn.addEventListener('click', () => this.cancelProfileEdit(true));

    // inputs start disabled
    this.toggleInputs(false);
  }

  startProfileEdit() {
    if (this.isEditing) return;
    this.isEditing = true;
    this.hasUnsavedChanges = false;
    this.toggleInputs(true);
    this.editBtn.style.display = 'none';
    this.saveCancelGroup.style.display = 'inline-flex';
    this.updateSaveButtonState();
  }

  cancelProfileEdit(ask = true) {
    if (ask) {
      const ok = confirm('Discard your changes?');
      if (!ok) return;
    }
    // restore original values
    this.form.querySelectorAll('input').forEach(inp => {
      const name = inp.name;
      if (name in this.originalProfile) inp.value = this.originalProfile[name];
      inp.classList.remove('changed');
    });
    this.isEditing = false;
    this.hasUnsavedChanges = false;
    this.toggleInputs(false);
    this.saveCancelGroup.style.display = 'none';
    this.editBtn.style.display = 'inline-flex';
    this.updateSaveButtonState();
  }

  // Save (client-side; wire to backend if needed)
  saveProfile() {
    const emailEl = document.getElementById('email');
    if (emailEl) {
      const email = emailEl.value.trim();
      const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!valid) {
        alert('Please enter a valid email.');
        emailEl.focus();
        return;
      }
    }

    // (Optional) You can add validation for zipCode here if needed
    // const zip = document.getElementById('zipCode')?.value?.trim();

    // TODO: replace with your real API call
    // fetch('/controllers/UserController.php?action=updateProfile', { method:'POST', body:new FormData(this.form), credentials:'include' })

    // Save new originals
    this.storeOriginalProfile();

    // Update welcome name from full name
    const fullName = this.originalProfile.fullName || '';
    const welcome = document.getElementById('welcome-name');
    if (welcome) welcome.textContent = fullName || 'Customer';

    this.isEditing = false;
    this.hasUnsavedChanges = false;
    this.toggleInputs(false);
    this.saveCancelGroup.style.display = 'none';
    this.editBtn.style.display = 'inline-flex';
    this.updateSaveButtonState();

    alert('Profile saved successfully!');
  }

  // Inputs enable/disable
  toggleInputs(enabled) {
    this.form.querySelectorAll('input').forEach(inp => {
      inp.disabled = !enabled;
      if (!enabled) inp.classList.remove('changed');
    });
  }

  // Track changes & enable Save
  initializeChangeTracking() {
    this.form.querySelectorAll('input').forEach(inp => {
      inp.addEventListener('input', () => {
        if (!this.isEditing) return;
        const name = inp.name;
        const orig = this.originalProfile[name] ?? '';
        const changed = inp.value !== orig;
        inp.classList.toggle('changed', changed);
        this.hasUnsavedChanges = this.form.querySelectorAll('input.changed').length > 0;
        this.updateSaveButtonState();
      });
    });

    // Optional: load cached values if you want (left out to avoid changing data flow)
  }

  updateSaveButtonState() {
    if (!this.saveBtn) return;
    this.saveBtn.disabled = !(this.isEditing && this.hasUnsavedChanges);
  }

  // Password change
  initializePasswordManagement() {
    const changeBtn = document.getElementById('change-password-btn');
    if (!changeBtn) return;
    changeBtn.addEventListener('click', () => {
      const p1 = (document.getElementById('newPassword') || {}).value || '';
      const p2 = (document.getElementById('confirmPassword') || {}).value || '';
      if (!p1 || p1.length < 8) {
        alert('New password must be at least 8 characters.');
        document.getElementById('newPassword')?.focus();
        return;
      }
      if (p1 !== p2) {
        alert('New password and confirmation do not match.');
        document.getElementById('confirmPassword')?.focus();
        return;
      }

      // TODO: replace with your real API call
      // fetch('/controllers/UserController.php?action=changePassword', { method:'POST', body:new URLSearchParams({ newPassword: p1 }), credentials:'include' })

      alert('Password changed successfully!');
      document.getElementById('password-form')?.reset();

      // reset icons/types
      document.querySelectorAll('.password-toggle i').forEach(i => {
        i.classList.remove('fa-eye-slash');
        i.classList.add('fa-eye');
      });
      document.querySelectorAll('#password-form input').forEach(inp => inp.type = 'password');
    });
  }

  // Eye icon toggles
  initializePasswordToggles() {
    document.querySelectorAll('.password-toggle').forEach(button => {
      button.addEventListener('click', () => {
        const targetId = button.getAttribute('data-target');
        const targetInput = document.getElementById(targetId);
        const icon = button.querySelector('i');
        if (!targetInput) return;

        if (targetInput.type === 'password') {
          targetInput.type = 'text';
          icon?.classList.remove('fa-eye');
          icon?.classList.add('fa-eye-slash');
        } else {
          targetInput.type = 'password';
          icon?.classList.remove('fa-eye-slash');
          icon?.classList.add('fa-eye');
        }
      });
    });
  }
}

window.addEventListener('DOMContentLoaded', () => new CustomerProfile());
