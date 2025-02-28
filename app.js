document.addEventListener('DOMContentLoaded', () => {
  // Elementos da interface
  const inputJson = document.getElementById('inputJson');
  const processButton = document.getElementById('process-button');
  const clearInputButton = document.getElementById('clear-input');
  const clearHistoryButton = document.getElementById('clear-history');
  const resultsContainer = document.getElementById('results-container');
  const navButtons = document.querySelectorAll('.nav-button');
  
  // Estado da aplicação
  let currentSection = 'format-json';
  let history = [];
  
  // Carrega o histórico do localStorage
  try {
    const savedHistory = localStorage.getItem('jsonToolsHistory');
    if (savedHistory) {
      const parsedHistory = JSON.parse(savedHistory);
      
      // Verifica se cada item tem um ID e atualiza propriedades
      parsedHistory.forEach(item => {
        // Adiciona ID se não existir
        if (!item.id) {
          item.id = new Date(item.timestamp).getTime() || Date.now();
        }
        
        // Marca resultados de formatação e string-to-json como HTML
        if ((item.operation === 'format-json' || 
             item.operation === 'string-to-json' || 
             item.operation === 'sort-json') && 
            item.success) {
          item.isHtmlResult = true;
        }
      });
      
      // Ordena por ID em ordem decrescente
      history = parsedHistory.sort((a, b) => b.id - a.id);
    }
  } catch (error) {
    console.error('Erro ao carregar histórico:', error);
    // Em caso de erro, começa com histórico vazio
    history = [];
  }
  
  // Renderiza o histórico inicial
  renderHistory();
  
  // Navegação entre seções
  navButtons.forEach(button => {
    button.addEventListener('click', () => {
      navButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      currentSection = button.dataset.section;
      
      // Atualiza o texto do botão de processamento
      updateProcessButtonText();
    });
  });
  
  // Atualiza o texto do botão de processamento com base na seção atual
  function updateProcessButtonText() {
    switch(currentSection) {
      case 'format-json':
        processButton.textContent = 'Formatar';
        break;
      case 'string-to-json':
        processButton.textContent = 'Converter';
        break;
      case 'compact-json':
        processButton.textContent = 'Compactar';
        break;
    }
  }
  
  // Inicializa o texto do botão
  updateProcessButtonText();
  
  // Processa o JSON quando o botão é clicado
  processButton.addEventListener('click', processJson);
  
  // Limpa a entrada
  clearInputButton.addEventListener('click', () => {
    inputJson.value = '';
  });
  
  // Limpa o histórico
  clearHistoryButton.addEventListener('click', () => {
    // Confirma com o usuário
    if (confirm('Tem certeza que deseja limpar todo o histórico?')) {
      // Limpa o array de histórico
      history = [];
      
      // Remove do localStorage
      localStorage.removeItem('jsonToolsHistory');
      
      // Renderiza o estado vazio
      renderHistory();
    }
  });
  
  // Função para processar o JSON com base na seção atual
  function processJson() {
    const input = inputJson.value.trim();
    if (!input) return;
    
    let result = '';
    let success = true;
    let errorMessage = '';
    let isHtmlResult = false;
    
    try {
      switch(currentSection) {
        case 'format-json':
          const parsed = JSON.parse(input);
          // Usa a formatação normal para armazenar no histórico
          result = JSON.stringify(parsed, null, 2);
          // Marca que este resultado deve ser renderizado como HTML
          isHtmlResult = true;
          break;
          
        case 'string-to-json':
          // Remove aspas do início e fim se existirem
          const cleanInput = input.replace(/^["']|["']$/g, '');
          // Substitui aspas escapadas por aspas normais
          const unescaped = cleanInput.replace(/\\"/g, '"');
          const parsedString = JSON.parse(unescaped);
          result = JSON.stringify(parsedString, null, 2);
          // Marca que este resultado deve ser renderizado como HTML
          isHtmlResult = true;
          break;
          
        case 'compact-json':
          const parsedCompact = JSON.parse(input);
          result = JSON.stringify(parsedCompact);
          break;
        
        case 'sort-json':
          const parsedForSort = JSON.parse(input);
          const sortedJson = sortJsonAlphabetically(parsedForSort);
          result = JSON.stringify(sortedJson, null, 2);
          // Marca que este resultado deve ser renderizado como HTML
          isHtmlResult = true;
          break;
      }
    } catch (error) {
      success = false;
      errorMessage = error.message;
      result = `Erro: ${error.message}`;
    }
    
    // Adiciona ao histórico
    const historyItem = {
      id: Date.now(),
      timestamp: new Date().toLocaleString(),
      operation: currentSection,
      input,
      result,
      success,
      isHtmlResult
    };
    
    // Adiciona o novo item ao início do array
    history.unshift(historyItem);
    
    // Limita o histórico a 50 itens
    if (history.length > 50) {
      history = history.slice(0, 50);
    }
    
    // Salva no localStorage
    localStorage.setItem('jsonToolsHistory', JSON.stringify(history));
    
    // Remove destaque de todos os itens existentes
    document.querySelectorAll('.result-item.highlight').forEach(item => {
      item.classList.remove('highlight');
    });
    
    // Renderiza o novo item (que será destacado)
    renderHistoryItem(historyItem, true, true);
  }
  
  // Renderiza todo o histórico
  function renderHistory() {
    // Limpa o contêiner de resultados
    while (resultsContainer.firstChild) {
      resultsContainer.removeChild(resultsContainer.firstChild);
    }
    
    // Se não houver histórico, mostra o estado vazio
    if (history.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      emptyState.innerHTML = `
        <i class="fas fa-code"></i>
        <p>Os resultados processados aparecerão aqui</p>
      `;
      resultsContainer.appendChild(emptyState);
      return;
    }
    
    // Garante que os itens estejam ordenados por ID (timestamp) em ordem decrescente
    const sortedHistory = [...history].sort((a, b) => b.id - a.id);
    
    // Renderiza cada item do histórico, destacando apenas o primeiro (mais recente)
    sortedHistory.forEach((item, index) => renderHistoryItem(item, index === 0, false));
  }
  
  // Renderiza um único item do histórico
  function renderHistoryItem(item, highlight = false, addToTop = true) {
    // Remove o estado vazio se existir
    const emptyState = resultsContainer.querySelector('.empty-state');
    if (emptyState) {
      resultsContainer.removeChild(emptyState);
    }
    
    // Clona o template
    const template = document.getElementById('result-item-template');
    const resultItem = document.importNode(template.content, true).querySelector('.result-item');
    
    // Preenche os dados
    resultItem.querySelector('.timestamp').textContent = `${getOperationName(item.operation)} • ${item.timestamp}`;
    
    const resultContent = resultItem.querySelector('.result-content');
    
    // Verifica se é um resultado HTML (JSON formatado com numeração de linhas)
    if (item.isHtmlResult && item.success) {
      resultContent.innerHTML = formatJsonWithLineNumbers(item.result);
      
      // Adiciona os event listeners para os botões de colapso
      setTimeout(() => {
        const toggleButtons = resultContent.querySelectorAll('.toggle-block');
        toggleButtons.forEach(button => {
          button.addEventListener('click', function() {
            const blockId = this.dataset.block;
            const lineNumber = parseInt(this.closest('.json-line').dataset.line);
            const icon = this.querySelector('i');
            
            // Encontra todas as linhas que pertencem a este bloco
            const allLines = resultContent.querySelectorAll('.json-line');
            let isCollapsed = icon.classList.contains('fa-chevron-right');
            
            // Alterna o ícone
            if (isCollapsed) {
              icon.classList.replace('fa-chevron-right', 'fa-chevron-down');
            } else {
              icon.classList.replace('fa-chevron-down', 'fa-chevron-right');
            }
            
            // Obtém a linha atual
            const currentLine = allLines[lineNumber - 1];
            const currentContent = currentLine.querySelector('.line-content').textContent;
            
            // Determina se estamos lidando com o nó raiz (apenas se for a primeira linha)
            const isRootNode = lineNumber === 1 && (trimContent(currentContent) === '{' || trimContent(currentContent) === '[');
            
            if (isRootNode) {
              // Tratamento especial para o nó raiz
              // Oculta todas as linhas exceto a primeira e a última
              for (let i = 0; i < allLines.length; i++) {
                // Pula a primeira linha (abertura do objeto/array)
                if (i === lineNumber - 1) continue;
                
                // Pula a última linha (fechamento do objeto/array)
                if (i === allLines.length - 1) continue;
                
                // Oculta/mostra todas as outras linhas
                allLines[i].style.display = isCollapsed ? 'flex' : 'none';
              }
            } else {
              // Tratamento para propriedades e objetos aninhados
              // Determina se estamos lidando com uma propriedade que é um objeto/array
              const isPropertyWithObject = /^[\s]*"[^"]+"\s*:\s*[{\[]/.test(currentContent);
              
              // Encontra o nível de indentação deste bloco
              const currentIndent = getIndentLevel(currentContent);
              
              // Encontra o fechamento correspondente
              let inBlock = false;
              let blockDepth = 0;
              
              for (let i = lineNumber; i < allLines.length; i++) {
                const line = allLines[i];
                const content = line.querySelector('.line-content').textContent;
                const indent = getIndentLevel(content);
                const trimmedContent = trimContent(content);
                
                // Se for a primeira linha (a que contém o botão de colapso)
                if (i === lineNumber) {
                  inBlock = true;
                  
                  // Se for uma propriedade sem objeto, pule esta linha
                  if (!isPropertyWithObject) {
                    continue;
                  }
                }
                
                // Aumenta a profundidade quando encontramos uma abertura
                if (trimmedContent === '{' || trimmedContent === '[') {
                  blockDepth++;
                }
                
                // Diminui a profundidade quando encontramos um fechamento
                if (trimmedContent === '}' || trimmedContent === '},' || 
                    trimmedContent === ']' || trimmedContent === '],') {
                  blockDepth--;
                }
                
                // Se voltamos ao mesmo nível de indentação e encontramos um fechamento,
                // então chegamos ao fim do bloco
                if (inBlock && indent <= currentIndent && blockDepth <= 0 && 
                    (trimmedContent === '}' || trimmedContent === '},' || 
                     trimmedContent === ']' || trimmedContent === '],')) {
                  
                  // Se for uma propriedade com objeto, também ocultamos a linha de fechamento
                  if (isPropertyWithObject) {
                    line.style.display = isCollapsed ? 'flex' : 'none';
                  }
                  
                  inBlock = false;
                  continue;
                }
                
                // Oculta/mostra as linhas dentro do bloco
                if (inBlock) {
                  line.style.display = isCollapsed ? 'flex' : 'none';
                }
              }
            }
          });
        });
      }, 0);
    } else {
      resultContent.textContent = item.result;
    }
    
    // Adiciona classe para o tipo de operação
    resultItem.classList.add(item.operation);
    
    // Adiciona classe de erro se necessário
    if (!item.success) {
      resultItem.classList.add('error');
      // Remove a classe da operação para evitar conflito visual
      resultItem.classList.remove(item.operation);
    }
    
    // Adiciona destaque se for o item mais recente
    if (highlight) {
      resultItem.classList.add('highlight');
    }
    
    // Configura o botão de cópia
    const copyButton = resultItem.querySelector('.copy-button');
    copyButton.addEventListener('click', () => {
      navigator.clipboard.writeText(item.result)
        .then(() => {
          // Feedback visual temporário
          const originalIcon = copyButton.innerHTML;
          copyButton.innerHTML = '<i class="fas fa-check"></i>';
          setTimeout(() => {
            copyButton.innerHTML = originalIcon;
          }, 1500);
        });
    });
    
    // Configura o botão de reutilização
    const reuseButton = resultItem.querySelector('.reuse-button');
    reuseButton.addEventListener('click', () => {
      // Verifica se o item foi processado com sucesso
      if (item.success) {
        // Se for um resultado de erro, não faz nada
        if (item.result.startsWith('Erro:')) {
          return;
        }
        
        // Coloca o resultado no campo de entrada
        // Se for um resultado de compactação, vamos formatá-lo para melhor visualização
        if (item.operation === 'compact-json') {
          try {
            const parsed = JSON.parse(item.result);
            inputJson.value = JSON.stringify(parsed, null, 2);
          } catch (error) {
            inputJson.value = item.result;
          }
        } else {
          inputJson.value = item.result;
        }
        
        // Dá foco ao campo de entrada
        inputJson.focus();
        
        // Feedback visual temporário
        const originalIcon = reuseButton.innerHTML;
        reuseButton.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => {
          reuseButton.innerHTML = originalIcon;
        }, 1500);
        
        // Rola a página para o topo para mostrar o campo de entrada
        window.scrollTo(0, 0);
      }
    });
    
    // Configura o botão de remoção
    const removeButton = resultItem.querySelector('.remove-button');
    removeButton.addEventListener('click', () => {
      // Remove o item do histórico
      history = history.filter(historyItem => historyItem.id !== item.id);
      
      // Salva o histórico atualizado no localStorage
      localStorage.setItem('jsonToolsHistory', JSON.stringify(history));
      
      // Animação de fade-out antes de remover
      resultItem.style.opacity = '0';
      resultItem.style.transform = 'scale(0.95)';
      
      // Após a animação, remove o elemento do DOM
      setTimeout(() => {
        resultsContainer.removeChild(resultItem);
        
        // Se não houver mais itens, mostra o estado vazio
        if (history.length === 0) {
          const emptyState = document.createElement('div');
          emptyState.className = 'empty-state';
          emptyState.innerHTML = `
            <i class="fas fa-code"></i>
            <p>Os resultados processados aparecerão aqui</p>
          `;
          resultsContainer.appendChild(emptyState);
        }
      }, 300); // Tempo da animação
    });
    
    // Configura o botão de expandir/colapsar
    const toggleButton = resultItem.querySelector('.toggle-expand');
    
    // Verifica se o conteúdo precisa de expansão (tem barra de rolagem)
    function checkOverflow() {
      const needsExpansion = resultContent.scrollHeight > resultContent.clientHeight;
      toggleButton.style.display = needsExpansion ? 'flex' : 'none';
    }
    
    // Configura o botão de expandir/colapsar
    toggleButton.addEventListener('click', () => {
      const isExpanded = resultContent.classList.toggle('expanded');
      toggleButton.querySelector('i').className = isExpanded ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
      toggleButton.querySelector('span').textContent = isExpanded ? 'Mostrar menos' : 'Mostrar mais';
    });
    
    // Verifica após renderização se precisa do botão de expansão
    setTimeout(checkOverflow, 0);
    
    // Insere no contêiner na posição correta
    if (addToTop && resultsContainer.firstChild) {
      // Se addToTop for true, insere no topo (para novos itens)
      resultsContainer.insertBefore(resultItem, resultsContainer.firstChild);
    } else {
      // Caso contrário, adiciona ao final (para carregar histórico)
      resultsContainer.appendChild(resultItem);
    }
  }
  
  // Função para ordenar JSON alfabeticamente (recursivamente)
  function sortJsonAlphabetically(obj) {
    // Se não for um objeto ou for null, retorna o valor como está
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    // Se for um array, ordena cada elemento do array recursivamente
    if (Array.isArray(obj)) {
      return obj.map(item => sortJsonAlphabetically(item));
    }
    
    // Para objetos, cria um novo objeto com as chaves ordenadas
    const sortedObj = {};
    const keys = Object.keys(obj).sort();
    
    for (const key of keys) {
      // Ordena recursivamente o valor de cada propriedade
      sortedObj[key] = sortJsonAlphabetically(obj[key]);
    }
    
    return sortedObj;
  }
  
  // Obtém o nome amigável da operação
  function getOperationName(operation) {
    switch(operation) {
      case 'format-json':
        return 'Formatação JSON';
      case 'string-to-json':
        return 'String para JSON';
      case 'compact-json':
        return 'Compactação JSON';
      case 'sort-json':
        return 'Ordenação JSON';
      default:
        return 'Operação';
    }
  }
  
  // Função para formatar JSON com numeração de linhas e colapso
  function formatJsonWithLineNumbers(jsonString) {
    try {
      // Analisa o JSON
      const jsonObj = JSON.parse(jsonString);
      
      // Converte para string formatada
      const formattedJson = JSON.stringify(jsonObj, null, 2);
      
      // Divide em linhas
      const lines = formattedJson.split('\n');
      
      // Cria o HTML com numeração de linhas e botões de colapso
      let html = '<div class="json-viewer">';
      let indentLevel = 0;
      let collapsibleBlocks = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNumber = i + 1;
        const trimmedLine = line.trim();
        
        // Calcula o nível de indentação
        indentLevel = line.match(/^\s*/)[0].length / 2;
        
        // Verifica se a linha contém o início de um objeto ou array
        const isOpenBracket = trimmedLine === '{' || trimmedLine === '[';
        const isCloseBracket = trimmedLine === '}' || trimmedLine === '},' || trimmedLine === ']' || trimmedLine === '],';
        
        // Verifica se a linha contém uma propriedade que é um objeto ou array
        const isPropertyWithObject = /^"[^"]+"\s*:\s*[{\[]/.test(trimmedLine);
        
        // Cria o HTML para a linha
        html += `<div class="json-line" data-line="${lineNumber}">`;
        html += `<span class="line-number">${lineNumber}</span>`;
        
        // Adiciona botão de colapso para aberturas de objetos e arrays
        if (isOpenBracket || isPropertyWithObject) {
          const blockId = `block-${lineNumber}`;
          collapsibleBlocks.push({ id: blockId, level: indentLevel });
          
          html += `<span class="toggle-block" data-block="${blockId}">
                    <i class="fas fa-chevron-down"></i>
                  </span>`;
        } else if (isCloseBracket && collapsibleBlocks.length > 0) {
          // Remove o último bloco da pilha quando encontramos um fechamento
          collapsibleBlocks.pop();
          html += `<span class="toggle-placeholder"></span>`;
        } else {
          html += `<span class="toggle-placeholder"></span>`;
        }
        
        // Adiciona o conteúdo da linha com destaque de sintaxe
        html += `<span class="line-content">${formatJsonSyntax(line)}</span>`;
        html += '</div>';
      }
      
      html += '</div>';
      return html;
    } catch (error) {
      return `<pre>${escapeHtml(jsonString)}</pre>`;
    }
  }
  
  // Função para formatar a sintaxe do JSON com cores
  function formatJsonSyntax(line) {
    // Escapa o HTML primeiro
    let escapedLine = escapeHtml(line);
    
    // Destaca as chaves (keys)
    escapedLine = escapedLine.replace(/"([^"]+)"(\s*:)/g, '<span class="key">"$1"</span>$2');
    
    // Destaca strings
    escapedLine = escapedLine.replace(/: "([^"]+)"/g, ': <span class="string">"$1"</span>');
    
    // Destaca números
    escapedLine = escapedLine.replace(/: (\d+)/g, ': <span class="number">$1</span>');
    
    // Destaca booleanos
    escapedLine = escapedLine.replace(/: (true|false)/g, ': <span class="boolean">$1</span>');
    
    // Destaca null
    escapedLine = escapedLine.replace(/: (null)/g, ': <span class="null">$1</span>');
    
    return escapedLine;
  }
  
  // Função auxiliar para escapar HTML
  function escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
  
  // Função auxiliar para obter o nível de indentação
  function getIndentLevel(line) {
    return line.match(/^\s*/)[0].length / 2;
  }
  
  // Função auxiliar para remover espaços em branco
  function trimContent(content) {
    return content.trim();
  }
}); 