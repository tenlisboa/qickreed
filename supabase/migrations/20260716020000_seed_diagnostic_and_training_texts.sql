-- QICA-10: Seed diagnostic + training texts (pt-BR) with quizzes.
--
-- Provides a non-empty first-user experience: a fresh user, after signup +
-- assessment, sees a diagnostic text with a working quiz, and can run an RSVP
-- training session against a training text.
--
-- All rows are inserted as admin/ownerless (user_id IS NULL) so the existing
-- "Text is viewable by authenticated users" SELECT policy exposes them to every
-- authenticated user. RLS is NOT disabled — inserts run with the service role
-- during `supabase db reset` / migration apply, which bypasses RLS by default.
--
-- num_words is pre-calculated and authoritative (server-side WPM depends on it).
-- quiz_json matches the QuizData shape ({ questions: [{ id, question, options,
--   correct }] }) consumed by src/app/(authenticated)/assessment/quiz/page.tsx
--   and src/components/QuizQuestion.tsx. The optional `type` field (what/who/
--   when/where/why) is admin metadata; the runtime quiz UI ignores it.
--
-- Diagnostic texts: 500-700 words, standardized complexity (per
--   docs/business_rules.md), HTML allowed (rendered via DOMPurify in the
--   assessment reading view).
-- Training texts: plain text only (no HTML) so RsvpDisplay's word-splitting
--   (text.split(/\s+/)) stays clean. Each training text carries a quiz so the
--   post-RSVP cognitive validation (QICA-12) can run without an LLM.
--
-- Idempotent: a UNIQUE constraint on (title, language) backs the
-- ON CONFLICT (title, language) DO NOTHING below so the seed can be re-applied
-- safely without duplicates.

BEGIN;

-- Natural-key uniqueness so ON CONFLICT (title, language) works. Only applies
-- to ownerless seed/admin texts (user_id IS NULL); user-pasted training texts
-- (QICA-15) keep arbitrary titles since each row is owned and filtered by owner.
ALTER TABLE text
  ADD CONSTRAINT text_title_language_key UNIQUE (title, language);

