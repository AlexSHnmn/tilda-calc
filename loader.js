// Загружает калькулятор с GitHub Pages и встраивает на страницу
(function() {
  const containerId = 'calc-container';

  fetch('https://alexshnmn.github.io/tilda-calc/calculator-unified.html')
    .then(response => response.text())
    .then(html => {
      // Парсим HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Извлекаем стили из head
      const styles = doc.querySelectorAll('style');
      styles.forEach(style => {
        const newStyle = document.createElement('style');
        newStyle.textContent = style.textContent;
        document.head.appendChild(newStyle);
      });

      // Извлекаем содержимое body
      const bodyContent = doc.body.innerHTML;
      const container = document.getElementById(containerId);

      if (container) {
        container.innerHTML = bodyContent;

        // Реанимируем скрипты
        const scripts = container.querySelectorAll('script');
        scripts.forEach(oldScript => {
          const newScript = document.createElement('script');
          if (oldScript.src) {
            newScript.src = oldScript.src;
          } else {
            newScript.textContent = oldScript.textContent;
          }
          document.body.appendChild(newScript);
        });
      }
    })
    .catch(error => {
      console.error('Ошибка загрузки калькулятора:', error);
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = '<p style="color:red;padding:20px;">Ошибка загрузки калькулятора. Пожалуйста, обновите страницу.</p>';
      }
    });
})();
