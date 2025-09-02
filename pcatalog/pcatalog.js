    (function () {
      const select = document.getElementById('typeFilter');
      const cards  = document.querySelectorAll('.card');

      function applyFilter(value) {
        cards.forEach(card => {
          const show = (value === 'all') || (card.dataset.type === value);
          card.style.display = show ? '' : 'none';
        });
      }

      select.addEventListener('change', e => applyFilter(e.target.value));
      applyFilter(select.value); // initial
    })();