-- ───────────────────────────────────────────────────────────────────────────
-- Diagnostic text 1 — "A Revolução da Imprensa" (~560 words, HTML)
-- ───────────────────────────────────────────────────────────────────────────
INSERT INTO text (type, title, content, num_words, quiz_json, language)
VALUES (
  'diagnostic',
  'A Revolução da Imprensa',
  $diag1$<p>A invenção da prensa móvel por Johannes Gutenberg, por volta de 1440, é frequentemente descrita como um dos eventos mais transformadores da história humana. Antes de Gutenberg, os livros eram copiados à mão por monges em scriptoria, um processo lento, caro e propenso a erros. Uma única Bíblia podia levar meses para ser copiada e custava o equivalente a uma pequena propriedade rural. O conhecimento, portanto, era um privilégio restrito ao clero, à nobreza e a pouquíssimas universidades.</p>

<p>Gutenberg, ourives da cidade alemã de Mogúncia, combinou três ideias existentes em uma única inovação. A primeira foi o tipo móvel: letras individuais de metal que podiam ser rearranjadas para formar diferentes páginas. A segunda foi uma tinta à base de óleo, aderente o suficiente para marcar o papel sem borrar. A terceira, e talvez a mais decisiva, foi a adaptação da prensa de vinho, até então usada para espremer uvas, em um mecanismo de impressão preciso.</p>

<p>O resultado foi a Bíblia de Gutenberg, concluída em 1455. Cada página apresentava caracteres nítidos e uniformes, e a produção de cerca de 180 cópias levou muito menos tempo do que a cópia manual de uma única Bíblia anterior. O preço de um livro caiu drasticamente, e o número de exemplares em circulação multiplicou.</p>

<p>O efeito mais imediato foi sobre a alfabetização. Quando os livros se tornaram acessíveis, mais pessoas tiveram motivo para aprender a ler. As universidades deixaram de depender de manuscritos raros e passaram a adotar edições impressas idênticas. Professores podiam, pela primeira vez, garantir que todos os alunos de uma turma estavam lendo exatamente o mesmo texto, sem variações de cópia.</p>

<p>A imprensa também foi decisiva para a Reforma Protestante. Em 1517, quando Martinho Lutero fixou suas noventa e cinco teses na porta da igreja de Wittenberg, o documento foi reimpresso e distribuído por toda a Europa em questão de semanas. Sem a prensa, a crítica de Lutero à venda de indulgências provavelmente teria permanecido um debate local. Com a prensa, tornou-se um movimento que subdividiu o cristianismo ocidental de forma permanente.</p>

<p>O Renascimento científico também se beneficiou diretamente. Nicolaus Copérnico publicou sua obra sobre o movimento da Terra em 1543, e edições posteriores permitiram que astrônomos de países distintos comparassem observações usando as mesmas tabelas. Galileu Galilei, no século seguinte, dependeu da imprensa para divulgar experimentos que contradiziam a física aristotélica. A replicabilidade, base do método científico, tornou-se viável porque instruções idênticas podiam chegar a laboratórios distantes.</p>

<p>Há também um efeito muitas vezes negligenciado: a padronização das línguas vernaculares. Antes da imprensa, cada região escrevia seu dialeto de forma variável. Ao imprimir os mesmos caracteres em cidades diferentes, os editores tenderam a fixar a ortografia e a gramática. O alemão moderno, o inglês moderno e o francês moderno devem muito à escolha editorial de quais variantes imprimir.</p>

<p>Em menos de cinquenta anos, prensas funcionavam em mais de duzentas cidades europeias. Estima-se que, até 1500, mais de vinte milhões de volumes já haviam sido impressos. Esse volume é maior do que a produção acumulada de todos os copistas europeus dos mil anos anteriores combinados.</p>

<p>De qualquer forma, o gesto de combinar peças existentes em um novo arranjo funcional permanece como um modelo de inovação. Gutenberg não inventou o metal, nem a tinta, nem a prensa. Inventou a combinação. E, com ela, transformou o conhecimento em algo que, pela primeira vez na história, podia ser copiado sem perda e compartilhado em escala.</p>$diag1$,
  563,
  jsonb_build_object(
    'questions', jsonb_build_array(
      jsonb_build_object('id', 1, 'type', 'who',   'question', 'Quem inventou a prensa móvel por volta de 1440?', 'options', jsonb_build_array('Johannes Gutenberg', 'Martinho Lutero', 'Nicolaus Copérnico', 'Galileu Galilei'), 'correct', 0),
      jsonb_build_object('id', 2, 'type', 'when',  'question', 'Em que ano foi concluída a Bíblia de Gutenberg?', 'options', jsonb_build_array('1440', '1455', '1468', '1500'), 'correct', 1),
      jsonb_build_object('id', 3, 'type', 'where', 'question', 'De qual cidade alemã era Gutenberg?', 'options', jsonb_build_array('Wittenberg', 'Mogúncia', 'Roma', 'Paris'), 'correct', 1),
      jsonb_build_object('id', 4, 'type', 'what',  'question', 'Qual mecanismo Gutenberg adaptou para a impressão?', 'options', jsonb_build_array('Prensa de vinho', 'Moinho de vento', 'Torno de ourives', 'Tear manual'), 'correct', 0),
      jsonb_build_object('id', 5, 'type', 'why',   'question', 'Por que a imprensa foi decisiva para a Reforma Protestante?', 'options', jsonb_build_array('Porque reduziu o custo da papelaria', 'Porque permitiu que as teses de Lutero fossem reimpressas e distribuídas rapidamente', 'Porque financiou a construção de catedrais', 'Porque substituiu o latim pelo alemão'), 'correct', 1)
    )
  ),
  'pt-BR'
)
ON CONFLICT (title, language) DO NOTHING;

