document.addEventListener('DOMContentLoaded', function() {
  const inputJson = document.getElementById('inputJson');
  const outputJson = document.getElementById('outputJson');
  const formatJsonBtn = document.getElementById('formatJson');
  const stringToJsonBtn = document.getElementById('stringToJson');
  const compactJsonBtn = document.getElementById('compactJson');

  // Formatar JSON
  formatJsonBtn.addEventListener('click', () => {
    try {
      const input = inputJson.value;
      const parsed = JSON.parse(input);
      outputJson.value = JSON.stringify(parsed, null, 2);
    } catch (error) {
      outputJson.value = 'Erro: JSON inválido\n' + error.message;
    }
  });

  // Converter String para JSON
  stringToJsonBtn.addEventListener('click', () => {
    try {
      const input = inputJson.value;
      // Remove aspas do início e fim se existirem
      const cleanInput = input.trim().replace(/^["']|["']$/g, '');
      // Substitui aspas escapadas por aspas normais
      const unescaped = cleanInput.replace(/\\"/g, '"');
      const parsed = JSON.parse(unescaped);
      outputJson.value = JSON.stringify(parsed, null, 2);
    } catch (error) {
      outputJson.value = 'Erro: String JSON inválida\n' + error.message;
    }
  });

  // Compactar JSON
  compactJsonBtn.addEventListener('click', () => {
    try {
      const input = inputJson.value;
      const parsed = JSON.parse(input);
      outputJson.value = JSON.stringify(parsed);
    } catch (error) {
      outputJson.value = 'Erro: JSON inválido\n' + error.message;
    }
  });
}); 