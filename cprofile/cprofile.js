// Customer Profile Dashboard JavaScript

class CustomerProfile {
    constructor() {
        this.isEditing = false;
        this.hasUnsavedChanges = false;
        this.originalProfile = {};
        
        // Store original profile data
        this.storeOriginalProfile();
        
        // Initialize event listeners
        this.initializeEventListeners();
        
        // Initialize password toggles
        this.initializePasswordToggles();
    }

    // Store the original profile data for comparison
    storeOriginalProfile() {
        const formData = new FormData(document.getElementById('profile-form'));
        this.originalProfile = {};
        for (let [key, value] of formData.entries()) {
            this.originalProfile[key] = value;
        }
    }

    // Initialize all event listeners
    initializeEventListeners() {
        // Navigation
        this.initializeNavigation();
        
        // Profile management
        this.initializeProfileManagement();
        
        // Password change
        this.initializePasswordManagement();
        
        // Form change tracking
        this.initializeChangeTracking();
    }

    // Navigation between sections
    initializeNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');
        const contentSections = document.querySelectorAll('.content-section');

        navButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Check for unsaved changes before switching
                if (this.hasUnsavedChanges) {
                    if (!confirm('You have unsaved changes. Are you sure you want to leave this section?')) {
                        return;
                    }
                    this.cancelProfileEdit();
                }

                const tabId = button.getAttribute('data-tab');
                
                // Update navigation
                navButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Update content
                contentSections.forEach(section => section.classList.remove('active'));
                const targetSection = document.getElementById(`${tabId}-section`);
                if (targetSection) {
                    targetSection.classList.add('active');
                }
            });
        });
    }

    // Profile editing functionality
    initializeProfileManagement() {
        const editBtn = document.getElementById('edit-profile-btn');
        const saveBtn = document.getElementById('save-profile-btn');
        const cancelBtn = document.getElementById('cancel-profile-btn');

        editBtn.addEventListener('click', () => this.startProfileEdit());
        saveBtn.addEventListener('click', () => this.saveProfile());
        cancelBtn.addEventListener('click', () => this.cancelProfileEdit());
    }

    // Password management
    initializePasswordManagement() {
        const changePasswordBtn = document.getElementById('change-password-btn');
        changePasswordBtn.addEventListener('click', () => this.changePassword());
    }

    // Track form changes
    initializeChangeTracking() {
        const formInputs = document.querySelectorAll('#profile-form input');
        formInputs.forEach(input => {
            input.addEventListener('input', () => {
                if (this.isEditing) {
                    this.hasUnsavedChanges = true;
                    input.classList.add('changed');
                    this.updateSaveButtonState();
                }
            });
        });
    }

    // Initialize password visibility toggles
    initializePasswordToggles() {
        const toggleButtons = document.querySelectorAll('.password-toggle');
        toggleButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetId = button.getAttribute('data-target');
                const targetInput = document.getElementById(targetId);
                const icon = button.querySelector('i');
                
                if (targetInput.type === 'password') {
                    targetInput.type = 'text';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                } else {
                    targetInput.type = 'password'; }
            });
        });
    }
}
