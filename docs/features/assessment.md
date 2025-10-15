# Setup da Funcionalidade de Avaliação

## 1. Configuração do Banco de Dados

Execute o arquivo `supabase-schema.sql` no SQL Editor do Supabase para criar as tabelas necessárias:

```sql
-- Execute o conteúdo do arquivo supabase-schema.sql no Supabase
```

## 2. Estrutura Implementada

### Tabelas Criadas:

- **`text`**: Armazena textos para diagnóstico e treinamento
- **`diagnostic_session`**: Registra sessões de diagnóstico dos usuários
- **`training_session`**: Para futuro uso no módulo RSVP

### Páginas Implementadas:

- `/assessment` - Página inicial com instruções
- `/assessment/reading` - Leitura do texto com timer
- `/assessment/quiz` - Teste de compreensão
- `/assessment/results` - Resultados da avaliação

### Componentes Criados:

- `Timer.tsx` - Timer para cronometrar leitura
- `ScrollLockTextArea.tsx` - Área de texto sem scroll para cima
- `QuizQuestion.tsx` - Pergunta de múltipla escolha

### Server Actions:

- `getRandomDiagnosticText()` - Busca texto diagnóstico
- `saveDiagnosticSession()` - Salva sessão com cálculos
- `getUserDiagnosticHistory()` - Histórico de avaliações
- `checkUserHasAssessment()` - Verifica se usuário fez avaliação

## 3. Funcionalidades Implementadas

### ✅ Avaliação Inicial Completa:

1. **Seleção de Texto**: Sistema busca texto diagnóstico aleatório
2. **Cronometragem**: Timer preciso em milissegundos
3. **Scroll Lock**: Interface impede voltar durante leitura
4. **Quiz de Compreensão**: Perguntas de múltipla escolha
5. **Cálculos Automáticos**: WPM e score de compreensão
6. **Resultados Detalhados**: Interface com métricas e recomendações

### ✅ Middleware de Redirecionamento:

- Usuários sem avaliação são redirecionados automaticamente
- Proteção de rotas autenticadas

### ✅ Preparação para Multi-idioma:

- Campo `language` nas tabelas
- Estrutura flexível para expansão

## 4. Como Testar

1. **Execute o schema SQL no Supabase**
2. **Faça login na aplicação**
3. **Acesse qualquer rota protegida** - será redirecionado para `/assessment`
4. **Complete o fluxo completo**:
   - Leia o texto
   - Responda o quiz
   - Veja os resultados

## 5. Próximos Passos

- Implementar módulo RSVP de treinamento
- Adicionar mais textos diagnósticos
- Implementar sistema de progresso
- Adicionar relatórios detalhados

## 6. Notas Técnicas

- **Cálculo WPM**: `(num_words / reading_time_ms) * 60000`
- **Target WPM**: `initial_wpm * 1.20` (+20%)
- **Comprehension**: `(correct_answers / total_questions) * 100`
- **Segurança**: RLS habilitado em todas as tabelas
- **Performance**: Índices criados para otimização