-- ───────────────────────────────────────────────────────────────────────────
-- Diagnostic text 2 — "A Fotossíntese e o Ciclo do Carbono" (~580 words, HTML)
-- ───────────────────────────────────────────────────────────────────────────
INSERT INTO text (type, title, content, num_words, quiz_json, language)
VALUES (
  'diagnostic',
  'A Fotossíntese e o Ciclo do Carbono',
  $diag2$<p>A fotossíntese é o processo pelo qual plantas, algas e algumas bactérias convertem energia luminosa em energia química. Esse processo sustenta quase toda a vida na Terra, direta ou indiretamente, e regula a composição química da atmosfera há bilhões de anos. Compreender como ele funciona é entender o mecanismo que mantém o ar respirável e a cadeia alimentar funcional.</p>

<p>As plantas absorvem gás carbônico da atmosfera por pequenas aberturas nas folhas chamadas estômatos. Ao mesmo tempo, captam água do solo pelas raízes. Dentro das folhas, nas estruturas chamadas cloroplastos, um pigmento verde chamado clorofila absorve luz, principalmente nos comprimentos de onda vermelho e azul. Essa luz fornece a energia necessária para reorganizar as moléculas de água e gás carbônico em glicose e oxigênio.</p>

<p>A equação simplificada do processo é: gás carbônico mais água, na presença de luz, produz glicose e oxigênio. A glicose serve como combustível para a própria planta e como base para a produção de celulose e amido. O oxigênio é liberado como subproduto, e é precisamente esse subproduto que tornou possível a existência de organismos que respiram oxigênio, como nós.</p>

<p>Foram as cianobactérias, há cerca de 2,4 bilhões de anos, que começaram a liberar oxigênio na atmosfera em escala relevante. Esse evento, conhecido como Grande Oxidação, transformou uma atmosfera redutora em uma atmosfera oxidante. Organismos anaeróbios que dominavam o planeta foram empurrados para nichos isolados. A partir daí, organismos que podiam usar o oxigênio para extrair energia de alimentos, com muito maior eficiência, passaram a predominar.</p>

<p>A fotossíntese também é o início do ciclo do carbono. O gás carbônico da atmosfera é fixado em moléculas orgânicas pela planta. Quando a planta é comida por um herbívoro, esse carbono passa a integrar o corpo do animal. Quando o herbívoro é comido por um carnívoro, o carbono sobe mais um nível na cadeia. Em cada etapa, parte do carbono é devolvida à atmosfera pela respiração, e outra parte é armazenada na biomassa.</p>

<p>Quando os organismos morrem, os decompositores quebram a matéria orgânica e devolvem o carbono ao solo e ao ar. Parte desse carbono, em condições geológicas especiais, é enterrada e, ao longo de milhões de anos, pode formar combustíveis fósseis como carvão, petróleo e gás natural. Esse carbono fica, portanto, fora do ciclo ativo por longos períodos.</p>

<p>A Revolução Industrial, a partir do século dezoito, mudou isso ao queimar combustíveis fósseis em escala crescente. O carbono que estava enterrado há milhões de anos foi devolvido à atmosfera em poucos séculos. A concentração de gás carbônico na atmosfera, que permanecera relativamente estável por cerca de dez mil anos, subiu de aproximadamente 280 partes por milhão em 1750 para mais de 420 partes por milhão nos dias de hoje.</p>

<p>Esse aumento tem uma consequência direta. O gás carbônico é transparente à luz visível, mas absorve radiação infravermelha. A luz do Sol chega à superfície terrestre, aquece o solo e os oceanos, e esses corpos emitem calor de volta na forma de infravermelho. Parte desse calor, que antes escapava para o espaço, é agora retida pela atmosfera mais rica em gás carbônico. Esse é o efeito estufa intensificado.</p>

<p>A floresta amazônica desempenha um papel importante nesse contexto. Estima-se que ela absorva, em condições normais, dezenas de bilhões de toneladas de gás carbônico por ano. Quando áreas da floresta são queimadas, dois efeitos se somam: perde-se a capacidade de absorção futura, e o carbono que estava armazenado na madeira é liberado imediatamente na atmosfera.</p>

<p>Há também o papel dos oceanos. A água do mar absorve parte do gás carbônico atmosférico, formando ácido carbônico. Esse processo reduz a concentração do gás no ar, mas acidifica a água, o que dificulta a formação de conchas e corais. O equilíbrio entre absorção oceânica e emissão atmosférica é delicado e está sendo alterado pela ação humana.</p>

<p>Entender a fotossíntese, portanto, não é apenas uma questão de botânica. É entender o mecanismo que regula o oxigênio que respiramos, o alimento que consumimos e o clima do planeta. Esse processo silencioso, que acontece nas folhas, é a base sobre a qual a complexidade da vida se sustenta.</p>$diag2$,
  679,
  jsonb_build_object(
    'questions', jsonb_build_array(
      jsonb_build_object('id', 1, 'type', 'what',  'question', 'O que a fotossíntese converte em energia química?', 'options', jsonb_build_array('Energia luminosa', 'Energia elétrica', 'Energia nuclear', 'Energia mecânica'), 'correct', 0),
      jsonb_build_object('id', 2, 'type', 'where', 'question', 'Em qual estrutura da folha ocorre a fotossíntese?', 'options', jsonb_build_array('Nos estômatos', 'Nos cloroplastos', 'Nas raízes', 'No caule'), 'correct', 1),
      jsonb_build_object('id', 3, 'type', 'who',   'question', 'Quais organismos iniciaram a liberação de oxigênio há cerca de 2,4 bilhões de anos?', 'options', jsonb_build_array('As plantas terrestres', 'As cianobactérias', 'Os fungos', 'Os decompositores'), 'correct', 1),
      jsonb_build_object('id', 4, 'type', 'when',  'question', 'A partir de quando a concentração de gás carbônico na atmosfera passou a subir de forma significativa?', 'options', jsonb_build_array('A partir da Revolução Industrial', 'A partir da Grande Oxidação', 'A partir do século vinte', 'A partir de 2000'), 'correct', 0),
      jsonb_build_object('id', 5, 'type', 'why',   'question', 'Por que o gás carbônico retém calor na atmosfera?', 'options', jsonb_build_array('Porque é transparente à luz visível e absorve radiação infravermelha', 'Porque reflete toda a luz do Sol', 'Porque é um gás inflamável', 'Porque destrói a camada de ozônio'), 'correct', 0)
    )
  ),
  'pt-BR'
)
ON CONFLICT (title, language) DO NOTHING;

