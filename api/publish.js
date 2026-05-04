/**
 * Vercel API для публикации настроек калькулятора на GitHub Pages
 *
 * Переменные окружения (устанавливаются в Vercel):
 * - GITHUB_TOKEN: Personal Access Token с правами Contents: Read and write
 * - GITHUB_REPO: owner/repo (e.g., AlexSHnmn/tilda-calc)
 * - GITHUB_FILE: путь к файлу (e.g., calculator-unified.html)
 * - GITHUB_BRANCH: ветка (e.g., main)
 */

export default async function handler(req, res) {
  // Только POST запросы
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { settings } = req.body;
    if (!settings) {
      return res.status(400).json({ error: 'Отсутствуют настройки' });
    }

    const token = process.env.GITHUB_TOKEN;
    const repo = process.env.GITHUB_REPO || 'AlexSHnmn/tilda-calc';
    const file = process.env.GITHUB_FILE || 'calculator-unified.html';
    const branch = process.env.GITHUB_BRANCH || 'main';

    if (!token) {
      return res.status(500).json({ error: 'GitHub токен не конфигурирован на сервере' });
    }

    const apiUrl = `https://api.github.com/repos/${repo}/contents/${file}`;
    const headers = {
      'Authorization': `token ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github.v3+json',
    };

    // 1. Получить текущий файл и sha
    const getResponse = await fetch(apiUrl, { headers });
    if (!getResponse.ok) {
      return res.status(500).json({
        error: 'Ошибка получения файла с GitHub',
        details: await getResponse.text(),
      });
    }

    const data = await getResponse.json();
    if (!data.content || !data.sha) {
      return res.status(500).json({ error: 'Нет данных файла на GitHub' });
    }

    // 2. Декодировать содержимое
    const raw = Buffer.from(data.content, 'base64').toString('utf8');

    // 3. Найти и заменить EMBEDDED_SETTINGS
    const newLine = `const EMBEDDED_SETTINGS = ${JSON.stringify(settings)};`;
    const lines = raw.split('\n');
    const idx = lines.findIndex(l => l.trim().startsWith('const EMBEDDED_SETTINGS'));

    if (idx === -1) {
      return res.status(500).json({
        error: 'Строка EMBEDDED_SETTINGS не найдена в файле',
      });
    }

    lines[idx] = newLine;
    const updated = lines.join('\n');

    // 4. Закодировать обратно в base64
    const newContent = Buffer.from(updated, 'utf8').toString('base64');

    // 5. Отправить обновление на GitHub
    const putResponse = await fetch(apiUrl, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        message: 'Обновление настроек калькулятора',
        content: newContent,
        sha: data.sha,
        branch,
      }),
    });

    if (!putResponse.ok) {
      const error = await putResponse.text();
      return res.status(500).json({
        error: 'Ошибка публикации на GitHub',
        details: error,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Опубликовано на GitHub Pages (~30 сек до обновления)',
    });
  } catch (error) {
    console.error('Ошибка:', error);
    return res.status(500).json({
      error: 'Внутренняя ошибка сервера',
      message: error.message,
    });
  }
}
