export type Exercise =
  | { type: "info"; title: string; body: string }
  | {
      type: "multiple_choice";
      question: string;
      options: string[];
      correctIndex: number;
      notes: string[];
    }
  | {
      type: "true_false";
      statement: string;
      answer: boolean;
      correctNote: string;
      wrongNote: string;
    }
  | {
      type: "fill_blank";
      prompt: string;
      options: string[];
      answer: string;
      notes: string[];
    }
  | { type: "reorder"; title: string; prompt: string; items: string[]; explanation: string }
  | {
      type: "code_challenge";
      title: string;
      prompt: string;
      starterCode: string;
      hint: string;
      tests: { description: string; expr: string }[];
    }
  | {
      // Quebra-cabeça de ligação: associa cada conceito à sua definição.
      type: "wire_match";
      title: string;
      prompt: string;
      pairs: { left: string; right: string }[];
      explanation: string;
    }
  | {
      // Caça ao bug: o aluno clica na linha quebrada.
      type: "bug_hunt";
      title: string;
      prompt: string;
      language?: string;
      lines: string[];
      buggyIndex: number;
      explanation: string;
      hint: string;
    }
  | {
      // Memória temática: vire cartas para formar pares conceito ↔ explicação.
      type: "memory_match";
      title: string;
      prompt: string;
      pairs: { a: string; b: string }[];
      explanation: string;
    }
  | {
      // Labirinto algorítmico: o companheiro caminha numa grade até o tesouro.
      type: "maze";
      title: string;
      prompt: string;
      cols: number;
      rows: number;
      start: [number, number]; // [col, row]
      goal: [number, number];
      walls: [number, number][];
      solution: ("up" | "down" | "left" | "right")[];
      explanation: string;
    }
  | {
      // Montagem com blocos (estilo Scratch simplificado): arraste blocos na ordem certa, com distratores.
      type: "block_builder";
      title: string;
      prompt: string;
      palette: string[];
      solution: string[];
      explanation: string;
    }
  | {
      // Preencha as lacunas: código com "___" nos espaços e blocos para escolher.
      type: "fill_code";
      title: string;
      prompt: string;
      language?: string;
      code: string; // use "___" para marcar cada lacuna, na ordem
      blanks: string[]; // respostas corretas na mesma ordem
      options: string[]; // blocos disponíveis (com distratores)
      explanation: string;
    };

export type CodeyLesson = {
  id: string;
  title: string;
  xp: number;
  exercises: Exercise[];
};

export type CodeyIsland = {
  id: number;
  name: string;
  weeksLabel: string;
  treasureName: string;
  focus: string;
  shortName: string;
};

export const codeyIslands: CodeyIsland[] = [
  { id: 1, name: "Boas-vindas & Fundamentos da Web", shortName: "Fundamentos", weeksLabel: "Semana 1", treasureName: "Tesouro 0 — Mapa Entregue", focus: "hardware, software, cliente, servidor e URL" },
  { id: 2, name: "Ilha do HTML, CSS & Git", shortName: "HTML, CSS & Git", weeksLabel: "Semanas 2–5", treasureName: "Tesouro 1 — Selo do Construtor", focus: "estrutura, estilos, seletores e versionamento" },
  { id: 3, name: "Bibliotecas Essenciais", shortName: "Bibliotecas", weeksLabel: "Semanas 6–7", treasureName: "Tesouro 2 — Iniciante em Bibliotecas", focus: "Bootstrap, ícones e fontes para acelerar páginas" },
  { id: 4, name: "Floresta da Lógica de Programação", shortName: "Lógica JS", weeksLabel: "Semanas 8–10", treasureName: "Tesouro 3 — Pensamento Lógico", focus: "algoritmos, variáveis, funções e decisões" },
  { id: 5, name: "JavaScript Avançado + APIs", shortName: "JS Avançado", weeksLabel: "Semanas 11–13", treasureName: "Tesouro 4 — Exploradora(or) de APIs", focus: "arrays, filtros, promises e chamadas assíncronas" },
  { id: 6, name: "Reino do React", shortName: "React", weeksLabel: "Semanas 14–17", treasureName: "Tesouro 5 — Arquiteta(o) React", focus: "componentes, props, estado e efeitos" },
  { id: 7, name: "Torre dos Testes", shortName: "Testes", weeksLabel: "Semana 18", treasureName: "Tesouro 6 — Guardiã(o) da Qualidade", focus: "testes automatizados e fluxos E2E" },
  { id: 8, name: "Cavernas do Banco de Dados", shortName: "Banco de Dados", weeksLabel: "Semanas 19–20", treasureName: "Tesouro 7 — Curadora(or) de Dados", focus: "SQL, tabelas, filtros e relações" },
  { id: 9, name: "Forja do Node.js", shortName: "Node.js", weeksLabel: "Semanas 21–22", treasureName: "Tesouro 8 — Arquiteta(o) de Servidor", focus: "JavaScript no servidor e orientação a objetos" },
  { id: 10, name: "Bastião do Express", shortName: "Express", weeksLabel: "Semanas 23–24", treasureName: "Tesouro 9 — Mestre(a) de API", focus: "rotas, controllers, REST e autenticação JWT" },
  { id: 11, name: "Ponte da Integração Final", shortName: "Integração", weeksLabel: "Semana 25", treasureName: "Tesouro 10 — Guardiã(o) Full-Stack", focus: "testes unitários e integração do projeto" },
  { id: 12, name: "Pico do Demo Day", shortName: "Demo Day", weeksLabel: "Semana 26", treasureName: "Tesouro Lendário — Full-Stack Developer", focus: "deploy, revisão final e apresentação" },
];