-- ───────────────────────────────────────────────────────────────────────────
-- Diagnostic text 3 — "A Memória e o Sono" (~610 words, HTML)
-- ───────────────────────────────────────────────────────────────────────────
INSERT INTO text (type, title, content, num_words, quiz_json, language)
VALUES (
  'diagnostic',
  'A Memória e o Sono',
  $diag3$<p>Durante muito tempo, o sono foi tratado como um tempo morto, um período em que o cérebro simplesmente esperava o amanhecer. Pesquisas recentes, porém, mostraram o oposto: o sono é uma fase ativa e essencial para a consolidação da memória e para a regulação do organismo. Ignorar o sono é, literalmente, ignorar parte do processo de aprendizado.</p>

<p>O sono humano é organizado em ciclos de aproximadamente noventa minutos. Cada ciclo percorre estágios distintos, da sonolência leve ao sono profundo e, em seguida, ao sono paradoxal, também chamado de sono REM, em que ocorrem a maioria dos sonhos. O cérebro não se mantém igual ao longo desses estágios. A química e a atividade elétrica mudam de forma significativa, e cada estágio cumpre uma função.</p>

<p>Durante o sono profundo, o cérebro revisita e reforça memórias recém-formadas. Estudos de imagem mostram que os mesmos circuitos ativados durante o dia, enquanto a pessoa aprendia uma tarefa, são reativados à noite, em sequências compactadas. Essa repetição silenciosa fortalece as conexões sinápticas e transfere informações da memória de curto prazo, dependente do hipocampo, para a memória de longo prazo, distribuída no córtex.</p>

<p>O sono paradoxal, por sua vez, parece envolver a reorganização emocional e a integração de memórias com experiências anteriores. É também nesse estágio que sonhos mais narrativos e vívidos ocorrem. Embora ainda se debata a função exata dos sonhos, há consenso de que o sono paradoxal contribui para a flexibilidade cognitiva e para a criatividade.</p>

<p>O sono não se ocupa apenas de guardar o que foi aprendido. Ele também seleciona. Durante a noite, o cérebro descarta parte das informações que absorveu. Esse esquecimento é tão ativo quanto a fixação. Sem essa poda, o cérebro ficaria sobrecarregado com detalhes irrelevantes e teria dificuldade em recuperar o que realmente importa.</p>

<p>A privação de sono tem efeitos mensuráveis. Após uma única noite mal dormida, a capacidade de concentração cai, o tempo de reação aumenta e a sensibilidade a estímulos emocionais negativos cresce. Após várias noites seguidas, esses efeitos se acumulam e começam a afetar julgamento e autocontrole. Curiosamente, a pessoa privada de sono costuma subestimar o próprio prejuízo.</p>

<p>Um experimento clássico, conduzido na Universidade da Califórnia, demonstrou que dormir após aprender uma tarefa motora pode melhorar o desempenho em até vinte por cento, mesmo sem prática adicional. O grupo que dormia entre as sessões de teste apresentava ganhos que o grupo privado de sono não alcançava, por mais que repetisse a tarefa. O cérebro aprendia enquanto o corpo repousava.</p>

<p>O mesmo se aplica a memórias declarativas, como listas de palavras ou fatos. Estudantes que revisam o material antes de dormir costumam recordar melhor do que aqueles que revisam o mesmo material pela manhã e passam o dia sem retornar ao conteúdo. O sono não substitui o estudo, mas age como um amplificador silencioso dele.</p>

<p>Há também a questão do esquecimento seletivo. Memórias carregadas de forte conteúdo emocional, como um susto ou uma perda, são processadas de forma diferente. Durante o sono paradoxal, a presença reduzida de noradrenalina parece permitir que o cérebro relembre o evento sem reviver toda a intensidade emocional. Com o tempo, isso ajuda a suavizar o impacto afetivo da memória, sem apagar o conteúdo factual.</p>

<p>A relação entre sono e memória também explica por que a rotina moderna, com telas brilhantes à noite e horários irregulares, prejudica o aprendizado. A luz azul emitida por telas suprime a melatonina, o hormônio que sinaliza ao cérebro que está na hora de dormir. O resultado é um sono mais curto, mais fragmentado e com menos tempo nas fases profundas.</p>

<p>Hábitos simples ajudam a preservar essa função. Manter horários regulares, evitar telas na hora que antecede o sono, expor-se à luz natural pela manhã e reduzir cafeína após o meio-dia são medidas consistentes com o que os estudos recomendam. Não são soluções mágicas, mas preservam as condições sob as quais o cérebro realiza, em silêncio, parte essencial do trabalho que chamamos de aprender.</p>$diag3$,
  655,
  jsonb_build_object(
    'questions', jsonb_build_array(
      jsonb_build_object('id', 1, 'type', 'what',  'question', 'O que o sono profundo faz com as memórias recém-formadas?', 'options', jsonb_build_array('As apaga completamente', 'As reativa e reforça as conexões sinápticas', 'As transfere apenas para a memória de curto prazo', 'As mantém sem alteração'), 'correct', 1),
      jsonb_build_object('id', 2, 'type', 'where', 'question', 'Em qual estrutura se concentram as memórias de curto prazo antes de serem consolidadas?', 'options', jsonb_build_array('No córtex', 'No hipocampo', 'No cerebelo', 'No bulbo'), 'correct', 1),
      jsonb_build_object('id', 3, 'type', 'when',  'question', 'Em qual estágio do sono ocorrem a maioria dos sonhos vívidos?', 'options', jsonb_build_array('Sono profundo', 'Sono paradoxal (REM)', 'Sonolência leve', 'Pré-sono'), 'correct', 1),
      jsonb_build_object('id', 4, 'type', 'who',   'question', 'Qual universidade conduziu o experimento clássico que mostrou melhora de até vinte por cento no desempenho após dormir?', 'options', jsonb_build_array('Universidade de Harvard', 'Universidade da Califórnia', 'Universidade de Oxford', 'Universidade de Tóquio'), 'correct', 1),
      jsonb_build_object('id', 5, 'type', 'why',   'question', 'Por que a luz azul das telas prejudica o sono?', 'options', jsonb_build_array('Porque aumenta a noradrenalina', 'Porque suprime a melatonina', 'Porque estimula o hipocampo', 'Porque acelera o ciclo REM'), 'correct', 1)
    )
  ),
  'pt-BR'
)
ON CONFLICT (title, language) DO NOTHING;

