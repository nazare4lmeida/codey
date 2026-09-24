# Mudanças — persistência, personagens e áudio

## 1. Bugs de persistência ("personagem errado")

| Causa | Correção |
|---|---|
| Cache do companheiro com chave global (`codey_companion_index`): vazava entre contas no mesmo computador | Cache por usuário (`codey_companion:v2:<id>`); a chave antiga é apagada |
| Erro de rede tratado como "sem personagem" → ida ao criador → escolha sobrescrita pela Vix | Só redireciona quando o servidor **confirma** que não há personagem; erro mantém o cache |
| Cada página buscava o companheiro sozinha; o Perfil mostrava o mascote antes | `CompanionProvider` (src/lib/companion-context.tsx) é a fonte única; `CompanionAvatar` mostra um círculo neutro enquanto carrega |
| Objeto `user` recriado a cada evento do Supabase (inclusive renovação de token) | Mesma referência enquanto id/nome/email não mudam |
| Respostas atrasadas sobrescreviam as corretas | Toda busca descarta respostas de efeitos já cancelados |
| Criador de companheiro podia sobrescrever a escolha antes de carregar | Começa no companheiro salvo; "Entrar no mapa" espera carregar; não sobrescreve o que a criança já mexeu |
| Progresso gravado só localmente quando o servidor falhava | `src/lib/progress.ts`: fila de pendências reenviada ao voltar a internet; recupera conclusões antigas |
| `isIslandComplete` comparava com o formato errado de chave | Usa `island-X-lesson-Y` |

Testes: `npm test` (src/test/persistence.test.tsx cobre todos os cenários acima).

## 2. Carregamento lento

- Imagens: ~25 MB → ~1,5 MB. Ilhas 5–11 (1,8 MB cada) redimensionadas; companheiros em SVG/WebP.
- Fontes: saíram do `@import` no CSS (bloqueante) para `<link>` com preconnect no `index.html`.
- Tema escuro aplicado antes do primeiro desenho da tela (sem flash claro).
- Páginas secundárias carregadas sob demanda; bibliotecas em blocos separados (cache entre atualizações).

## 3. Personagens

Companheiros definidos pela autora (arte original), recortados com fundo transparente e salvos em WebP
em `src/assets/companion-*.webp`:

| Índice | Nome | Criatura | Herdou o lugar de |
|---|---|---|---|
| 0 | Vix | raposinha de cauda cristalina | — |
| 1 | Brasa | dragão de lava | Drakai |
| 2 | Nuvi | grifinho lilás | Mira |
| 3 | Musgo | filhote da floresta com lótus | Cervo Verdejante |
| 4 | Marola | axolote de coral | Anciã Turtara |
| 5 | Astro | ursinho cósmico | Lobo Astral |
| 6 | Codey | mascote (bolinha de cristal) | novo |

O índice é salvo no banco (`characters.accessory`): quem já tinha escolhido mantém a posição e passa
a ver a criatura nova de tema parecido. Novos companheiros devem ser adicionados sempre no FIM de `companionList`.

## 4. Áudio

- `src/lib/sound.ts`: sons sintetizados (sem arquivos), timbres suaves, erro sem buzina, teto de volume, anti-rajada.
- `src/components/SoundControl.tsx`: liga/desliga com 1 toque, volume "baixinho → alto", "Testar som", atalho **M**.
- Preferência salva no aparelho. Dicas periódicas do companheiro são silenciosas de propósito.

## 5. Companheiros animados

As animações foram recortadas dos vídeos da autora (fundo removido quadro a quadro) e salvas como
folhas de quadros em `src/assets/anim/<id>-<emoção>.webp` (12 quadros/s, 200 px por quadro).

| Companheiro | Emoções disponíveis |
|---|---|
| Vix | parado, feliz, pensando, tonto, triste |
| Brasa, Nuvi, Musgo, Marola, Astro | parado, feliz, calminho |
| Codey | imagem estática (sem vídeo ainda) |

Como o jogo usa (`src/lib/companionAnimations.ts` → `pickClip`):
- parado: em loop o tempo todo · acerto e fim de lição → feliz
- erro → pensando (ou calminho, se o companheiro não tiver pensando)
- 2º erro seguido → tonto (ou a reação normal de erro)
- triste nunca é usado automaticamente

Detalhes:
- `AnimatedCompanion` carrega primeiro só o "parado"; as outras emoções vêm em segundo plano.
  Enquanto isso mostra a imagem estática. Pausa quando sai da tela ou a aba fica oculta.
- "Animações calmas" (no painel do som, salvo no aparelho; liga sozinho se o sistema pede menos
  movimento): o companheiro fica na pose parada, sem reagir.
- Para acrescentar uma emoção nova: salvar a folha em `src/assets/anim/` e registrar em `ANIMATIONS`.
  Os testes em `src/test/animations.test.ts` conferem se toda emoção registrada tem a sua folha.

## 6. Aura, estilo de apoio e cadastro

- **Aura** (antes "Cor", que era salva mas não mudava nada): brilho suave da cor escolhida atrás
  do companheiro em todas as telas. Aparece na hora na prévia do criador. `src/lib/character-prefs.ts`.
- **Estilo de apoio** (também era salvo sem efeito). Agora só aparecem os que o jogo cumpre:
  - Dicas suaves: ao errar, a dica do exercício aparece sozinha junto da explicação.
  - Modo calmo: sem corações; errar não tira nada.
  - "Passo a passo" e "Testar primeiro" ficam ocultos (índices 1 e 2 preservados) até existir conteúdo para eles.
- **Cadastro**: funciona com a confirmação de e-mail ligada ou desligada no Supabase; erros do Supabase
  traduzidos (ex.: "email rate limit exceeded").
- **Painel admin sem Edge Function**: a antiga função "admin-users" (que precisava ser publicada à parte
  no Supabase e causava "Failed to send a request to the Edge Function") foi substituída por funções SQL:
  `supabase/migrations/20260925120000_admin_sem_edge_function.sql` (rodar uma vez no SQL Editor).
  Todas conferem se quem chama é admin. Criar conta usa o cadastro oficial (cliente sem sessão).
  Proteções novas: ninguém tira o próprio admin nem apaga a própria conta pelo painel.

## 7. Oficinas de desafios, formato "Estilize igual ao modelo" e nomes

- **Oficinas**: uma lição nova por ilha (1-4, 2-4, 3-3, 4-4, 5-3 ... 12-3), com 5 atividades dinâmicas
  cada (60 no total) no tema da ilha. Arquivo: `src/data/codeyChallenges.ts`.
- **Formato novo `style_match`** (`src/components/codey/StyleMatch.tsx`): a criança escolhe cores e estilos,
  vê o próprio elemento mudar ao lado do modelo e o CSS sendo escrito. No erro, diz o que ainda está diferente.
- **`src/test/content.test.ts`** confere TODAS as atividades (lacunas x respostas, labirinto chega ao tesouro,
  bloco da resposta existe na paleta, pares sem texto repetido, CSS válido...). Ele achou 3 defeitos antigos,
  corrigidos: 6-2 (bloco sem recuo: impossível de acertar), 9-1 (respostas repetidas: impossível de completar)
  e 4-1 (solução de referência saía da grade).
- **Nomes**: contas com nome vazio apareciam como "600f14" no painel e "Programador" no ranking.
  `supabase/migrations/20260925130000_nomes_no_ranking.sql` preenche com o nome de programador, corrige o ranking
  e cria um gatilho para os próximos casos. O criador de companheiro também atualiza o nome da conta.
