
    document.querySelectorAll('.faq-question').forEach(question => {
      question.addEventListener('click', () => {
        question.classList.toggle('active');
        const answer = question.nextElementSibling;
        if (question.classList.contains('active')) {
          answer.style.maxHeight = answer.scrollHeight + "px";
        } else {
          answer.style.maxHeight = 0;
        }
      });
    });

    // Profile Dropdown
    document.getElementById('profileBtn').addEventListener('click', function() {
      const dropdown = document.getElementById('dropdownMenu');
      dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
      const dropdown = document.getElementById('dropdownMenu');
      const profileBtn = document.getElementById('profileBtn');
      if (!profileBtn.contains(event.target)) {
        dropdown.style.display = 'none';
      }
    });

    // Form Submission
    document.querySelector('.quotation-form').addEventListener('submit', function(e) {
      e.preventDefault();
      alert('Thank you for your quotation request! We will get back to you within 24 hours.');
      this.reset();
    });

    // File Upload Feedback
    document.getElementById('file-input').addEventListener('change', function() {
      const label = this.previousElementSibling;
      const fileCount = this.files.length;
      if (fileCount > 0) {
        label.textContent = `📎 ${fileCount} file(s) selected`;
        label.style.color = '#ffb347';
      }
    });

document.querySelectorAll('.faq-question').forEach(btn => {
  btn.addEventListener('click', () => {
    btn.closest('.faq').classList.toggle('open');

    // Close all other open FAQs (accordion style)
    document.querySelectorAll('.faq').forEach(f => {
      f.classList.remove('open');
      f.querySelector('.faq-answer').style.maxHeight = '0';
    });

    if (!isOpen) {
      card.classList.add('open');

      // force a minimum box size
      const MIN_HEIGHT = 700; // ⬅️ adjust this to your desired white box size
      const targetHeight = Math.max(ans.scrollHeight, MIN_HEIGHT);

      ans.style.maxHeight = targetHeight + 'px';
    }
  });
});