-- ───────────────────────────────────────────────────────────────────────────
-- Training text 1 — "Pensamentos Curtos" (~280 words, PLAIN TEXT)
-- Plain text only — RsvpDisplay splits on /\s+/; HTML tags would pollute words.
-- ───────────────────────────────────────────────────────────────────────────
INSERT INTO text (type, title, content, num_words, quiz_json, language)
VALUES (
  'training',
  'Pensamentos Curtos',
  $train1$A leitura rápida não é apenas uma questão de velocidade. É uma questão de confiança. Quem lê devagar costuma reler a mesma frase três vezes, não porque não entendeu, mas porque duvidou de ter entendido. Essa releitura silenciosa consome mais tempo do que a própria decodificação das palavras.

O leitor treinado confia na primeira impressão. As palavras deixam um traço, mesmo que vago, e esse traço costuma ser suficiente. Quando a dúvida aparece, ele continua. Se o sentido se revelar nas frases seguintes, tudo se resolve. Se não, ele voltará depois, com objetivo, não por nervosismo.

Há uma analogia útil. Quando você caminha por uma rua desconhecida, não decora cada vitrine. Seus olhos captam o conjunto e o cérebro organiza o todo. Você não precisa reler a rua para saber por onde passou. A memória funciona por associação, não por repetição.

A subvocalização é o hábito de pronunciar mentalmente cada palavra. É um recurso útil para textos difíceis, mas se torna um teto para a velocidade. Quem pronuncia cada palavra não consegue ultrapassar o ritmo da fala, que fica entre duzentos e trezentos palavras por minuto. Para ir além, é preciso começar a reconhecer as palavras pela forma, sem pronunciá-las.

Isso parece estranho no início. A sensação é de estar perdendo conteúdo. Mas, com o treino, a compreensão se mantém e a velocidade cresce. O cérebro é capaz de processar imagens em frações de segundo, e a palavra escrita é, antes de tudo, uma imagem.

O exercício diário, mesmo curto, é mais eficaz do que sessões longas e esporádicas. Dez minutos por dia reorganizam, aos poucos, o padrão de leitura. O progresso não é linear, mas é real.$train1$,
  281,
  jsonb_build_object(
    'questions', jsonb_build_array(
      jsonb_build_object('id', 1, 'type', 'what',  'question', 'O que a subvocalização faz com a velocidade de leitura?', 'options', jsonb_build_array('Aumenta sem limite', 'Funciona como um teto, limitando ao ritmo da fala', 'Não tem efeito', 'Reduz a compreensão'), 'correct', 1),
      jsonb_build_object('id', 2, 'type', 'why',   'question', 'Por que o leitor treinado confia na primeira impressão?', 'options', jsonb_build_array('Porque as palavras deixam um traço suficiente', 'Porque não há tempo para duvidar', 'Porque reler é proibido', 'Porque a memória é visual apenas'), 'correct', 0),
      jsonb_build_object('id', 3, 'type', 'when',  'question', 'Quando o leitor deve voltar a uma frase?', 'options', jsonb_build_array('Sempre que tiver dúvida', 'Nunca', 'Quando o sentido não se revelar nas frases seguintes', 'A cada três palavras'), 'correct', 2),
      jsonb_build_object('id', 4, 'type', 'where', 'question', 'A que se compara a leitura de uma rua desconhecida?', 'options', jsonb_build_array('À decoração de cada vitrine', 'À captura do conjunto pelos olhos e a organização pelo cérebro', 'À releitura de um mapa', 'À contagem de passos'), 'correct', 1),
      jsonb_build_object('id', 5, 'type', 'who',   'question', 'Quem não consegue ultrapassar o ritmo da fala?', 'options', jsonb_build_array('Quem reconhece as palavras pela forma', 'Quem pronuncia cada palavra mentalmente', 'Quem lê em voz alta apenas', 'Quem usa dicionário'), 'correct', 1)
    )
  ),
  'pt-BR'
)
ON CONFLICT (title, language) DO NOTHING;