export const codeyLessons: Record<number, CodeyLesson[]> = {
  1: [
    {
      id: "1-1",
      title: "Hardware x Software",
      xp: 20,
      exercises: [
        { type: "info", title: "Duas metades de um computador", body: "**Hardware** é a parte física: processador, memória, tela e teclado. Dá para tocar.\n\n**Software** é o conjunto de instruções que diz ao hardware o que fazer. É código, escrito em uma linguagem e executado pela máquina." },
        { type: "multiple_choice", question: "Qual das opções abaixo é um exemplo de hardware?", options: ["Processador", "Sistema operacional", "Aplicativo de fotos", "Um arquivo JavaScript"], correctIndex: 0, notes: ["Certo — o processador é um componente físico.", "Errado — sistema operacional é software.", "Errado — aplicativo é software.", "Errado — arquivo de código é texto interpretado pelo computador."] },
        { type: "memory_match", title: "Pares da computação", prompt: "Vire duas cartas e encontre os pares hardware ↔ exemplo, ou software ↔ exemplo.", pairs: [
          { a: "Hardware", b: "Teclado" },
          { a: "Software", b: "Navegador" },
          { a: "Dado", b: "Foto.jpg" },
          { a: "Linguagem", b: "JavaScript" },
        ], explanation: "Hardware é físico; software é instrução; dado é o conteúdo; linguagem é como escrevemos instruções." },
        { type: "true_false", statement: "JavaScript é um tipo de hardware.", answer: false, correctNote: "Isso mesmo — JavaScript é uma linguagem de programação.", wrongNote: "JavaScript não é hardware. É uma linguagem usada para escrever software." },
      ],
    },
    {
      id: "1-2",
      title: "Cliente x Servidor",
      xp: 20,
      exercises: [
        { type: "info", title: "O restaurante da internet", body: "**Cliente** é quem faz o pedido — normalmente o navegador.\n\n**Servidor** é a cozinha — recebe o pedido, processa e devolve uma resposta." },
        { type: "reorder", title: "Coloque o ciclo na ordem certa", prompt: "Em uma requisição na Web, esses passos acontecem nesta ordem:", items: ["Cliente envia um pedido", "Servidor processa", "Servidor responde", "Cliente exibe o resultado"], explanation: "Esse é o ciclo de requisição-resposta, a base da Web." },
        { type: "wire_match", title: "Ligue cada papel", prompt: "Combine cada peça com o que ela faz na Web.", pairs: [
          { left: "Navegador", right: "Faz o pedido" },
          { left: "Servidor", right: "Processa e responde" },
          { left: "URL", right: "Endereço do recurso" },
          { left: "HTML", right: "Conteúdo exibido" },
        ], explanation: "Cada peça tem um papel claro no ciclo de uma página." },
        { type: "multiple_choice", question: "No modelo cliente-servidor, o navegador é o(a)...", options: ["Servidor", "Cliente", "Banco de dados", "Protocolo"], correctIndex: 1, notes: ["Errado — servidor processa pedidos.", "Certo — o navegador faz pedidos em nome da pessoa usuária.", "Errado — banco de dados armazena dados.", "Errado — protocolo é um conjunto de regras."] },
      ],
    },
    {
      id: "1-3",
      title: "Anatomia de uma URL",
      xp: 20,
      exercises: [
        { type: "info", title: "Decompondo um endereço", body: "Uma URL como `https://www.loja.com.br/produtos?cor=azul` tem partes: protocolo, domínio, path e query." },
        { type: "fill_blank", prompt: "Em `https://www.loja.com.br/produtos`, a parte `/produtos` é chamada de:", options: ["Protocolo", "Path", "Domínio", "Query"], answer: "Path", notes: ["Errado — protocolo é `https://`.", "Certo — path é o caminho do recurso.", "Errado — domínio é `www.loja.com.br`.", "Errado — query vem depois de `?`."] },
        { type: "wire_match", title: "Anatomia da URL", prompt: "Combine cada pedaço da URL `https://loja.com/produtos?cor=azul` ao nome certo.", pairs: [
          { left: "https://", right: "Protocolo" },
          { left: "loja.com", right: "Domínio" },
          { left: "/produtos", right: "Path" },
          { left: "?cor=azul", right: "Query" },
        ], explanation: "Toda URL combina essas quatro partes para localizar um recurso." },
        { type: "multiple_choice", question: "O que o DNS faz?", options: ["Traduz nomes de domínio em endereços IP", "Cria páginas HTML", "Armazena senhas", "Compila JavaScript"], correctIndex: 0, notes: ["Certo — DNS traduz nomes legíveis para IPs.", "Errado — isso é tarefa da aplicação.", "Errado — senhas ficam em sistemas de autenticação.", "Errado — DNS não compila código."] },
      ],
    },
  ],
  2: [
    {
      id: "2-1",
      title: "Estrutura HTML",
      xp: 20,
      exercises: [
        { type: "info", title: "O esqueleto de toda página", body: "Todo documento HTML tem uma estrutura básica:\n\n```html\n<html>\n  <head><title>Minha página</title></head>\n  <body><h1>Olá!</h1></body>\n</html>\n```\n\n`head` guarda metadados. `body` guarda o conteúdo visível." },
        { type: "block_builder", title: "Monte a página com blocos", prompt: "Escolha os blocos certos, na ordem, para montar uma página HTML mínima. Cuidado: alguns blocos não devem entrar.", palette: ["<html>", "<head>", "<title>Olá</title>", "<body>", "<h1>Bem-vinda(o)!</h1>", "<random>", "<estilo cor=azul>", "console.log('oi')"], solution: ["<html>", "<head>", "<title>Olá</title>", "<body>", "<h1>Bem-vinda(o)!</h1>"], explanation: "Os blocos vão de fora para dentro: html envolve head e body; title fica no head; o conteúdo visível no body." },
        { type: "multiple_choice", question: "Onde fica o texto que aparece de fato na tela?", options: ["Dentro de <head>", "Dentro de <body>", "Dentro de <title>", "Fora do <html>"], correctIndex: 1, notes: ["Errado — head guarda metadados.", "Certo — body guarda o conteúdo visível.", "Errado — title aparece na aba.", "Errado — nada deve ficar fora do html."] },
      ],
    },
    {
      id: "2-2",
      title: "CSS & Seletores",
      xp: 20,
      exercises: [
        { type: "info", title: "Estilizando com CSS", body: "CSS aplica estilo usando seletores. Classe começa com `.` e pode ser reutilizada. Id começa com `#` e deve ser único." },
        { type: "wire_match", title: "Seletor certo para cada caso", prompt: "Combine o seletor com o que ele alcança.", pairs: [
          { left: ".botao", right: "Todos com class=\"botao\"" },
          { left: "#topo", right: "Único elemento id=\"topo\"" },
          { left: "button", right: "Todos os <button>" },
          { left: "a:hover", right: "Link com mouse em cima" },
        ], explanation: "Classes reutilizam estilos; id é único; tag pega todos; pseudo-classe responde a estados." },
        { type: "fill_blank", prompt: "Você quer aplicar o mesmo estilo a vários botões. Qual seletor faz mais sentido?", options: ["Seletor de classe (.botao)", "Seletor de id (#botao)", "Seletor de tag (button) só", "Nenhum dos três"], answer: "Seletor de classe (.botao)", notes: ["Certo — classes são reutilizáveis.", "Errado — id deve ser único.", "Errado — estiliza todos os botões.", "Errado — algum seletor é necessário."] },
        { type: "bug_hunt", title: "Caça ao bug no CSS", prompt: "Uma linha desta regra CSS está errada. Toque na que tem o problema.", language: "css", lines: [
          ".card {",
          "  background: white;",
          "  color: #333",
          "  border-radius: 12px;",
          "}",
        ], buggyIndex: 2, explanation: "Faltou o `;` no final de `color: #333`. Em CSS, cada propriedade termina com ponto e vírgula.", hint: "Procure uma propriedade sem ponto e vírgula no final." },
        { type: "fill_code", title: "Complete a regra CSS", prompt: "Preencha as lacunas para estilizar um card com fundo branco, texto escuro e cantos arredondados.", language: "css", code: ".card {\n  ___: white;\n  color: ___;\n  border-radius: ___;\n}", blanks: ["background", "#333", "12px"], options: ["background", "color", "font-size", "#333", "azul", "12px", "100%"], explanation: "background define o fundo, color define a cor do texto e border-radius arredonda os cantos." },
      ],
    },
    {
      id: "2-3",
      title: "Git Essencial",
      xp: 20,
      exercises: [
        { type: "info", title: "Versionando seu código", body: "Git guarda o histórico de mudanças. O fluxo comum é:\n\n```bash\ngit add .\ngit commit -m \"mensagem clara\"\ngit push\n```" },
        { type: "block_builder", title: "Monte o fluxo do Git", prompt: "Escolha os comandos certos, na ordem. Alguns blocos são pegadinhas.", palette: ["git add .", "git commit -m \"mensagem\"", "git push", "git delete tudo", "git voar", "git status"], solution: ["git add .", "git commit -m \"mensagem\"", "git push"], explanation: "add prepara, commit salva localmente, push envia para o repositório remoto." },
        { type: "multiple_choice", question: "Para que serve `git commit -m \"mensagem\"`?", options: ["Enviar para o GitHub", "Salvar uma versão local com descrição", "Apagar o histórico", "Criar um repositório"], correctIndex: 1, notes: ["Errado — isso é git push.", "Certo — commit cria um ponto de salvamento.", "Errado — commit não apaga histórico.", "Errado — isso é git init."] },
      ],
    },
  ],
  3: [
    { id: "3-1", title: "Bootstrap Essencial", xp: 20, exercises: [
      { type: "info", title: "Construindo mais rápido", body: "Bootstrap é um framework CSS com componentes prontos, como botões, grids e alertas." },
      { type: "memory_match", title: "Memória de componentes", prompt: "Encontre os pares componente ↔ uso comum.", pairs: [
        { a: "Botão", b: "Ação principal" },
        { a: "Card", b: "Bloco de conteúdo" },
        { a: "Alert", b: "Mensagem importante" },
        { a: "Grid", b: "Organizar em colunas" },
      ], explanation: "Cada componente do Bootstrap tem um papel visual claro." },
      { type: "multiple_choice", question: "Qual a principal vantagem de um framework CSS?", options: ["Oferece componentes prontos e testados", "Substitui o HTML", "É obrigatório", "Guarda senhas"], correctIndex: 0, notes: ["Certo — acelera o desenvolvimento.", "Errado — CSS trabalha junto com HTML.", "Errado — é uma escolha.", "Errado — não tem relação com senhas."] },
    ] },
    { id: "3-2", title: "Ícones & Fontes", xp: 20, exercises: [
      { type: "info", title: "Refinando o visual", body: "Bibliotecas de ícones e fontes deixam a interface mais profissional. Antes de usar uma fonte web, importe-a no HTML ou no CSS." },
      { type: "wire_match", title: "Cada recurso no seu lugar", prompt: "Combine o recurso visual com seu propósito.", pairs: [
        { left: "Ícone", right: "Comunicar ação rápida" },
        { left: "Fonte web", right: "Personalizar a tipografia" },
        { left: "Cor", right: "Criar hierarquia visual" },
        { left: "Espaçamento", right: "Dar respiro à leitura" },
      ], explanation: "Bom design combina tipografia, ícones, cor e espaço." },
      { type: "multiple_choice", question: "Para usar uma fonte do Google Fonts, o que fazer primeiro?", options: ["Importar/linkar a fonte", "Nada", "Comprar licença", "Instalar no computador da visita"], correctIndex: 0, notes: ["Certo — a fonte precisa ser carregada.", "Errado — fontes web não vêm todas no navegador.", "Errado — Google Fonts é gratuito na maioria dos casos.", "Errado — o navegador carrega automaticamente."] },
    ] },
  ],
  4: [
    { id: "4-1", title: "Pensando como um Algoritmo", xp: 20, exercises: [
      { type: "info", title: "O que é um algoritmo?", body: "Um **algoritmo** é uma sequência finita e ordenada de passos para resolver um problema." },
      { type: "maze", title: "Guie seu companheiro até o tesouro", prompt: "Monte a sequência de passos que leva seu companheiro do ponto inicial até o tesouro, evitando as pedras.", cols: 4, rows: 4, start: [0, 3], goal: [3, 0], walls: [[1, 2], [2, 2], [2, 1]], solution: ["up", "up", "right", "up", "right", "right", "up"], explanation: "Algoritmo é exatamente isso: uma lista de instruções, na ordem certa, que leva ao objetivo." },
      { type: "reorder", title: "Monte o algoritmo", prompt: "Coloque os passos de fazer um sanduíche na ordem correta:", items: ["Pegar duas fatias de pão", "Passar manteiga em uma fatia", "Colocar o recheio", "Fechar o sanduíche"], explanation: "A ordem dos passos muda o resultado." },
      { type: "multiple_choice", question: "Por que a ordem importa em um algoritmo?", options: ["Porque o resultado pode mudar", "Não importa", "Só importa em computadores antigos", "Só importa em jogos"], correctIndex: 0, notes: ["Certo — trocar passos pode quebrar o resultado.", "Errado — a ordem quase sempre importa.", "Errado — vale para qualquer computador.", "Errado — vale para muitas tarefas."] },
    ] },
    { id: "4-2", title: "Variáveis em JavaScript", xp: 25, exercises: [
      { type: "info", title: "Guardando informação", body: "Uma variável guarda um valor:\n\n```js\nlet idade = 25;\nconst nome = \"Maria\";\n```\n\nUse `let` quando o valor pode mudar; use `const` quando não vai mudar." },
      { type: "fill_blank", prompt: "Você vai guardar uma idade que pode mudar. Qual palavra-chave usar?", options: ["let", "const", "var antiga", "function"], answer: "let", notes: ["Certo — idade muda.", "Errado — const não deve ser reatribuído.", "Errado — hoje preferimos let/const.", "Errado — function declara funções."] },
      { type: "bug_hunt", title: "Caça ao bug", prompt: "Este código tenta mudar uma constante. Qual linha tem o erro?", language: "javascript", lines: [
        "const nome = \"Ana\";",
        "let idade = 30;",
        "nome = \"João\";",
        "console.log(nome, idade);",
      ], buggyIndex: 2, explanation: "Constantes declaradas com `const` não podem ser reatribuídas. Para mudar o valor, declare com `let`.", hint: "Quem foi declarada com `const` aceita receber outro valor depois?" },
      { type: "code_challenge", title: "Sua primeira função", prompt: "Escreva uma função chamada **saudacao** que recebe `nome` e retorna `\"Olá, \"` seguido do nome.", starterCode: "function saudacao(nome) {\n  // escreva seu código aqui\n\n}", hint: "Use `return \"Olá, \" + nome;`", tests: [{ description: "saudacao(\"Maria\") retorna \"Olá, Maria\"", expr: "saudacao(\"Maria\") === \"Olá, Maria\"" }, { description: "saudacao(\"João\") retorna \"Olá, João\"", expr: "saudacao(\"João\") === \"Olá, João\"" }] },
      { type: "fill_code", title: "Complete a declaração", prompt: "Preencha as lacunas para declarar um nome constante e uma idade que pode mudar, e depois somar 1 à idade.", language: "javascript", code: "___ nome = \"Ana\";\n___ idade = 25;\nidade = idade ___ 1;", blanks: ["const", "let", "+"], options: ["const", "let", "var", "+", "-", "="], explanation: "const para valores que não mudam, let para valores que mudam, e + para somar." },
    ] },
    { id: "4-3", title: "Estruturas de Decisão", xp: 25, exercises: [
      { type: "info", title: "Tomando decisões no código", body: "O `if/else` permite que o programa escolha caminhos:\n\n```js\nif (idade >= 18) {\n  console.log(\"Maior\");\n} else {\n  console.log(\"Menor\");\n}\n```" },
      { type: "block_builder", title: "Monte um if/else com blocos", prompt: "Escolha os blocos certos, na ordem, para montar um if/else que diga 'Maior' ou 'Menor'. Alguns blocos não entram.", palette: ["if (idade >= 18) {", "  console.log(\"Maior\");", "} else {", "  console.log(\"Menor\");", "}", "while (true) {", "return null;"], solution: ["if (idade >= 18) {", "  console.log(\"Maior\");", "} else {", "  console.log(\"Menor\");", "}"], explanation: "if abre o bloco; else é o caminho alternativo; chaves delimitam cada caminho." },
      { type: "multiple_choice", question: "O que `>=` significa?", options: ["Maior que", "Maior ou igual a", "Igual a", "Diferente de"], correctIndex: 1, notes: ["Errado — maior que é >.", "Certo — >= é maior ou igual.", "Errado — igualdade estrita é ===.", "Errado — diferente é !==."] },
      { type: "code_challenge", title: "Maior de idade", prompt: "Escreva uma função **maiorDeIdade** que recebe `idade` e retorna `true` se for maior ou igual a 18.", starterCode: "function maiorDeIdade(idade) {\n  // escreva seu código aqui\n\n}", hint: "Você pode retornar diretamente `idade >= 18`.", tests: [{ description: "20 retorna true", expr: "maiorDeIdade(20) === true" }, { description: "15 retorna false", expr: "maiorDeIdade(15) === false" }, { description: "18 retorna true", expr: "maiorDeIdade(18) === true" }] },
    ] },
  ],
  5: [
    { id: "5-1", title: "Arrays Avançados", xp: 25, exercises: [
      { type: "info", title: "map e filter", body: "`map` transforma cada item. `filter` seleciona itens que passam em um teste." },
      { type: "wire_match", title: "Cada método no lugar certo", prompt: "Combine cada método de array com o que ele faz.", pairs: [
        { left: "map", right: "Transforma cada item" },
        { left: "filter", right: "Seleciona alguns itens" },
        { left: "reduce", right: "Combina tudo em um valor" },
        { left: "find", right: "Acha o primeiro que serve" },
      ], explanation: "Esses métodos são a base do JavaScript moderno para trabalhar com listas." },
      { type: "multiple_choice", question: "O que `[1,2,3].map(n => n * 2)` retorna?", options: ["[1,2,3]", "[2,4,6]", "6", "Um erro"], correctIndex: 1, notes: ["Errado — seria o original.", "Certo — map transforma cada número.", "Errado — map retorna array.", "Errado — o código é válido."] },
      { type: "code_challenge", title: "Filtrando números pares", prompt: "Escreva **soPares** que recebe um array e retorna apenas os números pares.", starterCode: "function soPares(numeros) {\n  // escreva seu código aqui\n\n}", hint: "Use `filter` com `numero % 2 === 0`.", tests: [{ description: "filtra [1,2,3,4,5,6]", expr: "JSON.stringify(soPares([1,2,3,4,5,6])) === JSON.stringify([2,4,6])" }, { description: "sem pares retorna []", expr: "JSON.stringify(soPares([1,3,5])) === JSON.stringify([])" }] },
    ] },
    { id: "5-2", title: "Promises & APIs", xp: 25, exercises: [
      { type: "info", title: "Código que espera", body: "JavaScript usa **Promises** e `async/await` para lidar com respostas que chegam depois, como uma chamada de API." },
      { type: "bug_hunt", title: "Caça ao bug no fetch", prompt: "Este código tenta buscar dados, mas esqueceu de esperar a resposta. Qual linha está errada?", language: "javascript", lines: [
        "async function carregar() {",
        "  const resposta = fetch(\"/api/livros\");",
        "  const dados = await resposta.json();",
        "  console.log(dados);",
        "}",
      ], buggyIndex: 1, explanation: "Faltou `await` antes de `fetch(...)`. Sem ele, `resposta` é uma Promise pendente, e `.json()` falha.", hint: "Uma chamada assíncrona precisa esperar a resposta antes de ler `.json()`." },
      { type: "true_false", statement: "O `fetch` trava a página inteira enquanto espera a resposta.", answer: false, correctNote: "Isso mesmo — fetch é assíncrono.", wrongNote: "fetch é assíncrono; await pausa apenas a função atual." },
      { type: "multiple_choice", question: "Para que serve `await`?", options: ["Declarar variável", "Esperar uma Promise dentro da função", "Criar loop", "Importar biblioteca"], correctIndex: 1, notes: ["Errado — variáveis usam let/const.", "Certo — await espera a Promise resolver.", "Errado — loops usam for/while.", "Errado — imports usam import."] },
    ] },
  ],
  6: [
    { id: "6-1", title: "Componentes & Props", xp: 25, exercises: [
      { type: "info", title: "Peças reutilizáveis", body: "React organiza interfaces em **componentes**. Dados entram por **props**." },
      { type: "wire_match", title: "Conceitos do React", prompt: "Combine cada conceito de React com a descrição.", pairs: [
        { left: "Componente", right: "Peça reutilizável de UI" },
        { left: "Props", right: "Dados do pai para o filho" },
        { left: "Estado", right: "Memória interna que muda" },
        { left: "Efeito", right: "Roda fora da renderização" },
      ], explanation: "Esses quatro pilares formam o coração do React." },
      { type: "multiple_choice", question: "O que são props em React?", options: ["Dados passados de pai para filho", "Erros de código", "Estilos CSS", "Banco de dados"], correctIndex: 0, notes: ["Certo — props são dados recebidos.", "Errado — não são erros.", "Errado — estilos são separados.", "Errado — não são banco de dados."] },
      { type: "true_false", statement: "Um componente filho deve alterar diretamente as props recebidas.", answer: false, correctNote: "Isso mesmo — props são somente leitura.", wrongNote: "Props são somente leitura no filho." },
    ] },
    { id: "6-2", title: "Hooks: useState & useEffect", xp: 25, exercises: [
      { type: "info", title: "Memória e efeitos", body: "`useState` guarda valores que mudam na tela. `useEffect` roda efeitos, como buscar dados ao carregar." },
      { type: "block_builder", title: "Monte um contador com blocos", prompt: "Escolha os blocos para montar um contador. Cuidado com os distratores.", palette: ["const [contador, setContador] = useState(0);", "function Contador() {", "  return (", "    <button onClick={() => setContador(contador + 1)}>{contador}</button>", "  );", "}", "useEffect(() => alert('oi'));", "const contador = 0;"], solution: ["function Contador() {", "  const [contador, setContador] = useState(0);", "  return (", "    <button onClick={() => setContador(contador + 1)}>{contador}</button>", "  );", "}"], explanation: "Estado vive dentro do componente; o botão atualiza o estado, que faz a tela renderizar de novo." },
      { type: "fill_blank", prompt: "Para guardar e atualizar um contador na tela, qual hook usar?", options: ["useState", "useEffect", "useContext", "useNavigate"], answer: "useState", notes: ["Certo — useState guarda estado.", "Errado — useEffect roda efeitos.", "Errado — useContext compartilha dados.", "Errado — useNavigate navega entre páginas."] },
      { type: "multiple_choice", question: "O array vazio `[]` em useEffect significa:", options: ["Roda uma vez ao montar", "Nunca roda", "Roda a cada tecla", "Causa erro"], correctIndex: 0, notes: ["Certo — roda só na montagem.", "Errado — roda uma vez.", "Errado — só se dependesse da tecla.", "Errado — é padrão válido."] },
    ] },
  ],
  7: [
    { id: "7-1", title: "Fundamentos de Testes", xp: 20, exercises: [
      { type: "info", title: "Por que testar automaticamente?", body: "Testes automatizados verificam fluxos repetitivos e críticos sem testar tudo manualmente." },
      { type: "wire_match", title: "Tipos de teste", prompt: "Combine o tipo de teste com o que ele cobre.", pairs: [
        { left: "Unitário", right: "Uma função isolada" },
        { left: "Integração", right: "Várias partes juntas" },
        { left: "E2E", right: "Fluxo completo do usuário" },
        { left: "Manual", right: "Pessoa explorando o app" },
      ], explanation: "Cada nível de teste cobre um escopo diferente. Os três primeiros podem ser automatizados." },
      { type: "true_false", statement: "Testes automatizados eliminam totalmente testes manuais.", answer: false, correctNote: "Isso mesmo — eles ajudam muito, mas revisão humana continua importante.", wrongNote: "Eles reduzem trabalho repetitivo, mas não eliminam tudo." },
      { type: "multiple_choice", question: "O que é um teste E2E?", options: ["Fluxo completo de uso", "Só uma função isolada", "Teste que não falha", "Teste do fim do dia"], correctIndex: 0, notes: ["Certo — simula o uso ponta a ponta.", "Errado — isso é teste unitário.", "Errado — testes podem falhar.", "Errado — não é horário."] },
    ] },
    { id: "7-2", title: "Caça aos Defeitos", xp: 25, exercises: [
      { type: "info", title: "Pensando como quem testa", body: "Quem testa procura ativamente onde o software pode falhar: entradas inesperadas, valores no limite, fluxos incomuns." },
      { type: "bug_hunt", title: "Bug no teste", prompt: "Este teste deveria passar, mas está escrito de forma errada. Qual linha tem o problema?", language: "javascript", lines: [
        "test(\"soma dois números\", () => {",
        "  const resultado = soma(2, 3);",
        "  expect(resultado).toBe(6);",
        "});",
      ], buggyIndex: 2, explanation: "A expectativa está errada: `soma(2, 3)` deve ser `5`, não `6`. Um teste só é útil quando a expectativa também está correta.", hint: "Quanto é 2 + 3 mesmo?" },
      { type: "memory_match", title: "Memória do controle de qualidade", prompt: "Encontre pares conceito ↔ exemplo.", pairs: [
        { a: "Caso de borda", b: "Lista vazia" },
        { a: "Regressão", b: "Bug voltou" },
        { a: "Cobertura", b: "% do código testado" },
        { a: "Mock", b: "Imitar uma API" },
      ], explanation: "São termos do dia a dia de quem cuida da qualidade." },
    ] },
  ],
  8: [
    { id: "8-1", title: "SQL Essencial", xp: 20, exercises: [
      { type: "info", title: "Conversando com o banco", body: "SQL consulta e manipula bancos relacionais:\n\n```sql\nSELECT nome FROM usuarios WHERE idade >= 18;\n```" },
      { type: "wire_match", title: "Comandos SQL", prompt: "Combine cada comando SQL com a ação.", pairs: [
        { left: "SELECT", right: "Buscar dados" },
        { left: "INSERT", right: "Adicionar linha" },
        { left: "UPDATE", right: "Alterar dados" },
        { left: "DELETE", right: "Remover linha" },
      ], explanation: "São os quatro comandos básicos para conversar com um banco relacional (CRUD)." },
      { type: "bug_hunt", title: "Bug na consulta SQL", prompt: "Esta consulta deveria buscar produtos caros, mas está com um problema. Qual linha?", language: "sql", lines: [
        "SELECT nome, preco",
        "FROM produtos",
        "WERE preco > 100",
        "ORDER BY preco DESC;",
      ], buggyIndex: 2, explanation: "Escrito errado: o correto é `WHERE`, não `WERE`. Erros de digitação em palavras-chave do SQL impedem a consulta de rodar.", hint: "Confira a palavra-chave que filtra linhas." },
      { type: "multiple_choice", question: "Em `SELECT * FROM produtos WHERE preco > 100`, o WHERE faz o quê?", options: ["Filtra linhas", "Ordena", "Apaga produtos", "Cria tabela"], correctIndex: 0, notes: ["Certo — WHERE filtra.", "Errado — ordenar é ORDER BY.", "Errado — SELECT não apaga.", "Errado — criar é CREATE TABLE."] },
    ] },
    { id: "8-2", title: "Modelagem Relacional", xp: 20, exercises: [
      { type: "info", title: "Organizando os dados", body: "Dados ficam em tabelas conectadas por chaves. Uma chave estrangeira evita duplicação desnecessária." },
      { type: "memory_match", title: "Memória do banco", prompt: "Encontre os pares conceito ↔ exemplo.", pairs: [
        { a: "Tabela", b: "usuarios" },
        { a: "Coluna", b: "email" },
        { a: "Chave primária", b: "id único" },
        { a: "Chave estrangeira", b: "Liga duas tabelas" },
      ], explanation: "Modelagem relacional vive desses quatro conceitos." },
      { type: "true_false", statement: "É boa prática duplicar todos os dados do usuário em cada pedido.", answer: false, correctNote: "Isso mesmo — prefira referenciar com chave estrangeira.", wrongNote: "Duplicar dados gera inconsistências." },
    ] },
  ],
  9: [
    { id: "9-1", title: "Fundamentos do Node", xp: 25, exercises: [
      { type: "info", title: "JavaScript fora do navegador", body: "Node.js permite rodar JavaScript no servidor, construir APIs, ler arquivos e conectar bancos." },
      { type: "wire_match", title: "Navegador x Node", prompt: "Combine cada recurso ao ambiente onde ele vive.", pairs: [
        { left: "window", right: "Navegador" },
        { left: "document", right: "Navegador" },
        { left: "fs (arquivos)", right: "Node.js" },
        { left: "process.env", right: "Node.js" },
      ], explanation: "JavaScript é a mesma linguagem, mas cada ambiente expõe APIs próprias." },
      { type: "multiple_choice", question: "Diferença principal entre JS no navegador e no Node?", options: ["Ambientes diferentes", "Linguagens diferentes", "Node não aceita funções", "Não existe diferença"], correctIndex: 0, notes: ["Certo — o ambiente muda os recursos disponíveis.", "Errado — é JavaScript nos dois.", "Errado — funções funcionam.", "Errado — há diferenças importantes."] },
      { type: "code_challenge", title: "Simulando uma rota simples", prompt: "Escreva **rotaSaudacao** que recebe `nomeQuery` e retorna `{ mensagem: \"Olá, NOME\" }`.", starterCode: "function rotaSaudacao(nomeQuery) {\n  // escreva seu código aqui\n\n}", hint: "Retorne `{ mensagem: \"Olá, \" + nomeQuery }`.", tests: [{ description: "rotaSaudacao(\"Ana\") retorna objeto correto", expr: "JSON.stringify(rotaSaudacao(\"Ana\")) === JSON.stringify({mensagem:\"Olá, Ana\"})" }] },
    ] },
    { id: "9-2", title: "Orientação a Objetos", xp: 25, exercises: [
      { type: "info", title: "Classes em JavaScript", body: "Classes agrupam dados e comportamento com `constructor` e métodos." },
      { type: "block_builder", title: "Monte uma classe com blocos", prompt: "Escolha os blocos certos para montar a classe Pessoa, na ordem.", palette: ["class Pessoa {", "  constructor(nome) {", "    this.nome = nome;", "  }", "  cumprimentar() {", "    return \"Oi, sou \" + this.nome;", "  }", "}", "let nome;", "function Pessoa() {}"], solution: ["class Pessoa {", "  constructor(nome) {", "    this.nome = nome;", "  }", "  cumprimentar() {", "    return \"Oi, sou \" + this.nome;", "  }", "}"], explanation: "A classe define o molde; o constructor recebe dados; métodos definem comportamentos." },
      { type: "code_challenge", title: "Sua primeira classe", prompt: "Crie a classe **Produto** com `nome`, `preco` e método `descricao()` retornando `\"NOME custa R$PRECO\"`.", starterCode: "class Produto {\n  constructor(nome, preco) {\n    // escreva seu código aqui\n\n  }\n\n  descricao() {\n    // escreva seu código aqui\n\n  }\n}", hint: "Salve em `this.nome` e `this.preco`. Depois monte a string no método.", tests: [{ description: "Produto descreve corretamente", expr: "new Produto(\"Caneta\", 5).descricao() === \"Caneta custa R$5\"" }] },
    ] },
  ],
  10: [
    { id: "10-1", title: "API REST com Express", xp: 25, exercises: [
      { type: "info", title: "Construindo uma API", body: "Express organiza rotas HTTP:\n\n```js\napp.get(\"/produtos\", (req, res) => {\n  res.json([{ id: 1, nome: \"Caneta\" }]);\n});\n```" },
      { type: "wire_match", title: "Verbos HTTP", prompt: "Combine cada verbo HTTP com a ação típica.", pairs: [
        { left: "GET", right: "Ler" },
        { left: "POST", right: "Criar" },
        { left: "PUT", right: "Atualizar" },
        { left: "DELETE", right: "Remover" },
      ], explanation: "REST mapeia cada verbo HTTP a uma operação de dados." },
      { type: "reorder", title: "Fluxo de uma API em camadas", prompt: "Uma requisição passa por:", items: ["Rota recebe a requisição", "Middleware valida/autentica", "Controller processa a lógica", "Resposta é enviada ao cliente"], explanation: "Separar responsabilidades facilita manutenção e testes." },
      { type: "multiple_choice", question: "Qual verbo HTTP costuma CRIAR um novo recurso?", options: ["GET", "POST", "DELETE", "OPTIONS"], correctIndex: 1, notes: ["Errado — GET lê.", "Certo — POST cria.", "Errado — DELETE remove.", "Errado — OPTIONS consulta métodos."] },
    ] },
    { id: "10-2", title: "Autenticação JWT", xp: 25, exercises: [
      { type: "info", title: "Provando quem você é", body: "JWT é um crachá digital: depois do login, o cliente envia o token em requisições protegidas." },
      { type: "block_builder", title: "Monte uma rota protegida", prompt: "Escolha os blocos certos para montar uma rota Express que retorna o perfil só se o token for válido.", palette: ["app.get(\"/perfil\", autenticar, (req, res) => {", "  res.json({ usuario: req.usuario });", "});", "function autenticar(req, res, next) {", "  if (!req.headers.authorization) return res.status(401).end();", "  next();", "}", "app.delete(tudo);", "console.log(req.senha);"], solution: ["function autenticar(req, res, next) {", "  if (!req.headers.authorization) return res.status(401).end();", "  next();", "}", "app.get(\"/perfil\", autenticar, (req, res) => {", "  res.json({ usuario: req.usuario });", "});"], explanation: "Um middleware confere o token; se passar, a rota responde com o dado protegido." },
      { type: "true_false", statement: "Depois do JWT, o cliente envia a senha em toda requisição.", answer: false, correctNote: "Isso mesmo — o token substitui o reenvio da senha.", wrongNote: "O token é enviado, não a senha." },
      { type: "multiple_choice", question: "Onde o JWT normalmente vai?", options: ["Header Authorization", "Corpo de e-mail", "Nome do arquivo", "Nunca é enviado"], correctIndex: 0, notes: ["Certo — geralmente como Bearer TOKEN.", "Errado — e-mail não participa do fluxo.", "Errado — não tem relação com arquivo.", "Errado — precisa provar autenticação."] },
    ] },
  ],
  11: [
    { id: "11-1", title: "Testes com Jest", xp: 25, exercises: [
      { type: "info", title: "Testando funções", body: "Jest verifica se funções se comportam como esperado:\n\n```js\ntest(\"soma\", () => {\n  expect(soma(2, 3)).toBe(5);\n});\n```" },
      { type: "bug_hunt", title: "Bug no teste de Jest", prompt: "Este teste não roda. Qual linha tem o erro?", language: "javascript", lines: [
        "test(\"divisão por zero\", () => {",
        "  const resultado = dividir(8, 0);",
        "  expect(resultado).toBe(null;",
        "});",
      ], buggyIndex: 2, explanation: "Faltou fechar o parêntese de `.toBe(null)`. Pequenos erros de sintaxe quebram o arquivo todo de testes.", hint: "Conte os parênteses abertos e fechados na linha do expect." },
      { type: "code_challenge", title: "Função testável", prompt: "Escreva **dividir** que retorna `a / b`. Se `b` for 0, retorne `null`.", starterCode: "function dividir(a, b) {\n  // escreva seu código aqui\n\n}", hint: "Comece com `if (b === 0) return null;`", tests: [{ description: "10 / 2 retorna 5", expr: "dividir(10, 2) === 5" }, { description: "8 / 0 retorna null", expr: "dividir(8, 0) === null" }] },
    ] },
    { id: "11-2", title: "Caminho da Integração", xp: 20, exercises: [
      { type: "info", title: "Juntando tudo", body: "Integrar um projeto full-stack é conectar front-end, API, banco e autenticação. Cada peça precisa conversar com a outra." },
      { type: "maze", title: "Caminho da requisição", prompt: "Guie seu companheiro pelo caminho que uma requisição percorre: do front até o banco e de volta.", cols: 5, rows: 3, start: [0, 1], goal: [4, 1], walls: [[2, 0], [2, 2]], solution: ["right", "right", "right", "right"], explanation: "Frontend → API → Banco e a resposta volta pelo mesmo caminho. Manter a linha de comunicação clara facilita debugar." },
      { type: "wire_match", title: "Quem fala com quem", prompt: "Combine cada camada com sua responsabilidade.", pairs: [
        { left: "Front-end (React)", right: "Mostrar a tela" },
        { left: "API (Express)", right: "Receber e processar pedidos" },
        { left: "Banco (SQL)", right: "Guardar os dados" },
        { left: "JWT", right: "Provar quem está logado" },
      ], explanation: "Cada camada faz uma coisa muito bem. Juntas, formam o full-stack." },
    ] },
  ],
  12: [
    { id: "12-1", title: "Publicando seu Projeto", xp: 25, exercises: [
      { type: "info", title: "Do seu computador para o mundo", body: "Deploy é publicar sua aplicação em um servidor real. Antes, revise variáveis de ambiente, segredos e testes." },
      { type: "block_builder", title: "Checklist do deploy com blocos", prompt: "Escolha, na ordem, os passos certos para publicar com segurança. Cuidado com as pegadinhas.", palette: ["Rodar testes locais", "Tirar senhas do código e usar variáveis de ambiente", "Fazer build de produção", "Publicar no servidor", "Avisar o time", "Subir senha no GitHub", "Apagar a internet"], solution: ["Rodar testes locais", "Tirar senhas do código e usar variáveis de ambiente", "Fazer build de produção", "Publicar no servidor", "Avisar o time"], explanation: "Esse é o ritual de um deploy tranquilo: validar, proteger, empacotar, publicar e comunicar." },
      { type: "true_false", statement: "É seguro colocar senhas direto no código que vai para o GitHub.", answer: false, correctNote: "Isso mesmo — segredos ficam em variáveis de ambiente.", wrongNote: "Nunca coloque senhas no código versionado." },
    ] },
    { id: "12-2", title: "Demo Day", xp: 25, exercises: [
      { type: "info", title: "Apresentando seu projeto", body: "No Demo Day, conte uma história curta: qual problema, qual solução, como funciona e o que aprendeu." },
      { type: "memory_match", title: "Memória da jornada", prompt: "Encontre os pares ilha ↔ conquista que você fez nessa jornada.", pairs: [
        { a: "HTML & CSS", b: "Construir telas" },
        { a: "JavaScript", b: "Dar vida à página" },
        { a: "React", b: "Componentes reutilizáveis" },
        { a: "Node + Express", b: "Servir uma API" },
        { a: "Banco de Dados", b: "Guardar informação" },
        { a: "Testes", b: "Confiança no código" },
      ], explanation: "Você passou por todas essas ilhas — e o Demo Day é a celebração de tudo." },
      { type: "info", title: "Tesouro Lendário", body: "Você concluiu a jornada pelas 12 ilhas: HTML, CSS, JavaScript, React, banco, Node, Express, testes e deploy." },
    ] }],
};

export const lessonsForIsland = (islandId: number) => codeyLessons[islandId] || [];
export const findLesson = (islandId: number, lessonId: string) =>
  lessonsForIsland(islandId).find((lesson) => lesson.id === lessonId) || null;