-- ───────────────────────────────────────────────────────────────────────────
-- Training text 2 — "O Hábito e o Cérebro" (~420 words, PLAIN TEXT)
-- ───────────────────────────────────────────────────────────────────────────
INSERT INTO text (type, title, content, num_words, quiz_json, language)
VALUES (
  'training',
  'O Hábito e o Cérebro',
  $train2$O hábito é o mecanismo pelo qual o cérebro converte ações repetidas em automatismos. Cada vez que repetimos um comportamento na mesma situação, o cérebro economiza energia ao delegar essa ação a circuitos mais antigos, localizados nos gânglios da base. O córtex, responsável pela decisão consciente, deixa de participar ativamente, e a ação passa a ocorrer quase sozinha.

Essa economia é vantajosa. Imagine se cada manhã você precisasse decidir de novo como escovar os dentes, em que ordem, com qual mão, por quanto tempo. O hábito libera o córtex para pensar em outras coisas enquanto ações básicas são executadas em piloto automático.

O problema é que o mesmo mecanismo que cria bons hábitos cria também os ruins. O cérebro não distingue entre um e outro. Ele apenas registra repetição e contexto. Fumar um cigarro no mesmo ponto da calçada, todos os dias, às mesmas horas, cria um circuito tão robusto quanto o de calçar os sapatos. O hábito se fixa pela repetição, não pelo conteúdo moral da ação.

Um hábito tem três partes, segundo o modelo clássico: a deixa, a rotina e a recompensa. A deixa é o gatilho que inicia o comportamento. Pode ser um horário, um lugar, um estado emocional ou a presença de uma pessoa. A rotina é o comportamento em si. A recompensa é o que o cérebro recebe ao final e que faz valer a pena repetir no futuro.

Para mudar um hábito, é mais eficaz substituir a rotina do que simplesmente tentar eliminá-la. Mantendo a mesma deixa e buscando uma recompensa equivalente, o cérebro aceita a troca com menos resistência. Eliminar o gatilho costuma ser difícil, porque muitos gatilhos são externos e fora do controle. Substituir a rotina, em troca, está ao alcance.

O tempo necessário para formar um hábito varia. Estudos indicam que, em média, são necessários cerca de sessenta e seis dias de repetição para que um comportamento se torne automático. A variação é grande. Hábitos simples podem se fixar em poucas semanas; hábitos complexos podem pedir meses. O que importa não é a duração exata, mas a consistência. Faltar um dia não apaga o progresso. Faltar sistematicamente, sim.

Pequenos gestos, repetidos em contextos estáveis, são mais eficazes do que grandes gestos esporádicos. Quem decide ler dez minutos por dia, sempre antes de dormir, costuma ler mais ao longo de um ano do que quem pretende ler duas horas aos sábados. O hábito se constrói por frequência, não por intensidade.

Compreender o mecanismo do hábito ajuda a tratar a própria mente com mais paciência. Não se trata de força de vontade isolada. Trata-se de desenhar o ambiente e o contexto de forma que a repetição ocorra naturalmente e a ação desejada se torne a opção mais fácil.$train2$,
  423,
  jsonb_build_object(
    'questions', jsonb_build_array(
      jsonb_build_object('id', 1, 'type', 'what',  'question', 'O que o cérebro faz com ações repetidas na mesma situação?', 'options', jsonb_build_array('As elimina', 'As converte em automatismos nos gânglios da base', 'As amplifica no córtex', 'As transfere para o cerebelo'), 'correct', 1),
      jsonb_build_object('id', 2, 'type', 'who',   'question', 'Quem deixa de participar ativamente quando o hábito se instala?', 'options', jsonb_build_array('Os gânglios da base', 'O córtex', 'O hipocampo', 'O bulbo'), 'correct', 1),
      jsonb_build_object('id', 3, 'type', 'when',  'question', 'Em média, quantos dias de repetição são necessários para que um comportamento se torne automático?', 'options', jsonb_build_array('Vinte e um dias', 'Sessenta e seis dias', 'Cem dias', 'Cento e oitenta dias'), 'correct', 1),
      jsonb_build_object('id', 4, 'type', 'where', 'question', 'Onde estão os circuitos mais antigos que executam hábitos?', 'options', jsonb_build_array('No córtex', 'No cerebelo', 'Nos gânglios da base', 'No lobo frontal'), 'correct', 2),
      jsonb_build_object('id', 5, 'type', 'why',   'question', 'Por que é mais eficaz substituir a rotina do que eliminar o gatilho?', 'options', jsonb_build_array('Porque muitos gatilhos são externos e fora do controle', 'Porque o córtex não aceita mudanças', 'Porque a recompensa não importa', 'Porque a eliminação é mais rápida'), 'correct', 0)
    )
  ),
  'pt-BR'
)
ON CONFLICT (title, language) DO NOTHING;

-- ───────────────────────────────────────────────────────────────────────────
-- Training text 3 — "O Atraso das Estrelas" (~350 words, PLAIN TEXT)
-- ───────────────────────────────────────────────────────────────────────────
INSERT INTO text (type, title, content, num_words, quiz_json, language)
VALUES (
  'training',
  'O Atraso das Estrelas',
  $train3$Quando olhamos para uma estrela no céu noturno, não a vemos como ela é agora. Vemos como ela era há muito tempo. A luz, embora seja a coisa mais rápida que conhecemos, não se move instantaneamente. Ela percorre cerca de trezentos mil quilômetros por segundo, o que parece muito, mas é lento diante das distâncias do universo.

O Sol está a aproximadamente oito minutos de luz da Terra. Se ele se apagasse neste instante, ainda veríamos sua luz brilhando por oito minutos. A Lua está a cerca de um segundo de luz. Marte, dependendo da posição, pode estar a vinte minutos de luz. Esses atrasos são curtos, quase imperceptíveis, mas já mostram que olhar o céu é olhar o passado.

Quando passamos às estrelas, os números ficam desproporcionais. A estrela mais próxima do Sol, Proxima Centauri, está a pouco mais de quatro anos de luz. Ou seja, a luz que dela recebemos hoje partiu há mais de quatro anos. Algumas estrelas visíveis a olho nu estão a centenas ou milhares de anos de luz. Se uma delas explodiu no ano mil, poderíamos estar vendo a explosão agora.

Isso tem uma consequência curiosa. Não existe um único presente para todo o universo. O presente que você enxerga depende de onde está e do quão longe está olhando. Cada observador tem, em sentido prático, um presente diferente, recortado pela velocidade da luz.

Astrônomos aproveitam esse atraso para estudar o passado do cosmos. Galáxias distantes aparecem como eram há bilhões de anos. Quanto mais longe se observa, mais antiga é a imagem. Telescópios potentes funcionam, assim, como máquinas do tempo. Não mostram o universo em um instante único, mas em fatias sucessivas do seu próprio passado.

Há também uma versão cotidiana desse atraso, muito mais modesta. Tudo o que você vê é o que foi. A luz da tela à sua frente levou bilionésimos de segundo para alcançar seus olhos. A voz que você ouve saiu da boca de alguém poucos milissegundos atrás. Nunca percebemos o presente exato, sempre uma cópia levemente atrasada. O atraso das estrelas apenas torna esse fato mais fácil de ver.

Por isso, quando alguém aponta para uma estrela e diz que ela é bela, está fazendo mais do que um elogio. Está elogiando uma imagem que viaja há anos, às vezes há séculos, para chegar até nós. Entre a estrela e o olho, todo esse tempo esteve a caminho.$train3$,
  353,
  jsonb_build_object(
    'questions', jsonb_build_array(
      jsonb_build_object('id', 1, 'type', 'what',  'question', 'O que significa ver uma estrela como ela era há muito tempo?', 'options', jsonb_build_array('Que a luz viaja instantaneamente', 'Que a luz da estrela levou anos para chegar até nós', 'Que a estrela está parada', 'Que a estrela é uma ilusão'), 'correct', 1),
      jsonb_build_object('id', 2, 'type', 'where', 'question', 'Onde está a estrela mais próxima do Sol?', 'options', jsonb_build_array('Em Proxima Centauri', 'Na Via Láctea central', 'No sistema solar', 'Em Saturno'), 'correct', 0),
      jsonb_build_object('id', 3, 'type', 'when',  'question', 'Há quanto tempo partiu a luz que hoje recebemos de Proxima Centauri?', 'options', jsonb_build_array('Oito minutos', 'Pouco mais de quatro anos', 'Vinte minutos', 'Cem anos'), 'correct', 1),
      jsonb_build_object('id', 4, 'type', 'who',   'question', 'Quem aproveita o atraso da luz para estudar o passado do cosmos?', 'options', jsonb_build_array('Os geólogos', 'Os astrônomos', 'Os historiadores', 'Os navegadores'), 'correct', 1),
      jsonb_build_object('id', 5, 'type', 'why',   'question', 'Por que não existe um único presente para todo o universo?', 'options', jsonb_build_array('Porque cada observador recorta o presente segundo a velocidade da luz', 'Porque o universo não tem tempo', 'Porque o tempo é uma ilusão', 'Porque o universo está parado'), 'correct', 0)
    )
  ),
  'pt-BR'
)
ON CONFLICT (title, language) DO NOTHING;

COMMIT;